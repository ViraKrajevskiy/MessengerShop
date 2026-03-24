from rest_framework.permissions import BasePermission

from Shop.models import User


class IsBusinessman(BasePermission):
    message = 'Сторисы могут создавать только бизнесмены.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Role.BUSINESS
        )
