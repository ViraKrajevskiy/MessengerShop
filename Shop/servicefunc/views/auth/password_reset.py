from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

User = get_user_model()

FRONTEND_URL = getattr(settings, 'FRONTEND_URL', 'https://101-school.uz')


class PasswordResetRequestView(APIView):
    """POST /api/auth/password-reset/  — отправить письмо со ссылкой сброса"""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'error': 'Введите email'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            # Не раскрываем существование аккаунта
            return Response({'detail': 'Если аккаунт существует — письмо отправлено'})

        uid   = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        link  = f'{FRONTEND_URL}/reset-password?uid={uid}&token={token}'

        send_mail(
            subject='Сброс пароля — БизнесТурция',
            message=f'Для сброса пароля перейдите по ссылке:\n\n{link}\n\nСсылка действует 24 часа.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,
        )

        response_data = {'detail': 'Если аккаунт существует — письмо отправлено'}
        # В режиме разработки возвращаем ссылку прямо в ответе
        if settings.DEBUG:
            response_data['debug_link'] = link

        return Response(response_data)


class PasswordResetConfirmView(APIView):
    """POST /api/auth/password-reset/confirm/  — установить новый пароль"""
    permission_classes = [AllowAny]

    def post(self, request):
        uid       = request.data.get('uid', '')
        token     = request.data.get('token', '')
        password  = request.data.get('password', '')

        if not all([uid, token, password]):
            return Response({'error': 'Все поля обязательны'}, status=status.HTTP_400_BAD_REQUEST)

        if len(password) < 6:
            return Response({'error': 'Пароль минимум 6 символов'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            pk   = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=pk)
        except Exception:
            return Response({'error': 'Неверная ссылка'}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            return Response({'error': 'Ссылка недействительна или истекла'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(password)
        user.save()
        return Response({'detail': 'Пароль успешно изменён'})
