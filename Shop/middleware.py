from django.utils import timezone


class UpdateLastSeenMiddleware:
    """Обновляет last_seen для авторизованных пользователей при каждом запросе."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if hasattr(request, 'user') and request.user.is_authenticated:
            # Обновляем last_seen без вызова save() — только UPDATE одного поля
            from Shop.models import User
            User.objects.filter(pk=request.user.pk).update(last_seen=timezone.now())

        return response
