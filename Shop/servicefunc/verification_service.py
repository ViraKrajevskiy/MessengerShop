import secrets
import string
from datetime import timedelta
from django.utils import timezone
from django.core.cache import cache
from django.contrib.auth import get_user_model
from Shop.models import EmailVerificationCode
from .email_utils import send_verification_email

User = get_user_model()

# Brute-force protection: a 6-digit code is only 1,000,000 combinations, so an
# unlimited number of guesses inside the 15-minute window would allow account
# takeover via the password-reset flow. Cap failed attempts per (email, type)
# and lock further tries until the window passes.
MAX_VERIFY_ATTEMPTS = 5
LOCK_WINDOW_SECONDS = 15 * 60


def _attempts_key(email: str, code_type: str) -> str:
    return f'verif_attempts:{code_type}:{email.strip().lower()}'


def generate_code(length: int = 6) -> str:
    """Cryptographically secure numeric code. random.choices is predictable
    and must never be used for security tokens."""
    return ''.join(secrets.choice(string.digits) for _ in range(length))


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

    # Новый код — сбрасываем счётчик неудачных попыток.
    cache.delete(_attempts_key(email, code_type))

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


def _register_failed_attempt(email: str, code_type: str) -> None:
    key = _attempts_key(email, code_type)
    cache.set(key, cache.get(key, 0) + 1, LOCK_WINDOW_SECONDS)


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
    key = _attempts_key(email, code_type)
    if cache.get(key, 0) >= MAX_VERIFY_ATTEMPTS:
        return {
            'success': False,
            'message': '',
            'error': 'Too many invalid attempts. Please request a new code.',
        }

    try:
        code_obj = EmailVerificationCode.objects.get(
            email=email,
            code=code,
            code_type=code_type
        )
    except EmailVerificationCode.DoesNotExist:
        _register_failed_attempt(email, code_type)
        return {'success': False, 'message': '', 'error': 'Invalid code'}

    # Проверяем, что код не использован и не истёк
    if code_obj.is_used:
        _register_failed_attempt(email, code_type)
        return {'success': False, 'message': '', 'error': 'Code already used'}

    if code_obj.is_expired:
        _register_failed_attempt(email, code_type)
        return {'success': False, 'message': '', 'error': 'Code expired'}

    # Код верный — помечаем использованным и сбрасываем счётчик попыток.
    code_obj.is_used = True
    code_obj.save()
    cache.delete(key)

    return {
        'success': True,
        'message': 'Code verified',
        'error': None
    }
