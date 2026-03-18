import random
from drf_spectacular.utils import extend_schema
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from Shop.models.models import User
from Shop.servicefunc.serializers.auth_serializer.registration import RegisterSerializer


class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            code = str(random.randint(100000, 999999))
            user.verification_code = code
            user.save()

            return Response({
                "message": f"Вы зарегистрированы как {user.get_role_display()}. Код отправлен.",
                "role": user.role
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyCodeView(APIView):
    @extend_schema(request=VerifyEmailSerializer, responses={200: dict})
    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        if serializer.is_valid():
            user = User.objects.filter(
                email=serializer.validated_data['email'],
                verification_code=serializer.validated_data['code']
            ).first()

            if user:
                user.is_active = True
                user.verification_code = None
                user.save()


                token, created = Token.objects.get_or_create(user=user)

                return Response({
                    "message": "Аккаунт подтвержден!",
                    "token": token.key,
                    "username": user.username
                }, status=status.HTTP_200_OK)

            return Response({"error": "Неверный код"}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)