"""Surveys (опросы).

Plain polls — there is NO correct/incorrect answer. Created/managed only
by moderators (one question, N options, SINGLE or MULTIPLE choice,
moderator-editable priority). Businessmen see active surveys (ordered by
priority) in their dashboard and submit their choice.
"""
from django.db import transaction
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from Shop.models import Survey, SurveyOption, SurveyResponse, Business
from Shop.permissions.role_businessman_permission import IsBusinessman
from Shop.servicefunc.views.verification.verification import IsModerator

VALID_TYPES = {c[0] for c in Survey.SurveyType.choices}


# ── Serialization helpers ────────────────────────────────────────────────────
def _survey_dict(survey):
    return {
        'id':          survey.id,
        'question':    survey.question,
        'survey_type': survey.survey_type,
        'priority':    survey.priority,
        'is_active':   survey.is_active,
        'created_at':  survey.created_at,
        'responses_count': survey.responses.count(),
        'options': [{'id': o.id, 'text': o.text} for o in survey.options.all()],
    }


def _parse_options(raw):
    """raw: [{text}] → cleaned list of texts. Returns (options, error)."""
    if not isinstance(raw, list) or not raw:
        return None, 'Нужен хотя бы один вариант ответа.'
    cleaned = []
    for item in raw:
        text = str((item or {}).get('text', '') if isinstance(item, dict) else item).strip()
        if not text:
            return None, 'Текст варианта не может быть пустым.'
        cleaned.append(text)
    if len(cleaned) < 2:
        return None, 'Нужно минимум 2 варианта ответа.'
    return cleaned, None


# ── Moderator: CRUD + priority ───────────────────────────────────────────────
class ModeratorSurveyListView(APIView):
    permission_classes = [IsAuthenticated, IsModerator]

    def get(self, request):
        qs = (Survey.objects
              .prefetch_related('options', 'responses')
              .order_by('-priority', '-created_at'))
        return Response([_survey_dict(s) for s in qs])

    def post(self, request):
        question = str(request.data.get('question', '')).strip()
        survey_type = request.data.get('survey_type', Survey.SurveyType.SINGLE)
        if not question:
            return Response({'detail': 'Вопрос обязателен.'}, status=400)
        if survey_type not in VALID_TYPES:
            return Response({'detail': 'Неверный тип опроса.'}, status=400)

        options, err = _parse_options(request.data.get('options'))
        if err:
            return Response({'detail': err}, status=400)

        with transaction.atomic():
            survey = Survey.objects.create(
                question=question,
                survey_type=survey_type,
                priority=int(request.data.get('priority') or 0),
                is_active=bool(request.data.get('is_active', True)),
                created_by=request.user,
            )
            SurveyOption.objects.bulk_create([
                SurveyOption(survey=survey, text=t) for t in options
            ])
        return Response(_survey_dict(survey), status=201)


class ModeratorSurveyDetailView(APIView):
    permission_classes = [IsAuthenticated, IsModerator]

    def _get(self, pk):
        return Survey.objects.prefetch_related('options', 'responses').filter(pk=pk).first()

    def get(self, request, pk):
        survey = self._get(pk)
        if not survey:
            return Response({'detail': 'Опрос не найден.'}, status=404)
        return Response(_survey_dict(survey))

    def patch(self, request, pk):
        survey = self._get(pk)
        if not survey:
            return Response({'detail': 'Опрос не найден.'}, status=404)

        if 'question' in request.data:
            q = str(request.data.get('question', '')).strip()
            if not q:
                return Response({'detail': 'Вопрос не может быть пустым.'}, status=400)
            survey.question = q
        if 'survey_type' in request.data:
            st = request.data.get('survey_type')
            if st not in VALID_TYPES:
                return Response({'detail': 'Неверный тип опроса.'}, status=400)
            survey.survey_type = st
        if 'priority' in request.data:
            try:
                survey.priority = max(0, int(request.data.get('priority')))
            except (TypeError, ValueError):
                return Response({'detail': 'Приоритет должен быть числом.'}, status=400)
        if 'is_active' in request.data:
            survey.is_active = bool(request.data.get('is_active'))

        new_options = None
        if 'options' in request.data:
            new_options, err = _parse_options(request.data.get('options'))
            if err:
                return Response({'detail': err}, status=400)

        with transaction.atomic():
            survey.save()
            if new_options is not None:
                survey.options.all().delete()
                SurveyOption.objects.bulk_create([
                    SurveyOption(survey=survey, text=t) for t in new_options
                ])
        survey.refresh_from_db()
        return Response(_survey_dict(survey))

    def delete(self, request, pk):
        survey = self._get(pk)
        if not survey:
            return Response({'detail': 'Опрос не найден.'}, status=404)
        survey.delete()
        return Response(status=204)


