import re
from rest_framework import serializers
from Shop.models import Post, Product, ProductInquiry, InquiryMessage

class PostSerializer(serializers.ModelSerializer):
    business_name  = serializers.CharField(source='business.brand_name', read_only=True)
    business_logo  = serializers.SerializerMethodField()
    business_id    = serializers.IntegerField(source='business.id', read_only=True)
    is_verified    = serializers.BooleanField(source='business.is_verified', read_only=True)
    media_display  = serializers.SerializerMethodField()
    is_subscribed  = serializers.SerializerMethodField()
    tags           = serializers.SerializerMethodField()
    is_favorited   = serializers.SerializerMethodField()   # НОВОЕ
    favorites_count = serializers.SerializerMethodField()  # НОВОЕ

    class Meta:
        model = Post
        fields = [
            'id', 'business_id', 'business_name', 'business_logo', 'is_verified',
            'text', 'media_display', 'media_type', 'views_count',
            'is_subscribed', 'tags',
            'is_favorited', 'favorites_count',   # НОВОЕ
            'created_at', 'updated_at',
        ]

    def get_is_favorited(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.favorites.filter(user=request.user).exists()
        return False

    def get_favorites_count(self, obj):
        return obj.favorites.count()

    def get_business_logo(self, obj):
        if obj.business.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.business.logo.url)
            return obj.business.logo.url
        return None

    def get_is_subscribed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.business.subscribers.filter(user=request.user).exists()
        return False

    def get_media_display(self, obj):
        if obj.media_url:
            return obj.media_url
        if obj.media:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.media.url)
            return obj.media.url
        return None

    def get_tags(self, obj):
        return list(obj.tags.values_list('name', flat=True))


class PostCreateSerializer(serializers.ModelSerializer):
    tags = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False, write_only=True,
    )

    class Meta:
        model = Post
        fields = ['text', 'media', 'media_url', 'media_type', 'tags']

    def _set_tags(self, instance, tag_names):
        from Shop.models.models import Tag
        tags = []
        for name in tag_names:
            name = name.strip().lower().lstrip('#')
            if name:
                tag, _ = Tag.objects.get_or_create(name=name)
                tags.append(tag)
        instance.tags.set(tags)

    def create(self, validated_data):
        tag_names = validated_data.pop('tags', [])
        if not tag_names:
            tag_names = re.findall(r'#(\w+)', validated_data.get('text', ''))
        instance = Post.objects.create(**validated_data)
        self._set_tags(instance, tag_names)
        return instance

class ProductInquirySerializer(serializers.ModelSerializer):
    sender_name  = serializers.CharField(source='sender.username', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = ProductInquiry
        fields = ['id', 'product', 'product_name', 'sender_name', 'message', 'is_read', 'created_at']
        read_only_fields = ['sender_name', 'product_name', 'is_read', 'created_at']


class ProductInquiryCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductInquiry
        fields = ['message']


class InquiryMessageSerializer(serializers.ModelSerializer):
    sender_id     = serializers.IntegerField(source='sender.id', read_only=True)
    sender_name   = serializers.CharField(source='sender.username', read_only=True)
    sender_avatar = serializers.SerializerMethodField()
    sender_online = serializers.SerializerMethodField()
    mentioned_products = serializers.SerializerMethodField()

    class Meta:
        model = InquiryMessage
        fields = [
            'id', 'sender_id', 'sender_name', 'sender_avatar', 'sender_online',
            'text', 'is_edited', 'is_deleted', 'mentioned_products', 'created_at',
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
