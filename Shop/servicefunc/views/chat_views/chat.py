from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
import uuid
from django.utils import timezone

from Shop.models.chat_model import Chat, ChatMessage
from Shop.servicefunc.serializers.chat_serializer import ChatSerializer, ChatMessageCreateSerializer


class ChatAPIView(APIView):
    """API для работы с чатом"""

    def get(self, request):
        """Получить все чаты пользователя или создать новую сессию"""
        session_id = request.query_params.get('session_id')

        if not session_id:
            # Создаём новую сессию
            session_id = str(uuid.uuid4())
            chat = Chat.objects.create(
                user=request.user if request.user.is_authenticated else None,
                session_id=session_id
            )
            return Response({
                'session_id': session_id,
                'messages': [],
                'status': 'new_chat'
            }, status=status.HTTP_201_CREATED)

        # Получаем существующий чат
        try:
            chat = Chat.objects.get(session_id=session_id)
            serializer = ChatSerializer(chat)
            return Response(serializer.data)
        except Chat.DoesNotExist:
            return Response(
                {'error': 'Chat not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    def post(self, request):
        """Добавить новое сообщение в чат"""
        serializer = ChatMessageCreateSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        session_id = serializer.validated_data['session_id']
        message_text = serializer.validated_data['message']

        # Получаем или создаём чат
        chat, created = Chat.objects.get_or_create(
            session_id=session_id,
            defaults={'user': request.user if request.user.is_authenticated else None}
        )

        # Сохраняем сообщение пользователя
        user_message = ChatMessage.objects.create(
            chat=chat,
            role='user',
            content=message_text
        )

        # Сохраняем ответ бота (пока заглушка - реальный ответ будет от Puter.js)
        bot_message = ChatMessage.objects.create(
            chat=chat,
            role='bot',
            content='Сообщение обработано на фронте через Puter.js'
        )

        # Обновляем время последнего обновления чата
        chat.updated_at = timezone.now()
        chat.save()

        return Response({
            'session_id': session_id,
            'user_message': {
                'role': 'user',
                'content': message_text,
                'created_at': user_message.created_at
            },
            'bot_message': {
                'role': 'bot',
                'content': bot_message.content,
                'created_at': bot_message.created_at
            }
        }, status=status.HTTP_201_CREATED)


class ChatHistoryAPIView(APIView):
    """Получить историю чата"""

    def get(self, request, session_id):
        """Получить все сообщения для конкретного чата"""
        try:
            chat = Chat.objects.get(session_id=session_id)
            serializer = ChatSerializer(chat)
            return Response(serializer.data)
        except Chat.DoesNotExist:
            return Response(
                {'error': 'Chat not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    def delete(self, request, session_id):
        """Удалить чат"""
        try:
            chat = Chat.objects.get(session_id=session_id)
            chat.delete()
            return Response({'status': 'Chat deleted'}, status=status.HTTP_204_NO_CONTENT)
        except Chat.DoesNotExist:
            return Response(
                {'error': 'Chat not found'},
                status=status.HTTP_404_NOT_FOUND
            )