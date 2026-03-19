import random

from drf_spectacular.utils import extend_schema, OpenApiResponse
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from Shop.servicefunc.serializers.auth_serializer.registration import RegisterSerializer
from Shop.servicefunc.email_utils import send_verification_email


@extend_schema(tags=['Auth'])
class RegisterView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary='Регистрация нового пользователя',
        description=(
            'Создаёт пользователя с ролью USER, BUSINESS или MODERATOR. '
            'После регистрации пользователь неактивен — нужно подтвердить email кодом.'
        ),
        request=RegisterSerializer,
        responses={
            201: OpenApiResponse(description='Пользователь создан, код отправлен'),
            400: OpenApiResponse(description='Ошибки валидации'),
        },
    )
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            code = str(random.randint(100000, 999999))
            user.verification_code = code
            user.save(update_fields=['verification_code'])

            # Отправляем реальное письмо (если SMTP настроен) или пишем в консоль
            sent = send_verification_email(
                to_email=user.email,
                code=code,
                username=user.username,
            )

            if not sent:
                # Fallback — код виден в консоли сервера
                print(f'[DEV] Код для {user.email}: {code}')

            return Response(
                {
                    'message': (
                        f'Вы зарегистрированы как {user.get_role_display()}. '
                        f'Код подтверждения отправлен на {user.email}.'
                    ),
                    'role': user.role,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
