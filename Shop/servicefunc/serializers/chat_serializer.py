from rest_framework import serializers
from Shop.models.chat_model import ChatMessage, Chat


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'role', 'content', 'created_at']


class ChatSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)

    class Meta:
        model = Chat
        fields = ['id', 'session_id', 'created_at', 'updated_at', 'messages']


class ChatMessageCreateSerializer(serializers.Serializer):
    """Для создания нового сообщения"""
    session_id = serializers.CharField(max_length=100)
    message = serializers.CharField(max_length=5000)