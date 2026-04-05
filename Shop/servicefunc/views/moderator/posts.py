from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from Shop.models import Post, User
from Shop.servicefunc.views.verification.verification import IsModerator


class ModeratorPostListView(APIView):
    """
    GET /api/moderator/posts/
    Query params: ?blocked=true|false
    Returns all posts (with business info) for moderation.
    """
    permission_classes = [IsAuthenticated, IsModerator]

    def get(self, request):
        qs = Post.objects.select_related('business', 'business__owner', 'blocked_by').order_by('-created_at')
        blocked_filter = request.query_params.get('blocked')
        if blocked_filter == 'true':
            qs = qs.filter(is_blocked=True)
        elif blocked_filter == 'false':
            qs = qs.filter(is_blocked=False)

        data = []
        for post in qs:
            media = None
            if post.media_url:
                media = post.media_url
            elif post.media:
                try:
                    media = request.build_absolute_uri(post.media.url)
                except Exception:
                    media = None

            data.append({
                'id':         post.id,
                'text':       post.text,
                'media':      media,
                'media_type': post.media_type,
                'is_blocked': post.is_blocked,
                'blocked_at': post.blocked_at,
                'blocked_by': post.blocked_by.email if post.blocked_by else None,
                'created_at': post.created_at,
                'business': {
                    'id':         post.business.id,
                    'brand_name': post.business.brand_name,
                    'logo':       request.build_absolute_uri(post.business.logo.url) if post.business.logo else None,
                },
            })

        return Response(data)


class ModeratorPostBlockView(APIView):
    """
    PATCH /api/moderator/posts/<pk>/block/
    Body: { blocked: true|false }
    Toggles post block status.
    """
    permission_classes = [IsAuthenticated, IsModerator]

    def patch(self, request, pk):
        try:
            post = Post.objects.get(pk=pk)
        except Post.DoesNotExist:
            return Response({'detail': 'Пост не найден.'}, status=404)

        blocked = request.data.get('blocked')
        if blocked is None:
            return Response({'detail': 'Поле blocked обязательно.'}, status=400)

        post.is_blocked = bool(blocked)
        if post.is_blocked:
            post.blocked_by = request.user
            post.blocked_at = timezone.now()
        else:
            post.blocked_by = None
            post.blocked_at = None
        post.save(update_fields=['is_blocked', 'blocked_by', 'blocked_at'])

        return Response({
            'id':         post.id,
            'is_blocked': post.is_blocked,
            'blocked_at': post.blocked_at,
        })
