from django.contrib.auth.hashers import make_password
from django.core.cache import cache
from drf_spectacular.utils import extend_schema, OpenApiResponse
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from Shop.models.models import User
from Shop.servicefunc.serializers.auth_serializer.registration import RegisterSerializer
from Shop.servicefunc.email_utils import send_verification_email

_GENERIC_OK = 'Если этот email не зарегистрирован — аккаунт создан. Проверьте почту.'


@extend_schema(tags=['Auth'])
class RegisterView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary='Регистрация нового пользователя',
        request=RegisterSerializer,
        responses={
            201: OpenApiResponse(description='Запрос принят'),
            400: OpenApiResponse(description='Ошибки валидации'),
        },
    )
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email    = serializer.validated_data['email'].strip().lower()
        username = serializer.validated_data['username']
        role     = serializer.validated_data['role']

        # Активный аккаунт с таким email — не раскрываем, просто говорим ОК
        if User.objects.filter(email=email, is_active=True).exists():
            return Response({'message': _GENERIC_OK, 'role': role}, status=status.HTTP_201_CREATED)

        # Удаляем старые неактивированные аккаунты с тем же email (зомби)
        User.objects.filter(email=email, is_active=False).delete()

        code      = '123456'  # TODO: заменить на случайный после настройки email
        cache_key = f'pending_reg_{email}'
        cache.set(cache_key, {
            'username':      username,
            'email':         email,
            'password_hash': make_password(serializer.validated_data['password']),
            'role':          role,
            'city':          serializer.validated_data.get('city', ''),
            'code':          code,
        }, timeout=900)  # 15 минут

        sent = send_verification_email(to_email=email, code=code, username=username)
        if not sent:
            print(f'[DEV] Код для {email}: {code}')

        return Response({'message': _GENERIC_OK, 'role': role}, status=status.HTTP_201_CREATED)
