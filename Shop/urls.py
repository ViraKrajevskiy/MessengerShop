from django.urls import path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from Shop.servicefunc.views.auth.registration import RegisterView, VerifyCodeView

urlpatterns = [
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/verify/', VerifyCodeView.as_view(), name='verify'),
]