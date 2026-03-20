from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from Shop.models import Post, Product, ProductInquiry, Business
from Shop.servicefunc.serializers.post_serializer import (
    PostSerializer, PostCreateSerializer,
    ProductInquiryCreateSerializer,
)


class PostListView(APIView):
    """GET /api/posts/ — все посты (лента)"""
    permission_classes = [AllowAny]

    def get(self, request):
        posts = Post.objects.select_related('business').all()[:50]
        serializer = PostSerializer(posts, many=True, context={'request': request})
        return Response(serializer.data)


class BusinessPostListView(APIView):
    """GET /api/businesses/<pk>/posts/ — посты конкретного бизнеса
       POST — создать пост (только владелец)"""
    permission_classes = [AllowAny]

    def get(self, request, pk):
        posts = Post.objects.filter(business_id=pk).select_related('business')
        serializer = PostSerializer(posts, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, pk):
        if not request.user.is_authenticated:
            return Response({'detail': 'Требуется авторизация'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            business = Business.objects.get(pk=pk, owner=request.user)
        except Business.DoesNotExist:
            return Response({'detail': 'Бизнес не найден или нет доступа'}, status=status.HTTP_403_FORBIDDEN)

        serializer = PostCreateSerializer(data=request.data)
        if serializer.is_valid():
            post = serializer.save(business=business)
            return Response(PostSerializer(post, context={'request': request}).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProductInquiryView(APIView):
    """POST /api/products/<pk>/inquiry/ — написать бизнесу по товару"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            product = Product.objects.select_related('business').get(pk=pk)
        except Product.DoesNotExist:
            return Response({'detail': 'Товар не найден'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ProductInquiryCreateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(product=product, sender=request.user)
            return Response({'detail': 'Сообщение отправлено'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
