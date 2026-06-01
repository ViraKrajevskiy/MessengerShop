from django.db.models import Sum
from rest_framework import serializers
from Shop.models.models import User


class UserSerializer(serializers.ModelSerializer):
    subscriptions_count = serializers.SerializerMethodField()
    subscribers_count   = serializers.SerializerMethodField()
    views_count         = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'role', 'city', 'avatar',
            'is_active', 'created_at',
            'subscriptions_count', 'subscribers_count', 'views_count',
        )
        read_only_fields = (
            'id', 'email', 'role', 'is_active', 'created_at',
            'subscriptions_count', 'subscribers_count', 'views_count',
        )

    def get_subscriptions_count(self, obj):
        return obj.subscriptions.count()

    def get_subscribers_count(self, obj):
        bp = getattr(obj, 'business_profile', None)
        if bp is not None:
            return bp.subscribers.count()
        return 0

    def get_views_count(self, obj):
        """Суммарные просмотры всего контента пользователя: профиль бизнеса +
        все его товары/услуги + все посты. Для обычного пользователя — 0."""
        bp = getattr(obj, 'business_profile', None)
        if bp is None:
            return 0
        total = bp.views_count or 0
        total += bp.products.aggregate(s=Sum('views_count'))['s'] or 0
        total += bp.posts.aggregate(s=Sum('views_count'))['s'] or 0
        return total
