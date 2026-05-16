import random
import string
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model
from Shop.models import EmailVerificationCode
from .email_utils import send_verification_email

User = get_user_model()


def generate_code(length: int = 6) -> str:
    """Генерирует случайный код (только цифры)."""
    return ''.join(random.choices(string.digits, k=length))


def send_verification_code(email: str, code_type: str = 'REGISTRATION', username: str = '') -> dict:
    """
    Отправляет код верификации на email.

    Returns:
        {
            'success': bool,
            'message': str,
            'error': str or None
        }
    """
    # Проверяем, что email валиден
    if not email or '@' not in email:
        return {'success': False, 'message': '', 'error': 'Invalid email'}

    # Очищаем старые коды для этого email
    EmailVerificationCode.objects.filter(
        email=email,
        code_type=code_type,
        is_used=False
    ).delete()

    # Генерируем новый код
    code = generate_code()
    expires_at = timezone.now() + timedelta(minutes=15)

    # Сохраняем код в БД
    EmailVerificationCode.objects.create(
        email=email,
        code=code,
        code_type=code_type,
        expires_at=expires_at
    )

    # Отправляем письмо
    sent = send_verification_email(email, code, username)

    if not sent:
        return {'success': False, 'message': '', 'error': 'Failed to send email'}

    return {
        'success': True,
        'message': f'Code sent to {email}',
        'error': None
    }


def verify_code(email: str, code: str, code_type: str = 'REGISTRATION') -> dict:
    """
    Проверяет корректность кода.

    Returns:
        {
            'success': bool,
            'message': str,
            'error': str or None
        }
    """
    try:
        code_obj = EmailVerificationCode.objects.get(
            email=email,
            code=code,
            code_type=code_type
        )
    except EmailVerificationCode.DoesNotExist:
        return {'success': False, 'message': '', 'error': 'Invalid code'}

    # Проверяем, что код не использован и не истёк
    if code_obj.is_used:
        return {'success': False, 'message': '', 'error': 'Code already used'}

    if code_obj.is_expired:
        return {'success': False, 'message': '', 'error': 'Code expired'}

    # Отмечаем код как использованный
    code_obj.is_used = True
    code_obj.save()

    return {
        'success': True,
        'message': 'Code verified',
        'error': None
    }
