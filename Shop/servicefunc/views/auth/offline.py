from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from Shop.models import User


@extend_schema(tags=['Auth'])
class OfflineView(APIView):
    """
    POST /api/auth/offline/
    Мгновенно сбрасывает last_seen → пользователь сразу показывается как офлайн.
    Вызывается с keepalive-fetch при скрытии/закрытии вкладки.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        User.objects.filter(pk=request.user.pk).update(last_seen=None)
        request._skip_last_seen_update = True
        return Response({'ok': True})