# ── Businessman: list active + submit ────────────────────────────────────────
class SurveyListView(APIView):
    permission_classes = [IsAuthenticated, IsBusinessman]

    def get(self, request):
        qs = (Survey.objects
              .filter(is_active=True)
              .prefetch_related('options')
              .order_by('-priority', '-created_at'))
        answered = {
            r.survey_id: r
            for r in SurveyResponse.objects.filter(user=request.user, survey__in=qs)
        }
        data = []
        for s in qs:
            resp = answered.get(s.id)
            entry = _survey_dict(s)
            entry['answered'] = resp is not None
            if resp is not None:
                entry['my_result'] = {'selected': resp.selected}
            data.append(entry)
        return Response(data)


class SurveyRespondView(APIView):
    permission_classes = [IsAuthenticated, IsBusinessman]

    def post(self, request, pk):
        survey = (Survey.objects
                  .filter(pk=pk, is_active=True)
                  .prefetch_related('options')
                  .first())
        if not survey:
            return Response({'detail': 'Опрос не найден или неактивен.'}, status=404)

        if SurveyResponse.objects.filter(survey=survey, user=request.user).exists():
            return Response({'detail': 'Вы уже проходили этот опрос.'}, status=400)

        selected = request.data.get('selected')
        if not isinstance(selected, list) or not selected:
            return Response({'detail': 'Выберите вариант ответа.'}, status=400)
        try:
            selected_ids = {int(x) for x in selected}
        except (TypeError, ValueError):
            return Response({'detail': 'Неверный формат ответа.'}, status=400)

        option_ids = {o.id for o in survey.options.all()}
        if not selected_ids.issubset(option_ids):
            return Response({'detail': 'Выбран несуществующий вариант.'}, status=400)
        if survey.survey_type == Survey.SurveyType.SINGLE and len(selected_ids) != 1:
            return Response({'detail': 'Для этого опроса нужен ровно один ответ.'}, status=400)

        response = SurveyResponse.objects.create(
            survey=survey,
            user=request.user,
            selected=sorted(selected_ids),
        )
        return Response({'id': response.id, 'selected': response.selected}, status=201)


# ── Public: a business's survey answers (shop profile «О бизнесе») ────────────
class BusinessSurveyAnswersView(APIView):
    """Public — what this business answered in moderator surveys.
    Shown on the public shop profile between «О нас» and «Характеристики»."""
    permission_classes = [AllowAny]

    def get(self, request, pk):
        business = Business.objects.filter(pk=pk).select_related('owner').first()
        if not business or not business.owner_id:
            return Response([])

        responses = (SurveyResponse.objects
                     .filter(user_id=business.owner_id, survey__is_active=True)
                     .select_related('survey')
                     .prefetch_related('survey__options')
                     .order_by('-survey__priority', '-survey__created_at'))

        data = []
        for r in responses:
            opts = {o.id: o.text for o in r.survey.options.all()}
            answers = [opts[i] for i in (r.selected or []) if i in opts]
            if not answers:
                continue
            data.append({
                'survey_id':   r.survey_id,
                'question':    r.survey.question,
                'survey_type': r.survey.survey_type,
                'answers':     answers,
            })
        return Response(data)
