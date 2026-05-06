from drf_spectacular.utils import extend_schema, OpenApiResponse, inline_serializer
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from Shop.models.models import User


@extend_schema(tags=['Auth'])
class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary='Подтверждение email по коду',
        description='Принимает email и 6-значный код. Активирует аккаунт при совпадении.',
        request=inline_serializer(
            name='VerifyEmailRequest',
            fields={
                'email': serializers.EmailField(),
                'code': serializers.CharField(max_length=6),
            },
        ),
        responses={
            200: OpenApiResponse(description='Аккаунт активирован'),
            400: OpenApiResponse(description='Неверный код или email'),
        },
    )
    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')

        if not email or not code:
            return Response({'error': 'email и code обязательны.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Пользователь не найден.'}, status=status.HTTP_400_BAD_REQUEST)

        if user.verification_code != code:
            return Response({'error': 'Неверный код подтверждения.'}, status=status.HTTP_400_BAD_REQUEST)

        user.is_active = True
        user.verification_code = None
        user.save(update_fields=['is_active', 'verification_code'])

        return Response({'message': 'Аккаунт успешно активирован. Теперь вы можете войти.'}, status=status.HTTP_200_OK)
