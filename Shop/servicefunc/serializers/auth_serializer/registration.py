from rest_framework import serializers
from Shop.models.models import User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, style={'input_type': 'password'}, label='Подтвердите пароль')
    role = serializers.ChoiceField(choices=User.Role.choices, required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2', 'role', 'city')
        extra_kwargs = {
            'city': {'required': False},
        }

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Пользователь с таким email уже существует.')
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password2': 'Пароли не совпадают.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data['role'],
            city=validated_data.get('city', ''),
            is_active=False,
        )
        return user
