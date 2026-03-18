from django.contrib.auth.models import AbstractUser
from django.db import models

class BaseController(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class User(AbstractUser, BaseController):
    class Role(models.TextChoices):
        USER = 'USER', 'Base User'
        BUSINESS = 'BUSINESS', 'Businessman'
        MODERATOR = 'MODERATOR', 'Moderator'

    email = models.EmailField(unique=True)
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.USER
    )
    is_active = models.BooleanField(default=False)
    verification_code = models.CharField(max_length=6, blank=True, null=True)
    verificated = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']