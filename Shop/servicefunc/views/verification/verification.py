from django.utils import timezone
from drf_spectacular.utils import extend_schema, OpenApiResponse
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from Shop.models import Business, VerificationRequest, VerificationDocument, VerificationMessage, User
from Shop.permissions import IsBusinessman
from Shop.servicefunc.serializers.verification_serializer import (
    VerificationRequestSerializer,
    VerificationListSerializer,
    VerificationMessageSerializer,
    ReviewSerializer,
)


class IsModerator(IsAuthenticated):
    message = 'Только модераторы.'
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == User.Role.MODERATOR


# ── Бизнесмен: создать / посмотреть свою заявку ───────────────────────────────

@extend_schema(tags=['Verification'])
class MyVerificationView(APIView):
    permission_classes = [IsBusinessman]

    @extend_schema(
        summary='Моя заявка на верификацию',
        responses={
            200: VerificationRequestSerializer,
            404: OpenApiResponse(description='Заявка ещё не создана'),
        },
    )
    def get(self, request):
        try:
            biz = request.user.business_profile
            req = biz.verification
        except (Business.DoesNotExist, VerificationRequest.DoesNotExist):
            return Response({'detail': 'Заявка не найдена.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(VerificationRequestSerializer(req, context={'request': request}).data)

    @extend_schema(
        summary='Создать заявку на верификацию',
        description='Бизнесмен создаёт заявку. После этого — загружает документы и переписывается с модератором.',
        responses={
            201: VerificationRequestSerializer,
            400: OpenApiResponse(description='Заявка уже существует или нет бизнес-профиля'),
        },
    )
    def post(self, request):
        try:
            biz = request.user.business_profile
        except Business.DoesNotExist:
            return Response({'detail': 'Сначала создайте бизнес-профиль.'}, status=status.HTTP_400_BAD_REQUEST)

        if hasattr(biz, 'verification'):
            return Response(
                {'detail': 'Заявка уже создана.', 'status': biz.verification.status},
                status=status.HTTP_400_BAD_REQUEST,
            )

        req = VerificationRequest.objects.create(business=biz)
        # Системное сообщение в чате
        VerificationMessage.objects.create(
            request=req,
            sender=request.user,
            text=(
                'Здравствуйте! Я хочу подтвердить свой бизнес-аккаунт. '
                'Готов предоставить необходимые документы.'
            ),
        )
        return Response(
            VerificationRequestSerializer(req, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


# ── Загрузка документов ───────────────────────────────────────────────────────

@extend_schema(tags=['Verification'])
class UploadDocumentView(APIView):
    permission_classes = [IsBusinessman]

    @extend_schema(
        summary='Загрузить документ',
        description='Бизнесмен загружает документ для верификации (паспорт, свидетельство, лицензия и т.д.)',
        responses={
            201: OpenApiResponse(description='Документ загружен'),
            400: OpenApiResponse(description='Нет файла или заявки'),
        },
    )
    def post(self, request):
        try:
            req = request.user.business_profile.verification
        except (Business.DoesNotExist, VerificationRequest.DoesNotExist):
            return Response({'detail': 'Сначала создайте заявку.'}, status=status.HTTP_400_BAD_REQUEST)

        if req.status == VerificationRequest.Status.APPROVED:
            return Response({'detail': 'Аккаунт уже верифицирован.'}, status=status.HTTP_400_BAD_REQUEST)

        file = request.FILES.get('file')
        if not file:
            return Response({'detail': 'Файл обязателен.'}, status=status.HTTP_400_BAD_REQUEST)

        doc = VerificationDocument.objects.create(
            request=req, file=file, name=file.name,
        )
        # Сообщение в чат о загрузке
        VerificationMessage.objects.create(
            request=req, sender=request.user,
            text='', file=doc.file, file_name=file.name,
        )
        return Response({'id': doc.id, 'name': doc.name}, status=status.HTTP_201_CREATED)


# ── Чат: отправить сообщение ──────────────────────────────────────────────────

@extend_schema(tags=['Verification'])
class VerificationChatView(APIView):
    permission_classes = [IsAuthenticated]

    def get_request(self, user):
        """Возвращает заявку для бизнесмена или по ID для модератора"""
        if user.role == User.Role.BUSINESS:
            try:
                return user.business_profile.verification
            except (Business.DoesNotExist, VerificationRequest.DoesNotExist):
                return None
        return None

    @extend_schema(
        summary='Отправить сообщение в чат верификации',
        responses={
            201: VerificationMessageSerializer,
            400: OpenApiResponse(description='Нет заявки или пустое сообщение'),
        },
    )
    def post(self, request, req_id=None):
        # Бизнесмен — пишет в свою заявку
        if request.user.role == User.Role.BUSINESS:
            ver_req = self.get_request(request.user)
            if not ver_req:
                return Response({'detail': 'Заявка не найдена.'}, status=status.HTTP_404_NOT_FOUND)
        # Модератор — пишет в конкретную заявку
        elif request.user.role == User.Role.MODERATOR:
            try:
                ver_req = VerificationRequest.objects.get(pk=req_id)
            except VerificationRequest.DoesNotExist:
                return Response({'detail': 'Заявка не найдена.'}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({'detail': 'Нет доступа.'}, status=status.HTTP_403_FORBIDDEN)

        text = request.data.get('text', '').strip()
        if not text:
            return Response({'detail': 'Сообщение не может быть пустым.'}, status=status.HTTP_400_BAD_REQUEST)

        msg = VerificationMessage.objects.create(request=ver_req, sender=request.user, text=text)
        return Response(
            VerificationMessageSerializer(msg, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


# ── Модератор: список заявок ──────────────────────────────────────────────────

@extend_schema(tags=['Verification / Moderator'])
class ModeratorVerificationListView(APIView):
    permission_classes = [IsModerator]

    @extend_schema(
        summary='Список заявок на верификацию (модератор)',
        description='Только для модераторов. Фильтр по status=PENDING/APPROVED/REJECTED',
        responses={200: VerificationListSerializer(many=True)},
    )
    def get(self, request):
        qs = VerificationRequest.objects.select_related('business__owner').all()
        s = request.query_params.get('status')
        if s:
            qs = qs.filter(status=s)
        return Response(VerificationListSerializer(qs, many=True).data)


@extend_schema(tags=['Verification / Moderator'])
class ModeratorVerificationDetailView(APIView):
    permission_classes = [IsModerator]

    def get_object(self, pk):
        try:
            return VerificationRequest.objects.select_related(
                'business__owner'
            ).prefetch_related('documents', 'messages__sender').get(pk=pk)
        except VerificationRequest.DoesNotExist:
            return None

    @extend_schema(
        summary='Детали заявки (модератор)',
        responses={200: VerificationRequestSerializer},
    )
    def get(self, request, pk):
        req = self.get_object(pk)
        if not req:
            return Response({'detail': 'Не найдена.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(VerificationRequestSerializer(req, context={'request': request}).data)

    @extend_schema(
        summary='Подтвердить или отклонить заявку (модератор)',
        request=ReviewSerializer,
        responses={
            200: OpenApiResponse(description='Статус обновлён'),
            400: OpenApiResponse(description='Неверное действие'),
        },
    )
    def patch(self, request, pk):
        req = self.get_object(pk)
        if not req:
            return Response({'detail': 'Не найдена.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ReviewSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        action  = serializer.validated_data['action']
        comment = serializer.validated_data['comment']

        if action == 'approve':
            req.status = VerificationRequest.Status.APPROVED
            req.business.is_verified = True
            req.business.save(update_fields=['is_verified'])
            system_text = f'✅ Ваш аккаунт подтверждён! {comment}'.strip()
        else:
            req.status = VerificationRequest.Status.REJECTED
            system_text = f'❌ Заявка отклонена. {comment}'.strip()

        req.comment     = comment
        req.reviewed_by = request.user
        req.reviewed_at = timezone.now()
        req.save(update_fields=['status', 'comment', 'reviewed_by', 'reviewed_at'])

        # Системное сообщение бизнесмену
        VerificationMessage.objects.create(
            request=req, sender=request.user, text=system_text,
        )

        return Response({
            'status': req.status,
            'message': 'Аккаунт подтверждён.' if action == 'approve' else 'Заявка отклонена.',
        })
