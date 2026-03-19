from drf_spectacular.utils import extend_schema, OpenApiResponse
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from Shop.servicefunc.serializers.auth_serializer.user import UserSerializer


@extend_schema(tags=['Auth'])
class MeView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary='Текущий пользователь',
        description='Возвращает данные авторизованного пользователя по Bearer токену.',
        responses={
            200: UserSerializer,
            401: OpenApiResponse(description='Не авторизован'),
        },
    )
    def get(self, request):
        return Response(UserSerializer(request.user, context={'request': request}).data)

    @extend_schema(
        summary='Обновить профиль',
        description='Обновляет username и/или city текущего пользователя.',
        request=UserSerializer,
        responses={
            200: UserSerializer,
            400: OpenApiResponse(description='Ошибки валидации'),
        },
    )
    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True,
                                    context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
