from rest_framework import serializers
from Shop.models.models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'city', 'avatar', 'is_active', 'created_at')
        read_only_fields = ('id', 'email', 'role', 'is_active', 'created_at')
