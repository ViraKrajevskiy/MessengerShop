from drf_spectacular.utils import extend_schema, OpenApiResponse
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count
from django.utils import timezone

from Shop.models import Business, Product, ProductLike, ProductInquiry, Story
from Shop.permissions import IsBusinessman
from Shop.servicefunc.serializers.product_serializer import ProductSerializer, ProductCreateUpdateSerializer


@extend_schema(tags=['Products'])
class BusinessProductListView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    @extend_schema(summary='Список товаров бизнеса', responses={200: ProductSerializer(many=True)})
    def get(self, request, pk):
        try:
            biz = Business.objects.get(pk=pk)
        except Business.DoesNotExist:
            return Response({'detail': 'Бизнес не найден.'}, status=status.HTTP_404_NOT_FOUND)
        products = biz.products.filter(is_available=True)
        return Response(ProductSerializer(products, many=True, context={'request': request}).data)

    @extend_schema(summary='Добавить товар (только владелец)', request=ProductCreateUpdateSerializer, responses={201: ProductSerializer})
    def post(self, request, pk):
        try:
            biz = Business.objects.get(pk=pk)
        except Business.DoesNotExist:
            return Response({'detail': 'Бизнес не найден.'}, status=status.HTTP_404_NOT_FOUND)
        if biz.owner != request.user:
            return Response({'detail': 'Только владелец может добавлять товары.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = ProductCreateUpdateSerializer(data=request.data)
        if serializer.is_valid():
            product = serializer.save(business=biz)
            return Response(ProductSerializer(product, context={'request': request}).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=['Products'])
class ProductDetailView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_object(self, pk):
        try:
            return Product.objects.select_related('business__owner').get(pk=pk)
        except Product.DoesNotExist:
            return None

    @extend_schema(summary='Детали товара', responses={200: ProductSerializer})
    def get(self, request, pk):
        product = self.get_object(pk)
        if not product:
            return Response({'detail': 'Не найден.'}, status=status.HTTP_404_NOT_FOUND)
        Product.objects.filter(pk=pk).update(views_count=product.views_count + 1)
        return Response(ProductSerializer(product, context={'request': request}).data)

    @extend_schema(summary='Обновить товар', request=ProductCreateUpdateSerializer, responses={200: ProductSerializer})
    def patch(self, request, pk):
        product = self.get_object(pk)
        if not product:
            return Response({'detail': 'Не найден.'}, status=status.HTTP_404_NOT_FOUND)
        if product.business.owner != request.user:
            return Response({'detail': 'Нет прав.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = ProductCreateUpdateSerializer(product, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(ProductSerializer(product, context={'request': request}).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(summary='Удалить товар', responses={204: OpenApiResponse(description='Удалено')})
    def delete(self, request, pk):
        product = self.get_object(pk)
        if not product:
            return Response({'detail': 'Не найден.'}, status=status.HTTP_404_NOT_FOUND)
        if product.business.owner != request.user:
            return Response({'detail': 'Нет прав.'}, status=status.HTTP_403_FORBIDDEN)
        product.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProductLikeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            product = Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            return Response({'detail': 'Товар не найден.'}, status=status.HTTP_404_NOT_FOUND)
        like, created = ProductLike.objects.get_or_create(product=product, user=request.user)
        if not created:
            like.delete()
            return Response({'liked': False, 'likes': product.likes.count()})
        return Response({'liked': True, 'likes': product.likes.count()}, status=status.HTTP_201_CREATED)


class ProductSearchView(APIView):
    """GET /api/products/search/?q=... — поиск товаров для упоминания в чате."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if not q:
            return Response([])
        # Поиск по ID или по имени
        qs = Product.objects.filter(is_available=True).select_related('business')
        if q.isdigit():
            qs = qs.filter(id=int(q))
        else:
            qs = qs.filter(name__icontains=q)[:15]
        return Response(ProductSerializer(qs, many=True, context={'request': request}).data)


class BusinessStatsView(APIView):
    permission_classes = [IsBusinessman]

    def get(self, request):
        try:
            biz = request.user.business_profile
        except Business.DoesNotExist:
            return Response({'detail': 'Профиль не создан.'}, status=status.HTTP_404_NOT_FOUND)

        products = (
            Product.objects
            .filter(business=biz)
            .annotate(
                likes_count=Count('likes', distinct=True),
                inquiries_count=Count('inquiries', distinct=True),
            )
            .order_by('-views_count')
        )

        unread_inquiries = ProductInquiry.objects.filter(
            product__business=biz, is_read=False
        ).count()

        active_stories = Story.objects.filter(
            author=request.user, expires_at__gt=timezone.now()
        ).count()

        product_data = []
        for p in products:
            img = None
            if p.image_url:
                img = p.image_url
            elif p.image:
                img = request.build_absolute_uri(p.image.url)
            product_data.append({
                'id':              p.id,
                'name':            p.name,
                'price':           str(p.price) if p.price else None,
                'currency':        p.currency,
                'views':           p.views_count,
                'likes':           p.likes_count,
                'inquiries':       p.inquiries_count,
                'is_available':    p.is_available,
                'image':           img,
            })

        return Response({
            'profile_views':    biz.views_count,
            'total_products':   len(product_data),
            'unread_inquiries': unread_inquiries,
            'active_stories':   active_stories,
            'rating':           str(biz.rating),
            'is_verified':      biz.is_verified,
            'products':         product_data,
        })
