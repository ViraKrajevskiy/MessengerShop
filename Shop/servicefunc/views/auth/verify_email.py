from django.conf import settings
from django.core.cache import cache
from drf_spectacular.utils import extend_schema, OpenApiResponse, inline_serializer
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from Shop.models.models import User


@extend_schema(tags=['Auth'])
class VerifyEmailView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'verify'

    @extend_schema(
        summary='Подтверждение email по коду',
        description='Принимает email и 6-значный код. Создаёт и активирует аккаунт при совпадении.',
        request=inline_serializer(
            name='VerifyEmailRequest',
            fields={
                'email': serializers.EmailField(),
                'code': serializers.CharField(max_length=6),
            },
        ),
        responses={
            200: OpenApiResponse(description='Аккаунт создан и активирован'),
            400: OpenApiResponse(description='Неверный код, email или код истёк'),
        },
    )
    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        code  = (request.data.get('code') or '').strip()

        if not email or not code:
            return Response({'error': 'email и code обязательны.'}, status=status.HTTP_400_BAD_REQUEST)

        cache_key    = f'pending_reg_{email}'
        attempts_key = f'verify_email_attempts_{email}'

        # Brute-force cap: a 6-digit code is only 1,000,000 combinations.
        if cache.get(attempts_key, 0) >= 5:
            return Response(
                {'error': 'Слишком много попыток. Зарегистрируйтесь заново позже.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        pending = cache.get(cache_key)

        if not pending:
            return Response(
                {'error': 'Код истёк или неверный email. Зарегистрируйтесь заново.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if pending['code'] != code:
            cache.set(attempts_key, cache.get(attempts_key, 0) + 1, 900)
            return Response({'error': 'Неверный код подтверждения.'}, status=status.HTTP_400_BAD_REQUEST)

        # Создаём пользователя только после верного кода
        try:
            user = User(
                username=pending['username'],
                email=pending['email'],
                password=pending['password_hash'],
                role=pending['role'],
                city=pending.get('city', ''),
                is_active=True,
            )
            user.save()
        except Exception:
            return Response(
                {'error': 'Не удалось создать аккаунт. Имя пользователя уже занято.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cache.delete(cache_key)
        cache.delete(attempts_key)

        return Response(
            {'message': 'Аккаунт успешно активирован. Теперь вы можете войти.'},
            status=status.HTTP_200_OK,
        )
