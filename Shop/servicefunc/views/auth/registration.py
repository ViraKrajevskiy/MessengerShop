import random

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

        email = serializer.validated_data['email']

        if User.objects.filter(email=email).exists():
            return Response({'message': _GENERIC_OK}, status=status.HTTP_201_CREATED)

        user = serializer.save()
        code = str(random.randint(100000, 999999))
        user.verification_code = code
        user.save(update_fields=['verification_code'])

        sent = send_verification_email(to_email=user.email, code=code, username=user.username)
        if not sent:
            print(f'[DEV] Код для {user.email}: {code}')

        return Response(
            {'message': _GENERIC_OK, 'role': user.role},
            status=status.HTTP_201_CREATED,
        )
