from rest_framework import serializers
from Shop.models.models import User


class UserSerializer(serializers.ModelSerializer):
    subscriptions_count = serializers.SerializerMethodField()
    subscribers_count   = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'role', 'city', 'avatar',
            'is_active', 'created_at',
            'subscriptions_count', 'subscribers_count',
        )
        read_only_fields = (
            'id', 'email', 'role', 'is_active', 'created_at',
            'subscriptions_count', 'subscribers_count',
        )

    def get_subscriptions_count(self, obj):
        return obj.subscriptions.count()

    def get_subscribers_count(self, obj):
        bp = getattr(obj, 'business_profile', None)
        if bp is not None:
            return bp.subscribers.count()
        return 0
