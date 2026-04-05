import requests
from drf_spectacular.utils import extend_schema, OpenApiResponse
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from Shop.models import User
from Shop.servicefunc.serializers.auth_serializer.user import UserSerializer


@extend_schema(tags=['Auth'])
class GoogleAuthView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary='Вход / регистрация через Google',
        description='Принимает Google access token (credential), верифицирует через Google userinfo и возвращает JWT токены.',
        responses={
            200: OpenApiResponse(description='access, refresh, user'),
            400: OpenApiResponse(description='Невалидный токен'),
        },
    )
    def post(self, request):
        credential = request.data.get('credential', '').strip()
        role = request.data.get('role', 'USER')

        if not credential:
            return Response(
                {'detail': 'Google credential обязателен.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Верифицируем токен через Google userinfo endpoint (access_token)
        try:
            resp = requests.get(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                headers={'Authorization': f'Bearer {credential}'},
                timeout=10,
            )
        except requests.RequestException:
            return Response(
                {'detail': 'Ошибка связи с Google. Попробуйте позже.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if resp.status_code != 200:
            return Response(
                {'detail': 'Недействительный Google токен.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        info = resp.json()
        google_id = info.get('sub')
        email = info.get('email')
        name = info.get('name', '')

        if not email or not google_id:
            return Response(
                {'detail': 'Email не найден в Google аккаунте.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Ищем пользователя по google_id, затем по email
        user = User.objects.filter(google_id=google_id).first()
        if not user:
            user = User.objects.filter(email=email).first()

        if user:
            # Существующий пользователь — привязываем google_id если ещё нет
            changed = []
            if not user.google_id:
                user.google_id = google_id
                changed.append('google_id')
            if not user.is_active:
                user.is_active = True
                changed.append('is_active')
            if changed:
                user.save(update_fields=changed)
        else:
            # Новый пользователь — создаём
            base_username = email.split('@')[0].replace('.', '_').replace('-', '_')
            username = base_username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f'{base_username}{counter}'
                counter += 1

            valid_role = role if role in ('USER', 'BUSINESS') else 'USER'

            user = User(
                email=email,
                username=username,
                google_id=google_id,
                is_active=True,
                role=valid_role,
            )
            # Имя из Google — кладём в username если не занят
            if name and not User.objects.filter(username=name).exists():
                user.username = name[:150]
            user.set_unusable_password()
            user.save()

        refresh = RefreshToken.for_user(user)
        return Response({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user':    UserSerializer(user).data,
        }, status=status.HTTP_200_OK)
