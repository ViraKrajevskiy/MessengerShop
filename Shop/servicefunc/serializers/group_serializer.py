import re
from rest_framework import serializers
from Shop.models import GroupChat, GroupMember, GroupMessage, Product


class GroupMemberSerializer(serializers.ModelSerializer):
    user_id  = serializers.IntegerField(source='user.id', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    email    = serializers.CharField(source='user.email', read_only=True)
    is_online = serializers.SerializerMethodField()
    avatar   = serializers.SerializerMethodField()

    class Meta:
        model  = GroupMember
        fields = [
            'id', 'user_id', 'username', 'email', 'avatar', 'is_online', 'role',
            'can_delete_messages', 'can_pin_messages', 'can_send_messages',
            'joined_at',
        ]
        read_only_fields = ['id', 'joined_at']

    def get_is_online(self, obj):
        return obj.user.is_online if obj.user else False

    def get_avatar(self, obj):
        if obj.user and obj.user.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.user.avatar.url)
            return obj.user.avatar.url
        return None


class GroupChatListSerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    my_role      = serializers.SerializerMethodField()

    class Meta:
        model  = GroupChat
        fields = [
            'id', 'name', 'description', 'photo_url',
            'member_count', 'last_message', 'my_role',
            'created_at', 'updated_at',
        ]

    def get_member_count(self, obj):
        if hasattr(obj, '_member_count'):
            return obj._member_count
        return obj.members.count()

    def get_last_message(self, obj):
        msg = obj.group_messages.filter(is_deleted=False).order_by('-created_at').first()
        if not msg:
            return None
        return {
            'text': msg.text[:80],
            'sender_name': msg.sender.username if msg.sender else 'Удалён',
            'created_at': msg.created_at.isoformat(),
        }

    def get_my_role(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Use prefetched members if available
            if hasattr(obj, '_prefetched_objects_cache') and 'members' in obj._prefetched_objects_cache:
                for m in obj.members.all():
                    if m.user_id == request.user.id:
                        return m.role
                return None
            m = obj.members.filter(user=request.user).first()
            return m.role if m else None
        return None


class GroupChatDetailSerializer(GroupChatListSerializer):
    members = GroupMemberSerializer(many=True, read_only=True)

    class Meta(GroupChatListSerializer.Meta):
        fields = GroupChatListSerializer.Meta.fields + ['members']


class GroupMessageSerializer(serializers.ModelSerializer):
    sender_id     = serializers.IntegerField(source='sender.id', read_only=True)
    sender_name   = serializers.CharField(source='sender.username', read_only=True)
    sender_avatar = serializers.SerializerMethodField()
    sender_online = serializers.SerializerMethodField()
    mentioned_products = serializers.SerializerMethodField()

    class Meta:
        model  = GroupMessage
        fields = [
            'id', 'sender_id', 'sender_name', 'sender_avatar', 'sender_online',
            'text', 'is_pinned', 'is_deleted', 'is_edited',
            'mentioned_products', 'created_at',
        ]

    def get_sender_avatar(self, obj):
        if obj.sender and obj.sender.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.sender.avatar.url)
            return obj.sender.avatar.url
        return None

    def get_sender_online(self, obj):
        if obj.sender:
            return obj.sender.is_online
        return False

    def get_mentioned_products(self, obj):
        """Парсит текст на #product_id и возвращает данные товаров."""
        ids = re.findall(r'#(\d+)', obj.text or '')
        if not ids:
            return []
        products = Product.objects.filter(id__in=[int(i) for i in ids], is_available=True)
        request = self.context.get('request')
        result = []
        for p in products:
            image = None
            if p.image_url:
                image = p.image_url
            elif p.image and request:
                image = request.build_absolute_uri(p.image.url)
            elif p.image:
                image = p.image.url
            result.append({
                'id': p.id,
                'name': p.name,
                'price': str(p.price) if p.price else None,
                'currency': p.currency,
                'image': image,
            })
        return result
