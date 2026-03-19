from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from Shop.models import Business
from Shop.permissions import IsBusinessman
from Shop.servicefunc.serializers.business_serializer import (
    BusinessListSerializer,
    BusinessDetailSerializer,
    BusinessCreateUpdateSerializer,
)


@extend_schema(tags=['Business'])
class BusinessListView(APIView):
    """
    GET — список бизнесов (доступно всем, включая гостей)
    """
    permission_classes = [AllowAny]

    @extend_schema(
        summary='Список бизнесов',
        description='Публичный список. Поддерживает фильтрацию по city и category.',
        parameters=[
            OpenApiParameter('city',     str, description='Фильтр по городу'),
            OpenApiParameter('category', str, description='Фильтр по категории'),
            OpenApiParameter('vip',      bool, description='Только VIP'),
            OpenApiParameter('search',   str, description='Поиск по названию бренда'),
        ],
        responses={200: BusinessListSerializer(many=True)},
    )
    def get(self, request):
        qs = Business.objects.select_related('owner').all()

        city     = request.query_params.get('city')
        category = request.query_params.get('category')
        vip      = request.query_params.get('vip')
        search   = request.query_params.get('search')

        if city:     qs = qs.filter(city__icontains=city)
        if category: qs = qs.filter(category=category)
        if vip:      qs = qs.filter(is_vip=True)
        if search:   qs = qs.filter(brand_name__icontains=search)

        serializer = BusinessListSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)


@extend_schema(tags=['Business'])
class BusinessCreateView(APIView):
    """
    POST — создать бизнес-профиль (только BUSINESS, только один профиль)
    """
    permission_classes = [IsBusinessman]

    @extend_schema(
        summary='Создать бизнес-профиль',
        description='Доступно только бизнесменам (role=BUSINESS). Один аккаунт — один профиль.',
        request=BusinessCreateUpdateSerializer,
        responses={
            201: BusinessDetailSerializer,
            400: OpenApiResponse(description='Ошибки валидации или профиль уже существует'),
            403: OpenApiResponse(description='Только для бизнесменов'),
        },
    )
    def post(self, request):
        if hasattr(request.user, 'business_profile'):
            return Response(
                {'detail': 'Бизнес-профиль уже создан. Используйте PATCH для обновления.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = BusinessCreateUpdateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            business = serializer.save()
            return Response(
                BusinessDetailSerializer(business, context={'request': request}).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=['Business'])
class BusinessDetailView(APIView):
    """
    GET    — детали бизнеса (публично)
    PATCH  — обновить (только владелец)
    DELETE — удалить (только владелец)
    """

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_object(self, pk):
        try:
            return Business.objects.select_related('owner').get(pk=pk)
        except Business.DoesNotExist:
            return None

    @extend_schema(
        summary='Профиль бизнеса',
        description='Публичный доступ. Увеличивает счётчик просмотров.',
        responses={200: BusinessDetailSerializer, 404: OpenApiResponse(description='Не найден')},
    )
    def get(self, request, pk):
        biz = self.get_object(pk)
        if not biz:
            return Response({'detail': 'Не найден.'}, status=status.HTTP_404_NOT_FOUND)
        # Счётчик просмотров
        Business.objects.filter(pk=pk).update(views_count=biz.views_count + 1)
        return Response(BusinessDetailSerializer(biz, context={'request': request}).data)

    @extend_schema(
        summary='Обновить бизнес-профиль',
        request=BusinessCreateUpdateSerializer,
        responses={200: BusinessDetailSerializer, 403: OpenApiResponse(description='Нет прав')},
    )
    def patch(self, request, pk):
        biz = self.get_object(pk)
        if not biz:
            return Response({'detail': 'Не найден.'}, status=status.HTTP_404_NOT_FOUND)
        if biz.owner != request.user:
            return Response({'detail': 'Только владелец может редактировать.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = BusinessCreateUpdateSerializer(biz, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(BusinessDetailSerializer(biz, context={'request': request}).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary='Удалить бизнес-профиль',
        responses={204: OpenApiResponse(description='Удалено'), 403: OpenApiResponse(description='Нет прав')},
    )
    def delete(self, request, pk):
        biz = self.get_object(pk)
        if not biz:
            return Response({'detail': 'Не найден.'}, status=status.HTTP_404_NOT_FOUND)
        if biz.owner != request.user:
            return Response({'detail': 'Только владелец может удалить.'}, status=status.HTTP_403_FORBIDDEN)
        biz.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(tags=['Business'])
class MyBusinessView(APIView):
    """GET/PATCH — мой бизнес-профиль"""
    permission_classes = [IsBusinessman]

    @extend_schema(
        summary='Мой бизнес-профиль',
        responses={200: BusinessDetailSerializer, 404: OpenApiResponse(description='Профиль не создан')},
    )
    def get(self, request):
        try:
            biz = request.user.business_profile
        except Business.DoesNotExist:
            return Response({'detail': 'Профиль не создан.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(BusinessDetailSerializer(biz, context={'request': request}).data)
