from drf_spectacular.utils import extend_schema, OpenApiResponse, inline_serializer
from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken


@extend_schema(tags=['Auth'])
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary='Выход из системы',
        description='Добавляет refresh токен в чёрный список, делая его недействительным.',
        request=inline_serializer(
            name='LogoutRequest',
            fields={'refresh': serializers.CharField()},
        ),
        responses={
            205: OpenApiResponse(description='Успешный выход'),
            400: OpenApiResponse(description='Недействительный или отсутствующий токен'),
        },
    )
    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'error': 'refresh токен обязателен.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response({'error': 'Недействительный токен.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'message': 'Выход выполнен успешно.'}, status=status.HTTP_205_RESET_CONTENT)
