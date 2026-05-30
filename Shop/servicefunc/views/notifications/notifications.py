from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from Shop.models import Notification
from Shop.servicefunc.serializers.notification_serializer import NotificationSerializer


class NotificationListView(APIView):
    """GET — список уведомлений пользователя + число непрочитанных."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Notification.objects.filter(recipient=request.user)
        unread_only = request.query_params.get('unread') in ('1', 'true', 'True')
        if unread_only:
            qs = qs.filter(is_read=False)
        # Ограничиваем выдачу — последние 50 уведомлений
        notifications = qs[:50]
        unread_count = Notification.objects.filter(
            recipient=request.user, is_read=False,
        ).count()
        return Response({
            'results': NotificationSerializer(notifications, many=True).data,
            'unread_count': unread_count,
        })

    def delete(self, request):
        """Удалить все уведомления пользователя (очистить)."""
        Notification.objects.filter(recipient=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class NotificationUnreadCountView(APIView):
    """GET — только счётчик непрочитанных (лёгкий запрос для поллинга)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(
            recipient=request.user, is_read=False,
        ).count()
        return Response({'unread_count': count})


class NotificationReadView(APIView):
    """POST — отметить уведомления прочитанными."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ids = request.data.get('ids')
        qs = Notification.objects.filter(recipient=request.user, is_read=False)
        if ids:
            # Отметить конкретные уведомления
            qs = qs.filter(id__in=ids)
        # Иначе — отметить все как прочитанные
        updated = qs.update(is_read=True)
        return Response({'marked': updated})


class NotificationDetailView(APIView):
    """DELETE — удалить одно уведомление."""
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        deleted, _ = Notification.objects.filter(
            recipient=request.user, pk=pk,
        ).delete()
        if not deleted:
            return Response({'detail': 'Не найдено'}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)
