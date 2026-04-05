from rest_framework import serializers
from Shop.models import VerificationRequest, VerificationDocument, VerificationMessage


class VerificationDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model  = VerificationDocument
        fields = ['id', 'name', 'file', 'uploaded_at']


class VerificationMessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    sender_role     = serializers.CharField(source='sender.role', read_only=True)
    sender_avatar   = serializers.ImageField(source='sender.avatar', read_only=True)
    is_mine         = serializers.SerializerMethodField()

    class Meta:
        model  = VerificationMessage
        fields = ['id', 'sender_username', 'sender_role', 'sender_avatar',
                  'text', 'file', 'file_name', 'is_edited', 'created_at', 'is_mine']

    def get_is_mine(self, obj):
        request = self.context.get('request')
        return request and obj.sender == request.user


class VerificationRequestSerializer(serializers.ModelSerializer):
    brand_name      = serializers.CharField(source='business.brand_name', read_only=True)
    owner_username  = serializers.CharField(source='business.owner.username', read_only=True)
    owner_email     = serializers.EmailField(source='business.owner.email', read_only=True)
    status_label    = serializers.CharField(source='get_status_display', read_only=True)
    documents       = VerificationDocumentSerializer(many=True, read_only=True)
    messages        = VerificationMessageSerializer(many=True, read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.username', read_only=True, default=None)

    class Meta:
        model  = VerificationRequest
        fields = [
            'id', 'brand_name', 'owner_username', 'owner_email',
            'status', 'status_label', 'comment',
            'reviewed_by_name', 'reviewed_at',
            'documents', 'messages', 'created_at',
        ]
        read_only_fields = ['status', 'comment', 'reviewed_by_name', 'reviewed_at']


class VerificationListSerializer(serializers.ModelSerializer):
    """Краткий список для модератора"""
    brand_name     = serializers.CharField(source='business.brand_name', read_only=True)
    owner_username = serializers.CharField(source='business.owner.username', read_only=True)
    status_label   = serializers.CharField(source='get_status_display', read_only=True)
    docs_count     = serializers.SerializerMethodField()

    class Meta:
        model  = VerificationRequest
        fields = ['id', 'brand_name', 'owner_username', 'status', 'status_label', 'docs_count', 'created_at']

    def get_docs_count(self, obj):
        return obj.documents.count()


class ReviewSerializer(serializers.Serializer):
    action  = serializers.ChoiceField(choices=['approve', 'reject'])
    comment = serializers.CharField(required=False, allow_blank=True, default='')
