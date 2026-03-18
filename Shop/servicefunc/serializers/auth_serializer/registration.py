from rest_framework import serializers
from Shop.models.models import User

class RegisterSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(choices=User.Role.choices, default=User.Role.USER)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'role')
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        # Создаем пользователя через create_user, чтобы пароль захешировался
        user = User.objects.create_user(**validated_data)
        return user