from rest_framework import serializers
from django.contrib.auth import authenticate


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(label='Email')
    password = serializers.CharField(write_only=True, style={'input_type': 'password'}, label='Пароль')

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        user = authenticate(request=self.context.get('request'), email=email, password=password)
        if not user:
            raise serializers.ValidationError('Неверный email или пароль.')
        if not user.is_active:
            raise serializers.ValidationError('Аккаунт не активирован. Проверьте email.')
        attrs['user'] = user
        return attrs
