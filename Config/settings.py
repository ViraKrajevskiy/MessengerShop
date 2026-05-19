
from datetime import timedelta

import os
import environ
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured

# 1. BASE_DIR - корень проекта (где manage.py)
BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(
    DEBUG=(bool, False)
)

ENV_PATH = os.path.join(BASE_DIR, '.env')

# 3. Загружаем
if os.path.exists(ENV_PATH):
    environ.Env.read_env(ENV_PATH)
else:
    # Если файла нет, используем дефолтный ключ, чтобы сервер не падал
    print(f"--- WARNING: .env not found at {ENV_PATH} ---")


# DEBUG must default to False: a missing or misconfigured .env must never
# expose tracebacks, settings and SQL to the public.
DEBUG = env.bool('DEBUG', default=False)


def _required_secret(name, dev_fallback):
    """Secrets must be supplied by the environment in production. Only when
    DEBUG=True do we fall back to an obviously-insecure value so local dev
    works without a .env. With DEBUG=False a missing secret is fatal — far
    safer than silently running with a publicly-known key."""
    value = env(name, default='')
    if value:
        return value
    if DEBUG:
        return dev_fallback
    raise ImproperlyConfigured(
        f"{name} is not set. Refusing to start with an insecure default "
        f"while DEBUG=False. Set {name} in the environment/.env."
    )


SECRET_KEY = _required_secret('SECRET_KEY', 'django-insecure-dev-only-change-me')
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['127.0.0.1', 'localhost'])
INSTALLED_APPS = [
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'drf_spectacular',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'Shop',
]

REST_FRAMEWORK = {
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    # Rate limiting. Global rates are deliberately generous so normal
    # browsing / the AI chat are unaffected; the tight 'auth' and 'code'
    # scopes (opt-in per view) stop brute-force on login and email codes.
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.ScopedRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '120/min',
        'user': '600/min',
        'auth': '10/min',     # login / moderator login
        'code': '5/min',      # request an email code (registration / reset)
        'verify': '15/min',   # submit a code for verification
    },
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'БизнесТурция API',
    'DESCRIPTION': 'REST API для бизнес-справочника. Логин, регистрация, профили.',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_PATCH': True,
    'SECURITY': [{'BearerAuth': []}],
    'SWAGGER_UI_SETTINGS': {
        'persistAuthorization': True,
    },
}


# ── Email configuration (Brevo SMTP) ────────────────────────────────────────
# Uses Brevo SMTP for email delivery
# Get credentials from https://app.brevo.com/settings/keys/smtp

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = env('EMAIL_HOST', default='smtp-relay.brevo.com')
EMAIL_PORT = env.int('EMAIL_PORT', default=587)
EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=True)
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')  # SMTP password (xsmtpsib-...)
DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL', default='БизнесТурция <noreply@example.com>')

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',       # Статика с кешированием + gzip
    'django.middleware.gzip.GZipMiddleware',             # Сжатие ответов API
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'Shop.middleware.UpdateLastSeenMiddleware',
]

ROOT_URLCONF = 'Config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'Config.wsgi.application'


# Database
# https://docs.djangoproject.com/en/6.0/ref/settings/#databases

_db_url = env('DATABASE_URL', default='')
if _db_url:
    import dj_database_url
    DATABASES = {'default': dj_database_url.parse(_db_url, conn_max_age=600)}
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }


# Password validation
# https://docs.djangoproject.com/en/6.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/6.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/6.0/howto/static-files/

STATIC_URL = 'static/'

STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

STATICFILES_DIRS = []

MEDIA_URL = 'media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# WhiteNoise — статика с Brotli/gzip сжатием + immutable cache headers
STORAGES = {
    'default': {
        'BACKEND': 'django.core.files.storage.FileSystemStorage',
    },
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}

# ---------- Оптимизация API ----------
# Кэш через БД — общий для всех воркеров gunicorn/uvicorn.
# LocMemCache не подходит: каждый воркер имел свою память,
# и pending_reg_<email> терялся между POST /register/ и POST /verify-email/.
# Перед первым стартом выполнить: python manage.py createcachetable
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
        'LOCATION': 'django_cache',
        'TIMEOUT': 120,           # 2 минуты по умолчанию
    }
}

# Домен сайта — задаётся в .env как SITE_DOMAIN (например: mysite.com)
SITE_DOMAIN = env('SITE_DOMAIN', default='101-school.uz')
FRONTEND_URL = f'https://{SITE_DOMAIN}'

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    f"https://{SITE_DOMAIN}",
    f"https://www.{SITE_DOMAIN}",
]

CORS_ALLOW_CREDENTIALS = True

# Origins allowed to POST (Django admin login etc.) when DEBUG=False.
# Override per-host via the CSRF_TRUSTED_ORIGINS env var (comma-separated).
CSRF_TRUSTED_ORIGINS = env.list('CSRF_TRUSTED_ORIGINS', default=[
    f"https://{SITE_DOMAIN}",
    f"https://www.{SITE_DOMAIN}",
])

AUTH_USER_MODEL = 'Shop.User'

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# ── Security hardening ───────────────────────────────────────────────────────
# These are safe over plain HTTP (current IP deploy) and don't break anything.
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
X_FRAME_OPTIONS = 'DENY'
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'

# HTTPS-only protections. Off by default because the site currently runs on
# plain HTTP via IP — enabling these without TLS would make it unreachable.
# When a domain + certificate are in place, set SECURE_SSL=True in .env and
# everything below activates with no code change.
ENABLE_HTTPS_SECURITY = env.bool('SECURE_SSL', default=False)
if ENABLE_HTTPS_SECURITY:
    # nginx terminates TLS and forwards X-Forwarded-Proto.
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True