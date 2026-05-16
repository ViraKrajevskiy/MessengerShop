from django.contrib.auth.hashers import make_password
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiResponse
from Shop.servicefunc.verification_service import send_verification_code, verify_code

User = get_user_model()


@extend_schema(tags=['Auth'])
class SendRegistrationCodeView(APIView):
    """
    Отправляет код верификации на email для регистрации.

    POST /auth/send-registration-code/
    {
        "email": "user@example.com"
    }
    """
    permission_classes = [AllowAny]

    @extend_schema(
        summary='Отправить код подтверждения на email',
        request={'type': 'object', 'properties': {
            'email': {'type': 'string', 'format': 'email'}
        }},
        responses={
            200: OpenApiResponse(description='Код отправлен'),
            400: OpenApiResponse(description='Ошибка валидации'),
        },
    )
    def post(self, request):
        email = request.data.get('email', '').strip().lower()

        if not email:
            return Response({'error': 'Email required'}, status=status.HTTP_400_BAD_REQUEST)

        # Проверяем, не зарегистрирован ли уже этот email
        if User.objects.filter(email=email, is_active=True).exists():
            return Response({'error': 'This email is already registered'}, status=status.HTTP_400_BAD_REQUEST)

        # Отправляем код
        result = send_verification_code(email, code_type='REGISTRATION')

        if not result['success']:
            return Response({'error': result['error']}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'message': 'Code sent to your email'}, status=status.HTTP_200_OK)


@extend_schema(tags=['Auth'])
class VerifyRegistrationCodeView(APIView):
    """
    Проверяет код и создаёт аккаунт.

    POST /auth/verify-registration-code/
    {
        "email": "user@example.com",
        "code": "123456",
        "username": "john_doe",
        "password": "securepassword123",
        "role": "USER"
    }
    """
    permission_classes = [AllowAny]

    @extend_schema(
        summary='Проверить код и завершить регистрацию',
        request={'type': 'object', 'properties': {
            'email': {'type': 'string', 'format': 'email'},
            'code': {'type': 'string'},
            'username': {'type': 'string'},
            'password': {'type': 'string'},
            'role': {'type': 'string', 'enum': ['USER', 'BUSINESS']},
        }},
        responses={
            201: OpenApiResponse(description='Аккаунт создан'),
            400: OpenApiResponse(description='Ошибка валидации или неверный код'),
        },
    )
    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        code = request.data.get('code', '').strip()
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '')
        role = request.data.get('role', 'USER').upper()

        # Валидация
        if not all([email, code, username, password]):
            return Response({'error': 'All fields required'}, status=status.HTTP_400_BAD_REQUEST)

        if len(password) < 8:
            return Response({'error': 'Password must be at least 8 characters'}, status=status.HTTP_400_BAD_REQUEST)

        if role not in ['USER', 'BUSINESS']:
            return Response({'error': 'Invalid role'}, status=status.HTTP_400_BAD_REQUEST)

        # Проверяем код
        result = verify_code(email, code, code_type='REGISTRATION')
        if not result['success']:
            return Response({'error': result['error']}, status=status.HTTP_400_BAD_REQUEST)

        # Удаляем старые неактивированные аккаунты с этим email
        User.objects.filter(email=email, is_active=False).delete()

        # Создаём новый аккаунт
        try:
            user = User.objects.create_user(
                email=email,
                username=username,
                password=password,
                is_active=True,
                role=role,
            )
            return Response({
                'message': 'Registration successful',
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'username': user.username,
                    'role': user.role,
                }
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
