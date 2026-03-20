from drf_spectacular.utils import extend_schema, OpenApiResponse
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from Shop.models import Comment, Story
from Shop.servicefunc.serializers.comment_serializer import (
    CommentSerializer,
    CommentCreateSerializer,
)


@extend_schema(tags=['Comments'])
class CommentListCreateView(APIView):
    """
    GET  — список комментариев сторис (все авторизованные)
    POST — добавить комментарий (все авторизованные)
    """

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_story(self, story_pk):
        try:
            return Story.objects.get(pk=story_pk)
        except Story.DoesNotExist:
            return None

    @extend_schema(
        summary='Комментарии сторис',
        description='Возвращает корневые комментарии с вложенными репляями. Доступно всем авторизованным.',
        responses={200: CommentSerializer(many=True)},
    )
    def get(self, request, story_pk):
        story = self.get_story(story_pk)
        if not story:
            return Response({'detail': 'Сторис не найден.'}, status=status.HTTP_404_NOT_FOUND)

        comments = (
            Comment.objects
            .filter(story=story, parent=None, is_deleted=False)
            .select_related('author')
            .prefetch_related('replies__author')
        )
        return Response(CommentSerializer(comments, many=True, context={'request': request}).data)

    @extend_schema(
        summary='Добавить комментарий',
        description=(
            'Все авторизованные пользователи могут комментировать. '
            'Чтобы ответить на комментарий — передайте `parent` (id корневого комментария).'
        ),
        request=CommentCreateSerializer,
        responses={
            201: CommentSerializer,
            400: OpenApiResponse(description='Ошибки валидации'),
            404: OpenApiResponse(description='Сторис не найден'),
        },
    )
    def post(self, request, story_pk):
        story = self.get_story(story_pk)
        if not story:
            return Response({'detail': 'Сторис не найден.'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()
        data['story'] = story.pk

        serializer = CommentCreateSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            comment = serializer.save()
            return Response(
                CommentSerializer(comment, context={'request': request}).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=['Comments'])
class CommentDetailView(APIView):
    """PATCH — редактировать, DELETE — мягкое удаление (только автор или модератор)."""

    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return Comment.objects.select_related('author').get(pk=pk, is_deleted=False)
        except Comment.DoesNotExist:
            return None

    def check_owner_or_moderator(self, request, comment):
        from Shop.models import User
        return (
            comment.author == request.user
            or request.user.role == User.Role.MODERATOR
        )

    @extend_schema(
        summary='Редактировать комментарий',
        description='Только автор может изменить текст своего комментария.',
        request=CommentCreateSerializer,
        responses={
            200: CommentSerializer,
            403: OpenApiResponse(description='Нет прав'),
            404: OpenApiResponse(description='Не найден'),
        },
    )
    def patch(self, request, pk):
        comment = self.get_object(pk)
        if not comment:
            return Response({'detail': 'Комментарий не найден.'}, status=status.HTTP_404_NOT_FOUND)
        if comment.author != request.user:
            return Response({'detail': 'Только автор может редактировать комментарий.'}, status=status.HTTP_403_FORBIDDEN)

        comment.text = request.data.get('text', comment.text)
        comment.save(update_fields=['text', 'updated_at'])
        return Response(CommentSerializer(comment, context={'request': request}).data)

    @extend_schema(
        summary='Удалить комментарий',
        description='Мягкое удаление — текст скрывается, запись остаётся. Автор или модератор.',
        responses={
            204: OpenApiResponse(description='Удалено'),
            403: OpenApiResponse(description='Нет прав'),
            404: OpenApiResponse(description='Не найден'),
        },
    )
    def delete(self, request, pk):
        comment = self.get_object(pk)
        if not comment:
            return Response({'detail': 'Комментарий не найден.'}, status=status.HTTP_404_NOT_FOUND)
        if not self.check_owner_or_moderator(request, comment):
            return Response({'detail': 'Нет прав на удаление.'}, status=status.HTTP_403_FORBIDDEN)

        comment.is_deleted = True
        comment.text = '[комментарий удалён]'
        comment.save(update_fields=['is_deleted', 'text', 'updated_at'])
        return Response(status=status.HTTP_204_NO_CONTENT)
