import uuid
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from Shop.servicefunc.serializers.auth_serializer.user import UserSerializer

User = get_user_model()


class QRTokenView(APIView):
    """GET /api/auth/qr-token/  — вернуть QR-токен текущего пользователя"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({'qr_token': str(user.qr_token)})

    def post(self, request):
        """Regenerate QR token"""
        user = request.user
        user.qr_token = uuid.uuid4()
        user.save(update_fields=['qr_token'])
        return Response({'qr_token': str(user.qr_token)})


class QRLoginView(APIView):
    """POST /api/auth/qr-login/  — войти по QR-токену"""
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('token', '').strip()
        if not token:
            return Response({'error': 'Токен не указан'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(qr_token=token, is_active=True)
        except (User.DoesNotExist, ValueError):
            return Response({'error': 'Недействительный QR-код'}, status=status.HTTP_400_BAD_REQUEST)

        refresh = RefreshToken.for_user(user)
        return Response({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user':    UserSerializer(user).data,
        })
