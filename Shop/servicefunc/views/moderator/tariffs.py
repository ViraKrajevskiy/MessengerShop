from datetime import timedelta

from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from Shop.models import Business
from Shop.servicefunc.views.verification.verification import IsModerator

PERIOD_DAYS = {
    'MONTH':   30,
    'QUARTER': 90,
    'YEAR':    365,
}


class ModeratorBusinessListView(APIView):
    """
    GET /api/moderator/businesses/
    Returns all businesses with their current plan info.
    """
    permission_classes = [IsAuthenticated, IsModerator]

    def get(self, request):
        qs = Business.objects.select_related('owner').order_by('-created_at')
        data = []
        for b in qs:
            logo = None
            if b.logo:
                try:
                    logo = request.build_absolute_uri(b.logo.url)
                except Exception:
                    pass

            data.append({
                'id':              b.id,
                'brand_name':      b.brand_name,
                'logo':            logo,
                'owner_email':     b.owner.email,
                'plan_type':       b.plan_type,
                'plan_period':     b.plan_period,
                'plan_expires_at': b.plan_expires_at,
                'is_verified':     b.is_verified,
                'is_vip':          b.is_vip,
                'is_pro':          b.is_pro,
            })

        return Response(data)


class ModeratorTariffAssignView(APIView):
    """
    PATCH /api/moderator/businesses/<pk>/tariff/
    Body: { plan_type: FREE|PRO|VIP, plan_period?: MONTH|QUARTER|YEAR }
    Assigns a tariff plan to a business.
    """
    permission_classes = [IsAuthenticated, IsModerator]

    def patch(self, request, pk):
        try:
            business = Business.objects.get(pk=pk)
        except Business.DoesNotExist:
            return Response({'detail': 'Бизнес не найден.'}, status=404)

        plan_type   = request.data.get('plan_type', '').upper()
        plan_period = request.data.get('plan_period', '').upper() or None

        valid_plans = [p.value for p in Business.PlanType]
        if plan_type not in valid_plans:
            return Response({'detail': f'Допустимые тарифы: {", ".join(valid_plans)}'}, status=400)

        business.plan_type = plan_type

        if plan_type == Business.PlanType.FREE:
            business.plan_period     = None
            business.plan_expires_at = None
        else:
            if plan_period not in PERIOD_DAYS:
                return Response({'detail': 'Укажите plan_period: MONTH, QUARTER или YEAR.'}, status=400)
            days = PERIOD_DAYS[plan_period]
            business.plan_period     = plan_period
            business.plan_expires_at = timezone.now() + timedelta(days=days)

        business.save(update_fields=['plan_type', 'plan_period', 'plan_expires_at'])

        return Response({
            'id':              business.id,
            'brand_name':      business.brand_name,
            'plan_type':       business.plan_type,
            'plan_period':     business.plan_period,
            'plan_expires_at': business.plan_expires_at,
        })
