from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from Shop.models import Business, BusinessSubscription


class BusinessSubscribeView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request, pk):
        try:
            business = Business.objects.get(pk=pk)
        except Business.DoesNotExist:
            return Response({'error': 'Бизнес не найден'}, status=status.HTTP_404_NOT_FOUND)

        subscribers_count = business.subscribers.count()

        if not request.user.is_authenticated:
            return Response({'subscribed': False, 'subscribers_count': subscribers_count})

        subscribed = business.subscribers.filter(user=request.user).exists()
        return Response({'subscribed': subscribed, 'subscribers_count': subscribers_count})

    def post(self, request, pk):
        try:
            business = Business.objects.get(pk=pk)
        except Business.DoesNotExist:
            return Response({'error': 'Бизнес не найден'}, status=status.HTTP_404_NOT_FOUND)

        # Нельзя подписываться на свой же бизнес
        if hasattr(request.user, 'business_profile') and request.user.business_profile.pk == business.pk:
            return Response({'error': 'Нельзя подписаться на собственный бизнес'}, status=status.HTTP_400_BAD_REQUEST)

        sub, created = BusinessSubscription.objects.get_or_create(user=request.user, business=business)
        if not created:
            sub.delete()
            subscribed = False
        else:
            subscribed = True

        subscribers_count = business.subscribers.count()
        return Response({'subscribed': subscribed, 'subscribers_count': subscribers_count})
