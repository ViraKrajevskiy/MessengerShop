from drf_spectacular.utils import extend_schema, OpenApiResponse
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from Shop.servicefunc.serializers.auth_serializer.user import UserSerializer


@extend_schema(tags=['Auth'])
class MeView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

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
        description='Обновляет username, city, avatar текущего пользователя. Аватар передавайте через multipart/form-data.',
        request={'multipart/form-data': UserSerializer,
                 'application/json': UserSerializer},
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
