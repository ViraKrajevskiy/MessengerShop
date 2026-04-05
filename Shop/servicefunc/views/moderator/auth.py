from django.conf import settings
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from Shop.models import User
from Shop.servicefunc.serializers.auth_serializer.user import UserSerializer


class ModeratorLoginView(APIView):
    """
    POST /api/moderator/login/
    Body: { email, password, secret_key }
    → 200: { access, refresh, user }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email      = request.data.get('email', '').strip()
        password   = request.data.get('password', '')
        secret_key = request.data.get('secret_key', '').strip()

        if not email or not password or not secret_key:
            return Response({'detail': 'Заполните все поля.'}, status=400)

        if secret_key != settings.MODERATOR_SECRET_KEY:
            return Response({'detail': 'Неверный секретный ключ.'}, status=403)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'Пользователь не найден.'}, status=404)

        if not user.check_password(password):
            return Response({'detail': 'Неверный пароль.'}, status=400)

        if user.role != User.Role.MODERATOR:
            return Response({'detail': 'Доступ запрещён. Недостаточно прав.'}, status=403)

        if not user.is_active:
            return Response({'detail': 'Аккаунт неактивен.'}, status=403)

        refresh = RefreshToken.for_user(user)
        return Response({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user':    UserSerializer(user).data,
        })
