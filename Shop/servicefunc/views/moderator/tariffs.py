from datetime import timedelta
from dateutil import parser as dateutil_parser

from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from Shop.models import Business
from Shop.servicefunc.views.verification.verification import IsModerator
from Shop.models import Product

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
                'is_blocked':          b.is_blocked,
                'is_currently_blocked': b.is_currently_blocked,
                'blocked_at':          b.blocked_at,
                'blocked_until':       b.blocked_until,
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


class ModeratorVerifyBusinessView(APIView):
    """
    PATCH /api/moderator/businesses/<pk>/verify/
    Toggles is_verified for a business.
    """
    permission_classes = [IsAuthenticated, IsModerator]

    def patch(self, request, pk):
        try:
            business = Business.objects.get(pk=pk)
        except Business.DoesNotExist:
            return Response({'detail': 'Бизнес не найден.'}, status=404)

        business.is_verified = not business.is_verified
        business.verified_at = timezone.now() if business.is_verified else None
        business.save(update_fields=['is_verified', 'verified_at'])

        return Response({'id': business.id, 'is_verified': business.is_verified, 'verified_at': business.verified_at})


class ModeratorBusinessBlockView(APIView):
    """
    PATCH /api/moderator/businesses/<pk>/block/
    Body: { blocked: true|false, blocked_until?: ISO-datetime or null }
    Blocks or unblocks a business. blocked_until=null means permanent.
    Also auto-clears expired blocks when fetched.
    """
    permission_classes = [IsAuthenticated, IsModerator]

    def patch(self, request, pk):
        try:
            business = Business.objects.get(pk=pk)
        except Business.DoesNotExist:
            return Response({'detail': 'Бизнес не найден.'}, status=404)

        blocked = request.data.get('blocked')
        if blocked is None:
            return Response({'detail': 'Укажите поле blocked: true или false.'}, status=400)

        blocked_until = None
        if blocked:
            raw_until = request.data.get('blocked_until')
            if raw_until:
                try:
                    blocked_until = dateutil_parser.parse(raw_until)
                    if blocked_until.tzinfo is None:
                        blocked_until = timezone.make_aware(blocked_until)
                except (ValueError, TypeError):
                    return Response({'detail': 'Неверный формат blocked_until.'}, status=400)

        business.is_blocked   = bool(blocked)
        business.blocked_by   = request.user if blocked else None
        business.blocked_at   = timezone.now() if blocked else None
        business.blocked_until = blocked_until
        business.save(update_fields=['is_blocked', 'blocked_by', 'blocked_at', 'blocked_until'])

        return Response({
            'id':                  business.id,
            'is_blocked':          business.is_blocked,
            'is_currently_blocked': business.is_currently_blocked,
            'blocked_at':          business.blocked_at,
            'blocked_until':       business.blocked_until,
        })


class ModeratorBusinessProductsView(APIView):
    """
    GET /api/moderator/businesses/<pk>/products/
    Returns all products/services of a specific business.
    """
    permission_classes = [IsAuthenticated, IsModerator]

    def get(self, request, pk):
        try:
            business = Business.objects.get(pk=pk)
        except Business.DoesNotExist:
            return Response({'detail': 'Бизнес не найден.'}, status=404)

        products = Product.objects.filter(business=business).order_by('-created_at')
        data = []
        for p in products:
            img = None
            if p.image:
                try:
                    img = request.build_absolute_uri(p.image.url)
                except Exception:
                    pass
            data.append({
                'id':         p.id,
                'name':       p.name,
                'price':      str(p.price),
                'is_blocked': p.is_blocked,
                'image':      img,
            })
        return Response(data)
