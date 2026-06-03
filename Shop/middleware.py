from django.http import JsonResponse
from django.utils import timezone


PROFILE_BLOCK_WHITELIST = (
    '/api/me/',
    '/api/notifications/',
    '/api/complaints/',
    '/api/complaint-reasons/',
    '/api/auth/logout/',
    '/api/auth/token/refresh/',
    '/api/auth/token/',
    '/admin/',
    '/media/',
    '/static/',
)


class ProfileBlockMiddleware:
    """Return 403 for blocked profiles on all endpoints except whitelist."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if (
            hasattr(request, 'user')
            and request.user.is_authenticated
            and getattr(request.user, 'is_profile_blocked', False)
        ):
            path = request.path
            if not any(path.startswith(p) for p in PROFILE_BLOCK_WHITELIST):
                if path.startswith('/api/'):
                    return JsonResponse(
                        {
                            'detail': 'Ваш профиль заблокирован. Вы можете подать апелляцию или написать в поддержку.',
                            'profile_blocked': True,
                        },
                        status=403,
                    )
        return self.get_response(request)


class UpdateLastSeenMiddleware:
    """Обновляет last_seen для авторизованных пользователей при каждом запросе."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if (
            hasattr(request, 'user')
            and request.user.is_authenticated
            and not getattr(request, '_skip_last_seen_update', False)
        ):
            # Обновляем last_seen без вызова save() — только UPDATE одного поля
            from Shop.models import User
            User.objects.filter(pk=request.user.pk).update(last_seen=timezone.now())

        return response
