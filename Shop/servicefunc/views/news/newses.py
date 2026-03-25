from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny

from Shop.models.models import News
from Shop.servicefunc.serializers.news_serializer import NewsCreateUpdateSerializer, NewsSerializer


class NewsListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = News.objects.filter(is_published=True).select_related('business', 'author')

        news_type = request.query_params.get('type')
        business_id = request.query_params.get('business')
        tag = request.query_params.get('tag')

        if news_type:
            qs = qs.filter(news_type=news_type)
        if business_id:
            qs = qs.filter(business_id=business_id)
        if tag:
            qs = qs.filter(tags__name=tag)

        return Response(NewsSerializer(qs, many=True, context={'request': request}).data)


class NewsCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = NewsCreateUpdateSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        if request.user.is_staff:
            news = serializer.save(
                author=request.user,
                business=None,
                news_type=News.NewsType.PLATFORM,
            )
        elif hasattr(request.user, 'business_profile'):
            news = serializer.save(
                author=request.user,
                business=request.user.business_profile,
                news_type=News.NewsType.BUSINESS,
            )
        else:
            return Response(
                {'detail': 'Только бизнесмен или администратор может создавать новости.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response(NewsSerializer(news, context={'request': request}).data, status=status.HTTP_201_CREATED)


class NewsDetailView(APIView):

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_object(self, pk):
        try:
            return News.objects.select_related('business', 'author').get(pk=pk)
        except News.DoesNotExist:
            return None

    def get(self, request, pk):
        news = self.get_object(pk)
        if not news or not news.is_published:
            return Response({'detail': 'Не найдено.'}, status=status.HTTP_404_NOT_FOUND)
        News.objects.filter(pk=pk).update(views_count=news.views_count + 1)
        return Response(NewsSerializer(news, context={'request': request}).data)

    def patch(self, request, pk):
        news = self.get_object(pk)
        if not news:
            return Response({'detail': 'Не найдено.'}, status=status.HTTP_404_NOT_FOUND)
        if news.author != request.user and not request.user.is_staff:
            return Response({'detail': 'Нет прав.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = NewsCreateUpdateSerializer(news, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(NewsSerializer(news, context={'request': request}).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        news = self.get_object(pk)
        if not news:
            return Response({'detail': 'Не найдено.'}, status=status.HTTP_404_NOT_FOUND)
        if news.author != request.user and not request.user.is_staff:
            return Response({'detail': 'Нет прав.'}, status=status.HTTP_403_FORBIDDEN)
        news.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class BusinessNewsListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        qs = News.objects.filter(
            business_id=pk, is_published=True
        ).select_related('business', 'author')
        return Response(NewsSerializer(qs, many=True, context={'request': request}).data)