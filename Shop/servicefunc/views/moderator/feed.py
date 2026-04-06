"""
Moderator feed — unified stream of all content (posts, stories, products)
GET /api/moderator/feed/?type=post|story|product&blocked=true|false
"""
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from Shop.models import Post, Story, Product
from Shop.servicefunc.views.verification.verification import IsModerator


class ModeratorFeedView(APIView):
    """GET /api/moderator/feed/"""
    permission_classes = [IsAuthenticated, IsModerator]

    def get(self, request):
        type_filter    = request.query_params.get('type', '')        # post|story|product|''
        blocked_filter = request.query_params.get('blocked', '')      # true|false|''
        limit = min(int(request.query_params.get('limit', 60)), 200)

        items = []

        def _blocked_qs(qs):
            if blocked_filter == 'true':
                return qs.filter(is_blocked=True)
            if blocked_filter == 'false':
                return qs.filter(is_blocked=False)
            return qs

        # ── Posts ─────────────────────────────────────────────────────────────
        if not type_filter or type_filter == 'post':
            posts = _blocked_qs(
                Post.objects.select_related('business', 'blocked_by').order_by('-created_at')[:limit]
            )
            for p in posts:
                items.append({
                    'content_type': 'post',
                    'id':           p.id,
                    'title':        p.business.brand_name,
                    'text':         p.text,
                    'media':        request.build_absolute_uri(p.media.url) if p.media else None,
                    'media_type':   p.media_type,
                    'is_blocked':   p.is_blocked,
                    'blocked_by':   p.blocked_by.email if p.blocked_by else None,
                    'blocked_at':   p.blocked_at,
                    'created_at':   p.created_at,
                    'meta': {
                        'business_id': p.business.id,
                    },
                })

        # ── Stories ───────────────────────────────────────────────────────────
        if not type_filter or type_filter == 'story':
            stories = _blocked_qs(
                Story.objects.select_related('author', 'blocked_by').order_by('-created_at')[:limit]
            )
            for s in stories:
                items.append({
                    'content_type': 'story',
                    'id':           s.id,
                    'title':        s.author.username,
                    'text':         s.caption,
                    'media':        request.build_absolute_uri(s.media.url) if s.media else None,
                    'media_type':   s.media_type,
                    'is_blocked':   s.is_blocked,
                    'blocked_by':   s.blocked_by.email if s.blocked_by else None,
                    'blocked_at':   s.blocked_at,
                    'created_at':   s.created_at,
                    'meta': {},
                })

        # ── Products ──────────────────────────────────────────────────────────
        if not type_filter or type_filter == 'product':
            products = _blocked_qs(
                Product.objects.select_related('business', 'blocked_by').order_by('-created_at')[:limit]
            )
            for p in products:
                items.append({
                    'content_type': 'product',
                    'id':           p.id,
                    'title':        p.name,
                    'text':         p.description,
                    'media':        request.build_absolute_uri(p.image.url) if p.image else None,
                    'media_type':   'IMAGE',
                    'is_blocked':   p.is_blocked,
                    'blocked_by':   p.blocked_by.email if p.blocked_by else None,
                    'blocked_at':   p.blocked_at,
                    'created_at':   p.created_at,
                    'meta': {
                        'business_id':   p.business.id,
                        'business_name': p.business.brand_name,
                        'price':         str(p.price) if p.price else None,
                        'currency':      p.currency,
                    },
                })

        # Sort all by created_at desc and limit
        items.sort(key=lambda x: x['created_at'], reverse=True)
        return Response(items[:limit])
