from django.db.models import Avg, Count, Q
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from Shop.models import Business, Product, Review
from Shop.servicefunc.serializers.review_serializer import ReviewSerializer, ReviewCreateSerializer


def review_summary(reviews_qs):
    """Optimized: single aggregate query instead of 7 separate queries."""
    agg = reviews_qs.aggregate(
        total=Count('id'),
        average=Avg('rating'),
        **{f'd{i}': Count('id', filter=Q(rating=i)) for i in range(1, 6)},
    )
    total = agg['total']
    if total == 0:
        return {'average': 0, 'total': 0, 'distribution': {str(i): 0 for i in range(1, 6)}}
    return {
        'average': round(agg['average'] or 0, 1),
        'total': total,
        'distribution': {str(i): agg[f'd{i}'] for i in range(1, 6)},
    }


class BusinessReviewListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request, pk):
        try:
            biz = Business.objects.get(pk=pk)
        except Business.DoesNotExist:
            return Response({'detail': 'Не найден.'}, status=status.HTTP_404_NOT_FOUND)
        qs = biz.reviews.select_related('author').all()
        return Response({
            'summary': review_summary(qs),
            'reviews': ReviewSerializer(qs, many=True, context={'request': request}).data,
        })

    def post(self, request, pk):
        try:
            biz = Business.objects.get(pk=pk)
        except Business.DoesNotExist:
            return Response({'detail': 'Не найден.'}, status=status.HTTP_404_NOT_FOUND)
        if biz.owner == request.user:
            return Response({'detail': 'Нельзя оставлять отзыв на свой бизнес.'}, status=status.HTTP_403_FORBIDDEN)
        if Review.objects.filter(author=request.user, business=biz).exists():
            return Response({'detail': 'Вы уже оставили отзыв.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = ReviewCreateSerializer(data=request.data)
        if serializer.is_valid():
            review = serializer.save(author=request.user, business=biz)
            return Response(ReviewSerializer(review, context={'request': request}).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProductReviewListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request, pk):
        try:
            product = Product.objects.select_related('business__owner').get(pk=pk)
        except Product.DoesNotExist:
            return Response({'detail': 'Не найден.'}, status=status.HTTP_404_NOT_FOUND)
        qs = product.reviews.select_related('author').all()
        return Response({
            'summary': review_summary(qs),
            'reviews': ReviewSerializer(qs, many=True, context={'request': request}).data,
        })

    def post(self, request, pk):
        try:
            product = Product.objects.select_related('business__owner').get(pk=pk)
        except Product.DoesNotExist:
            return Response({'detail': 'Не найден.'}, status=status.HTTP_404_NOT_FOUND)
        if product.business.owner == request.user:
            return Response({'detail': 'Нельзя оставлять отзыв на свой товар.'}, status=status.HTTP_403_FORBIDDEN)
        if Review.objects.filter(author=request.user, product=product).exists():
            return Response({'detail': 'Вы уже оставили отзыв.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = ReviewCreateSerializer(data=request.data)
        if serializer.is_valid():
            review = serializer.save(author=request.user, product=product)
            return Response(ReviewSerializer(review, context={'request': request}).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
