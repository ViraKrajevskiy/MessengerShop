"""
Moderator content blocking views.
Handles blocking/unblocking of: Stories, Comments, Products, Reviews.
Blocked items are hidden from public and auto-deleted after 4 days (via management command).
"""
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from Shop.models import Story, Comment, Product, Review
from Shop.servicefunc.views.verification.verification import IsModerator


def _block_toggle(obj, user, blocked):
    obj.is_blocked = blocked
    if blocked:
        obj.blocked_by = user
        obj.blocked_at = timezone.now()
    else:
        obj.blocked_by = None
        obj.blocked_at = None
    obj.save(update_fields=['is_blocked', 'blocked_by', 'blocked_at'])
    return {'id': obj.id, 'is_blocked': obj.is_blocked, 'blocked_at': obj.blocked_at}


# ── Stories ────────────────────────────────────────────────────────────────────
class ModeratorStoryListView(APIView):
    permission_classes = [IsAuthenticated, IsModerator]

    def get(self, request):
        qs = Story.objects.select_related('author', 'blocked_by').order_by('-created_at')
        blocked_filter = request.query_params.get('blocked')
        if blocked_filter == 'true':
            qs = qs.filter(is_blocked=True)
        elif blocked_filter == 'false':
            qs = qs.filter(is_blocked=False)

        data = []
        for s in qs:
            media = s.media_url or (request.build_absolute_uri(s.media.url) if s.media else None)
            data.append({
                'id':         s.id,
                'caption':    s.caption,
                'media':      media,
                'media_type': s.media_type,
                'is_blocked': s.is_blocked,
                'blocked_at': s.blocked_at,
                'blocked_by': s.blocked_by.email if s.blocked_by else None,
                'created_at': s.created_at,
                'author': {'id': s.author.id, 'username': s.author.username, 'email': s.author.email},
            })
        return Response(data)


class ModeratorStoryBlockView(APIView):
    permission_classes = [IsAuthenticated, IsModerator]

    def patch(self, request, pk):
        try:
            obj = Story.objects.get(pk=pk)
        except Story.DoesNotExist:
            return Response({'detail': 'История не найдена.'}, status=404)
        blocked = request.data.get('blocked')
        if blocked is None:
            return Response({'detail': 'Поле blocked обязательно.'}, status=400)
        return Response(_block_toggle(obj, request.user, bool(blocked)))


# ── Comments ───────────────────────────────────────────────────────────────────
class ModeratorCommentListView(APIView):
    permission_classes = [IsAuthenticated, IsModerator]

    def get(self, request):
        qs = Comment.objects.select_related('author', 'story', 'blocked_by').order_by('-created_at')
        blocked_filter = request.query_params.get('blocked')
        if blocked_filter == 'true':
            qs = qs.filter(is_blocked=True)
        elif blocked_filter == 'false':
            qs = qs.filter(is_blocked=False)

        data = []
        for c in qs:
            data.append({
                'id':         c.id,
                'text':       c.text,
                'is_blocked': c.is_blocked,
                'is_deleted': c.is_deleted,
                'blocked_at': c.blocked_at,
                'blocked_by': c.blocked_by.email if c.blocked_by else None,
                'created_at': c.created_at,
                'author':     {'id': c.author.id, 'username': c.author.username},
                'story_id':   c.story_id,
            })
        return Response(data)


class ModeratorCommentBlockView(APIView):
    permission_classes = [IsAuthenticated, IsModerator]

    def patch(self, request, pk):
        try:
            obj = Comment.objects.get(pk=pk)
        except Comment.DoesNotExist:
            return Response({'detail': 'Комментарий не найден.'}, status=404)
        blocked = request.data.get('blocked')
        if blocked is None:
            return Response({'detail': 'Поле blocked обязательно.'}, status=400)
        return Response(_block_toggle(obj, request.user, bool(blocked)))


# ── Products ───────────────────────────────────────────────────────────────────
class ModeratorProductListView(APIView):
    permission_classes = [IsAuthenticated, IsModerator]

    def get(self, request):
        qs = Product.objects.select_related('business', 'blocked_by').order_by('-created_at')
        blocked_filter = request.query_params.get('blocked')
        if blocked_filter == 'true':
            qs = qs.filter(is_blocked=True)
        elif blocked_filter == 'false':
            qs = qs.filter(is_blocked=False)

        data = []
        for p in qs:
            image = p.image_url or (request.build_absolute_uri(p.image.url) if p.image else None)
            data.append({
                'id':           p.id,
                'name':         p.name,
                'description':  p.description[:100],
                'price':        str(p.price) if p.price else None,
                'currency':     p.currency,
                'product_type': p.product_type,
                'image':        image,
                'is_blocked':   p.is_blocked,
                'blocked_at':   p.blocked_at,
                'blocked_by':   p.blocked_by.email if p.blocked_by else None,
                'created_at':   p.created_at,
                'business': {'id': p.business.id, 'brand_name': p.business.brand_name},
            })
        return Response(data)


class ModeratorProductBlockView(APIView):
    permission_classes = [IsAuthenticated, IsModerator]

    def patch(self, request, pk):
        try:
            obj = Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            return Response({'detail': 'Продукт не найден.'}, status=404)
        blocked = request.data.get('blocked')
        if blocked is None:
            return Response({'detail': 'Поле blocked обязательно.'}, status=400)
        return Response(_block_toggle(obj, request.user, bool(blocked)))


# ── Reviews ────────────────────────────────────────────────────────────────────
class ModeratorReviewListView(APIView):
    permission_classes = [IsAuthenticated, IsModerator]

    def get(self, request):
        qs = Review.objects.select_related('author', 'business', 'product', 'blocked_by').order_by('-created_at')
        blocked_filter = request.query_params.get('blocked')
        if blocked_filter == 'true':
            qs = qs.filter(is_blocked=True)
        elif blocked_filter == 'false':
            qs = qs.filter(is_blocked=False)

        data = []
        for r in qs:
            data.append({
                'id':         r.id,
                'rating':     r.rating,
                'text':       r.text,
                'pros':       r.pros,
                'cons':       r.cons,
                'is_blocked': r.is_blocked,
                'blocked_at': r.blocked_at,
                'blocked_by': r.blocked_by.email if r.blocked_by else None,
                'created_at': r.created_at,
                'author':     {'id': r.author.id, 'username': r.author.username},
                'business':   {'id': r.business.id, 'brand_name': r.business.brand_name} if r.business else None,
                'product':    {'id': r.product.id, 'name': r.product.name} if r.product else None,
            })
        return Response(data)


class ModeratorReviewBlockView(APIView):
    permission_classes = [IsAuthenticated, IsModerator]

    def patch(self, request, pk):
        try:
            obj = Review.objects.get(pk=pk)
        except Review.DoesNotExist:
            return Response({'detail': 'Отзыв не найден.'}, status=404)
        blocked = request.data.get('blocked')
        if blocked is None:
            return Response({'detail': 'Поле blocked обязательно.'}, status=400)
        return Response(_block_toggle(obj, request.user, bool(blocked)))
