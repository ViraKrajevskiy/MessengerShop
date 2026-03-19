from drf_spectacular.utils import extend_schema, OpenApiResponse, inline_serializer
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from Shop.servicefunc.serializers.auth_serializer.login import LoginSerializer
from Shop.servicefunc.serializers.auth_serializer.user import UserSerializer


@extend_schema(tags=['Auth'])
class LoginView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary='Вход в систему',
        description='Принимает email + пароль, возвращает JWT access и refresh токены вместе с данными пользователя.',
        request=LoginSerializer,
        responses={
            200: inline_serializer(
                name='LoginResponse',
                fields={
                    'access': serializers.CharField(),
                    'refresh': serializers.CharField(),
                    'user': UserSerializer(),
                },
            ),
            400: OpenApiResponse(description='Неверный email или пароль / аккаунт не активирован'),
        },
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                    'user': UserSerializer(user).data,
                },
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
