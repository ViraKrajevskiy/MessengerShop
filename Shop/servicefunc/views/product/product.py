from drf_spectacular.utils import extend_schema, OpenApiResponse
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from Shop.models import Business, Product
from Shop.servicefunc.serializers.product_serializer import ProductSerializer, ProductCreateUpdateSerializer


@extend_schema(tags=['Products'])
class BusinessProductListView(APIView):
    """GET — список товаров бизнеса | POST — создать товар (только владелец)"""

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    @extend_schema(
        summary='Список товаров бизнеса',
        responses={200: ProductSerializer(many=True)},
    )
    def get(self, request, pk):
        try:
            biz = Business.objects.get(pk=pk)
        except Business.DoesNotExist:
            return Response({'detail': 'Бизнес не найден.'}, status=status.HTTP_404_NOT_FOUND)

        products = biz.products.filter(is_available=True)
        return Response(ProductSerializer(products, many=True, context={'request': request}).data)

    @extend_schema(
        summary='Добавить товар (только владелец)',
        request=ProductCreateUpdateSerializer,
        responses={
            201: ProductSerializer,
            403: OpenApiResponse(description='Нет прав'),
        },
    )
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
    """GET / PATCH / DELETE для конкретного товара"""

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
