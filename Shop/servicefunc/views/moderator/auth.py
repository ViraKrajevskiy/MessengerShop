from django.contrib.auth.hashers import check_password
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from Shop.models import User
from Shop.servicefunc.serializers.auth_serializer.user import UserSerializer

# Pre-computed hash so a missing user costs the same as a wrong password
# (mitigates timing-based account enumeration).
_DUMMY_PASSWORD_HASH = (
    'pbkdf2_sha256$600000$cF8mODeratorDummy$'
    'mZ0wQv2H0m4xWf3pK1nQ8s7yT6uV5rXbAaCdEeFfGgH='
)


class ModeratorLoginView(APIView):
    """
    POST /api/moderator/login/
    Body: { email, password }
    → 200: { access, refresh, user }

    Access requires an active account with role=MODERATOR. The previous
    extra shared secret_key gate was removed by request.
    """
    permission_classes = [AllowAny]
    throttle_scope = 'auth'

    def post(self, request):
        email    = request.data.get('email', '').strip()
        password = request.data.get('password', '')

        if not email or not password:
            return Response({'detail': 'Заполните все поля.'}, status=400)

        # Single generic failure for every mismatch: don't reveal whether the
        # email, the password or the role was the problem (anti-enumeration).
        invalid = Response({'detail': 'Неверные учётные данные.'}, status=401)

        user = User.objects.filter(email=email).first()
        if user is not None:
            password_ok = user.check_password(password)
        else:
            # Equalize timing with the user-exists path.
            check_password(password, _DUMMY_PASSWORD_HASH)
            password_ok = False

        if not (user is not None and password_ok
                and user.role == User.Role.MODERATOR and user.is_active):
            return invalid

        refresh = RefreshToken.for_user(user)
        return Response({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user':    UserSerializer(user).data,
        })
