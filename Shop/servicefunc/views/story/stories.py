from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from Shop.models import Story, StoryView
from Shop.permissions import IsBusinessman
from Shop.servicefunc.serializers.story_serializer import (
    StorySerializer,
    StoryCreateSerializer,
    StoryViewSerializer,
)


@extend_schema(tags=['Stories'])
class StoryListCreateView(APIView):

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsBusinessman()]
        return [AllowAny()]

    @extend_schema(
        summary='Список активных сторисов',
        description='Возвращает сторисы, у которых ещё не истёк срок (24 часа). Доступно всем авторизованным.',
        responses={200: StorySerializer(many=True)},
    )
    def get(self, request):
        from django.utils import timezone
        from django.db.models import Count, Q
        stories = Story.objects.filter(
            expires_at__gt=timezone.now()
        ).select_related('author').prefetch_related('story_views').annotate(
            _comments_count=Count(
                'comments', filter=Q(comments__is_deleted=False, comments__parent=None)
            ),
        )
        serializer = StorySerializer(stories, many=True, context={'request': request})
        response = Response(serializer.data)
        response['Cache-Control'] = 'public, max-age=30'
        return response

    @extend_schema(
        summary='Создать сторис',
        description='Только для бизнесменов (role=BUSINESS). Сторис автоматически истекает через 24 часа.',
        request=StoryCreateSerializer,
        responses={
            201: StorySerializer,
            400: OpenApiResponse(description='Ошибки валидации'),
            403: OpenApiResponse(description='Только для бизнесменов'),
        },
    )
    def post(self, request):
        serializer = StoryCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            story = serializer.save()
            return Response(
                StorySerializer(story, context={'request': request}).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=['Stories'])
class StoryDetailView(APIView):
    """GET — детали сторис + счётчик просмотров. DELETE — удалить свой сторис."""

    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return Story.objects.select_related('author').get(pk=pk)
        except Story.DoesNotExist:
            return None

    @extend_schema(
        summary='Получить сторис',
        description='Возвращает детали сторис и фиксирует просмотр текущего пользователя.',
        responses={
            200: StorySerializer,
            404: OpenApiResponse(description='Сторис не найден'),
        },
    )
    def get(self, request, pk):
        story = self.get_object(pk)
        if not story:
            return Response({'detail': 'Сторис не найден.'}, status=status.HTTP_404_NOT_FOUND)

        # Фиксируем просмотр (unique_together — дубли не создаются)
        StoryView.objects.get_or_create(story=story, viewer=request.user)

        serializer = StorySerializer(story, context={'request': request})
        return Response(serializer.data)

    @extend_schema(
        summary='Удалить сторис',
        description='Только автор может удалить свой сторис.',
        responses={
            204: OpenApiResponse(description='Удалено'),
            403: OpenApiResponse(description='Нет прав'),
            404: OpenApiResponse(description='Не найден'),
        },
    )
    def delete(self, request, pk):
        story = self.get_object(pk)
        if not story:
            return Response({'detail': 'Сторис не найден.'}, status=status.HTTP_404_NOT_FOUND)
        if story.author != request.user:
            return Response({'detail': 'Только автор может удалить сторис.'}, status=status.HTTP_403_FORBIDDEN)
        story.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(tags=['Stories'])
class StoryViewersView(APIView):

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary='Просмотры сторис',
        description='Список пользователей, просмотревших сторис. Доступно только автору.',
        responses={
            200: StoryViewSerializer(many=True),
            403: OpenApiResponse(description='Только автор видит просмотры'),
            404: OpenApiResponse(description='Не найден'),
        },
    )
    def get(self, request, pk):
        try:
            story = Story.objects.get(pk=pk)
        except Story.DoesNotExist:
            return Response({'detail': 'Сторис не найден.'}, status=status.HTTP_404_NOT_FOUND)

        if story.author != request.user:
            return Response({'detail': 'Только автор может видеть просмотры.'}, status=status.HTTP_403_FORBIDDEN)

        views = story.story_views.select_related('viewer').all()
        return Response(StoryViewSerializer(views, many=True).data)
