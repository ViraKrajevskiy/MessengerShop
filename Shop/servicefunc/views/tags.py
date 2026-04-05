from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from Shop.models.models import Tag


class TagListView(APIView):
    """GET /api/tags/?q=... — список всех тегов с поиском"""
    permission_classes = [AllowAny]

    def get(self, request):
        q = request.query_params.get('q', '').strip().lower().lstrip('#')
        qs = Tag.objects.all().order_by('name')
        if q:
            qs = qs.filter(name__icontains=q)
        return Response([t.name for t in qs[:50]])
