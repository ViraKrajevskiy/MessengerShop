"""
Moderator: user profile moderation.
- List all users
- Block / unblock a user profile (is_profile_blocked)
- Complaints targeting a user profile
"""
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from Shop.models import User, Complaint
from Shop.servicefunc.views.verification.verification import IsModerator


def _avatar_url(user, request):
    if user.avatar:
        try:
            return request.build_absolute_uri(user.avatar.url)
        except Exception:
            pass
    return None


class ModeratorUserListView(APIView):
    """
    GET /api/moderator/users/
    ?role=USER|BUSINESS|MODERATOR  ?blocked=true|false  ?search=...
    """
    permission_classes = [IsAuthenticated, IsModerator]

    def get(self, request):
        qs = User.objects.select_related('profile_blocked_by').order_by('-date_joined')

        role_filter    = request.query_params.get('role')
        blocked_filter = request.query_params.get('blocked')
        search         = request.query_params.get('search', '').strip()

        if role_filter:
            qs = qs.filter(role=role_filter.upper())
        if blocked_filter == 'true':
            qs = qs.filter(is_profile_blocked=True)
        elif blocked_filter == 'false':
            qs = qs.filter(is_profile_blocked=False)
        if search:
            qs = qs.filter(username__icontains=search) | qs.filter(email__icontains=search)

        data = []
        for u in qs[:200]:  # limit
            data.append({
                'id':                 u.id,
                'username':           u.username,
                'email':              u.email,
                'role':               u.role,
                'city':               u.city,
                'avatar':             _avatar_url(u, request),
                'is_active':          u.is_active,
                'is_profile_blocked': u.is_profile_blocked,
                'profile_blocked_at': u.profile_blocked_at,
                'profile_blocked_by': u.profile_blocked_by.email if u.profile_blocked_by else None,
                'date_joined':        u.date_joined,
                'last_seen':          u.last_seen,
                'complaints_count':   u.complaints_received.filter(status='PENDING').count(),
            })
        return Response(data)


class ModeratorUserBlockView(APIView):
    """
    PATCH /api/moderator/users/<pk>/block/
    { blocked: true|false }
    Blocks/unblocks a user profile (is_profile_blocked).
    Does NOT deactivate login — only hides profile from public.
    Pass { deactivate: true } to also disable login (is_active=False).
    """
    permission_classes = [IsAuthenticated, IsModerator]

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'Пользователь не найден.'}, status=404)

        if user.role == User.Role.MODERATOR:
            return Response({'detail': 'Нельзя блокировать других модераторов.'}, status=403)

        blocked    = request.data.get('blocked')
        deactivate = request.data.get('deactivate', False)

        if blocked is None:
            return Response({'detail': 'Поле blocked обязательно.'}, status=400)

        user.is_profile_blocked = bool(blocked)
        fields = ['is_profile_blocked']

        if blocked:
            user.profile_blocked_by = request.user
            user.profile_blocked_at = timezone.now()
            fields += ['profile_blocked_by', 'profile_blocked_at']
            if deactivate:
                user.is_active = False
                fields.append('is_active')
        else:
            user.profile_blocked_by = None
            user.profile_blocked_at = None
            fields += ['profile_blocked_by', 'profile_blocked_at']
            if deactivate is False and not user.is_active:
                user.is_active = True
                fields.append('is_active')

        user.save(update_fields=fields)

        return Response({
            'id':                 user.id,
            'username':           user.username,
            'is_profile_blocked': user.is_profile_blocked,
            'is_active':          user.is_active,
            'profile_blocked_at': user.profile_blocked_at,
        })
