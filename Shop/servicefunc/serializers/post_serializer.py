from rest_framework import serializers
from Shop.models import Post, ProductInquiry


class PostSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(source='business.brand_name', read_only=True)
    business_logo = serializers.SerializerMethodField()
    business_id   = serializers.IntegerField(source='business.id', read_only=True)
    is_verified   = serializers.BooleanField(source='business.is_verified', read_only=True)
    media_display = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'business_id', 'business_name', 'business_logo', 'is_verified',
            'text', 'media_display', 'media_type', 'views_count',
            'created_at', 'updated_at',
        ]

    def get_business_logo(self, obj):
        if obj.business.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.business.logo.url)
            return obj.business.logo.url
        return None

    def get_media_display(self, obj):
        if obj.media_url:
            return obj.media_url
        if obj.media:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.media.url)
            return obj.media.url
        return None


class PostCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ['text', 'media', 'media_url', 'media_type']


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
