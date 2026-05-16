from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiResponse
from Shop.servicefunc.verification_service import send_verification_code, verify_code

User = get_user_model()


@extend_schema(tags=['Auth'])
class SendPasswordResetCodeView(APIView):
    """
    Отправляет код для сброса пароля на email.

    POST /auth/send-password-reset-code/
    {
        "email": "user@example.com"
    }
    """
    permission_classes = [AllowAny]

    @extend_schema(
        summary='Отправить код сброса пароля',
        request={'type': 'object', 'properties': {
            'email': {'type': 'string', 'format': 'email'}
        }},
        responses={
            200: OpenApiResponse(description='Код отправлен'),
            400: OpenApiResponse(description='Email не найден или ошибка отправки'),
        },
    )
    def post(self, request):
        email = request.data.get('email', '').strip().lower()

        if not email:
            return Response({'error': 'Email required'}, status=status.HTTP_400_BAD_REQUEST)

        # Проверяем, существует ли активный аккаунт с этим email
        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            # Не раскрываем, существует ли email или нет (безопасность)
            return Response({'message': 'If email exists, code will be sent'}, status=status.HTTP_200_OK)

        # Отправляем код
        result = send_verification_code(email, code_type='PASSWORD_RESET', username=user.username)

        if not result['success']:
            return Response({'error': result['error']}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'message': 'Code sent to your email'}, status=status.HTTP_200_OK)


@extend_schema(tags=['Auth'])
class VerifyPasswordResetCodeView(APIView):
    """
    Проверяет код и устанавливает новый пароль.

    POST /auth/verify-password-reset-code/
    {
        "email": "user@example.com",
        "code": "123456",
        "new_password": "newsecurepassword123"
    }
    """
    permission_classes = [AllowAny]

    @extend_schema(
        summary='Проверить код и установить новый пароль',
        request={'type': 'object', 'properties': {
            'email': {'type': 'string', 'format': 'email'},
            'code': {'type': 'string'},
            'new_password': {'type': 'string'},
        }},
        responses={
            200: OpenApiResponse(description='Пароль изменён'),
            400: OpenApiResponse(description='Ошибка валидации или неверный код'),
        },
    )
    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        code = request.data.get('code', '').strip()
        new_password = request.data.get('new_password', '')

        # Валидация
        if not all([email, code, new_password]):
            return Response({'error': 'All fields required'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 8:
            return Response({'error': 'Password must be at least 8 characters'}, status=status.HTTP_400_BAD_REQUEST)

        # Проверяем, существует ли аккаунт
        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_400_BAD_REQUEST)

        # Проверяем код
        result = verify_code(email, code, code_type='PASSWORD_RESET')
        if not result['success']:
            return Response({'error': result['error']}, status=status.HTTP_400_BAD_REQUEST)

        # Устанавливаем новый пароль
        user.set_password(new_password)
        user.save()

        return Response({'message': 'Password reset successfully'}, status=status.HTTP_200_OK)
