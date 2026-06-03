from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from django.db.models import Count

from Shop.models import Business, BusinessFavorite
from Shop.servicefunc.serializers.business_serializer import BusinessListSerializer


class BusinessFavoriteView(APIView):
    """POST /api/businesses/<pk>/favorite/ — добавить/убрать бизнес из избранного."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            business = Business.objects.get(pk=pk)
        except Business.DoesNotExist:
            return Response({'detail': 'Бизнес не найден'}, status=status.HTTP_404_NOT_FOUND)

        fav, created = BusinessFavorite.objects.get_or_create(user=request.user, business=business)
        if not created:
            fav.delete()
            return Response({'favorited': False})
        return Response({'favorited': True}, status=status.HTTP_201_CREATED)


class BusinessFavoritesListView(APIView):
    """GET /api/businesses/favorites/ — избранные бизнесы текущего пользователя."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Business.objects.filter(
            favorited_by__user=request.user,
            is_blocked=False,
        ).select_related('owner').annotate(
            _subscribers_count=Count('subscribers', distinct=True),
        ).order_by('-favorited_by__created_at')

        data = BusinessListSerializer(qs, many=True, context={'request': request}).data
        ids = [b['id'] for b in data]
        return Response({'ids': ids, 'businesses': data})
