"""
Payment proof views.
- Business submits proof of payment (file + message) → PaymentRequest
- Moderator reviews, approves (assigns tariff) or rejects
"""
from datetime import timedelta

from django.utils import timezone
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from Shop.models import PaymentRequest, Business
from Shop.permissions import IsBusinessman
from Shop.servicefunc.views.moderator.tariffs import PERIOD_DAYS
from Shop.servicefunc.views.verification.verification import IsModerator


def _serialize_payment(req, request=None):
    proof_url = None
    if req.proof_file:
        try:
            proof_url = request.build_absolute_uri(req.proof_file.url) if request else req.proof_file.url
        except Exception:
            pass

    logo_url = None
    if req.business.logo:
        try:
            logo_url = request.build_absolute_uri(req.business.logo.url) if request else req.business.logo.url
        except Exception:
            pass

    return {
        'id':             req.id,
        'plan_type':      req.plan_type,
        'plan_period':    req.plan_period,
        'message':        req.message,
        'proof_file':     proof_url,
        'status':         req.status,
        'rejection_note': req.rejection_note,
        'reviewed_at':    req.reviewed_at,
        'reviewed_by':    req.reviewed_by.email if req.reviewed_by else None,
        'created_at':     req.created_at,
        'business': {
            'id':         req.business.id,
            'brand_name': req.business.brand_name,
            'logo':       logo_url,
            'owner_email': req.business.owner.email,
        },
    }


# ── Business: submit payment proof ────────────────────────────────────────────
class PaymentRequestCreateView(APIView):
    """
    POST /api/tariff/payment/
    multipart: { plan_type, plan_period?, message?, proof_file? }
    """
    permission_classes = [IsBusinessman]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        try:
            business = request.user.business_profile
        except Business.DoesNotExist:
            return Response({'detail': 'Сначала создайте бизнес-профиль.'}, status=400)

        plan_type   = request.data.get('plan_type', '').upper()
        plan_period = request.data.get('plan_period', '').upper() or None
        message     = request.data.get('message', '')
        proof_file  = request.FILES.get('proof_file')

        valid_plans = [p.value for p in Business.PlanType]
        if plan_type not in valid_plans or plan_type == 'FREE':
            return Response({'detail': 'Укажите plan_type: PRO или VIP.'}, status=400)

        if plan_period and plan_period not in PERIOD_DAYS:
            return Response({'detail': 'plan_period: MONTH, QUARTER или YEAR.'}, status=400)

        # Проверяем, нет ли уже активной заявки
        existing = PaymentRequest.objects.filter(
            business=business, status=PaymentRequest.Status.PENDING
        ).first()
        if existing:
            return Response({'detail': 'У вас уже есть заявка на рассмотрении.', 'id': existing.id}, status=400)

        payment = PaymentRequest.objects.create(
            business=business,
            plan_type=plan_type,
            plan_period=plan_period,
            message=message,
            proof_file=proof_file,
        )
        return Response(_serialize_payment(payment, request), status=201)


class PaymentRequestStatusView(APIView):
    """GET /api/tariff/payment/ — бизнес видит свои заявки"""
    permission_classes = [IsBusinessman]

    def get(self, request):
        try:
            business = request.user.business_profile
        except Business.DoesNotExist:
            return Response([], status=200)
        payments = PaymentRequest.objects.filter(business=business).order_by('-created_at')
        return Response([_serialize_payment(p, request) for p in payments])


# ── Moderator: review payment requests ────────────────────────────────────────
class ModeratorPaymentListView(APIView):
    """GET /api/moderator/payments/?status=PENDING"""
    permission_classes = [IsAuthenticated, IsModerator]

    def get(self, request):
        qs = PaymentRequest.objects.select_related(
            'business', 'business__owner', 'business__logo', 'reviewed_by'
        ).order_by('-created_at')
        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter.upper())
        return Response([_serialize_payment(p, request) for p in qs])


class ModeratorPaymentDetailView(APIView):
    """PATCH /api/moderator/payments/<pk>/ → { action: approve|reject, rejection_note? }"""
    permission_classes = [IsAuthenticated, IsModerator]

    def patch(self, request, pk):
        try:
            payment = PaymentRequest.objects.select_related('business').get(pk=pk)
        except PaymentRequest.DoesNotExist:
            return Response({'detail': 'Заявка не найдена.'}, status=404)

        if payment.status != PaymentRequest.Status.PENDING:
            return Response({'detail': 'Заявка уже обработана.'}, status=400)

        action = request.data.get('action', '').lower()
        if action not in ('approve', 'reject'):
            return Response({'detail': 'action: approve или reject.'}, status=400)

        payment.reviewed_by = request.user
        payment.reviewed_at = timezone.now()

        if action == 'approve':
            payment.status = PaymentRequest.Status.APPROVED
            # Assign tariff to business
            business = payment.business
            business.plan_type   = payment.plan_type
            business.plan_period = payment.plan_period
            days = PERIOD_DAYS.get(payment.plan_period, 30)
            business.plan_expires_at = timezone.now() + timedelta(days=days)
            business.save(update_fields=['plan_type', 'plan_period', 'plan_expires_at'])
        else:
            payment.status         = PaymentRequest.Status.REJECTED
            payment.rejection_note = request.data.get('rejection_note', '')

        payment.save(update_fields=['status', 'reviewed_by', 'reviewed_at', 'rejection_note'])
        return Response(_serialize_payment(payment, request))
