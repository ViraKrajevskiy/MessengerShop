from rest_framework import serializers
from Shop.models import Business, GroupChat, GroupMember
from .product_serializer import ProductSerializer


class BusinessListSerializer(serializers.ModelSerializer):
    owner_username    = serializers.CharField(source='owner.username', read_only=True)
    owner_avatar      = serializers.ImageField(source='owner.avatar', read_only=True)
    category_label    = serializers.CharField(source='get_category_display', read_only=True)
    subscribers_count = serializers.SerializerMethodField()
    is_vip            = serializers.BooleanField(read_only=True)
    is_pro            = serializers.BooleanField(read_only=True)

    class Meta:
        model = Business
        fields = [
            'id', 'brand_name', 'category', 'category_label',
            'city', 'logo', 'is_verified', 'is_vip', 'is_pro',
            'plan_type',
            'rating', 'views_count', 'subscribers_count',
            'owner_username', 'owner_avatar',
        ]

    def get_subscribers_count(self, obj):
        if hasattr(obj, '_subscribers_count'):
            return obj._subscribers_count
        return obj.subscribers.count()


class BusinessDetailSerializer(serializers.ModelSerializer):
    owner_username    = serializers.CharField(source='owner.username', read_only=True)
    owner_email       = serializers.EmailField(source='owner.email', read_only=True)
    owner_avatar      = serializers.ImageField(source='owner.avatar', read_only=True)
    category_label    = serializers.CharField(source='get_category_display', read_only=True)
    products          = serializers.SerializerMethodField()
    subscribers_count = serializers.SerializerMethodField()
    is_subscribed     = serializers.SerializerMethodField()
    is_vip            = serializers.BooleanField(read_only=True)
    is_pro            = serializers.BooleanField(read_only=True)

    class Meta:
        model = Business
        fields = [
            'id', 'brand_name', 'description', 'category', 'category_label',
            'city', 'address', 'phone', 'website',
            'logo', 'cover', 'audio', 'is_verified', 'is_vip', 'is_pro',
            'plan_type', 'plan_period', 'plan_expires_at',
            'rating', 'views_count', 'created_at',
            'owner_username', 'owner_email', 'owner_avatar',
            'subscribers_count', 'is_subscribed',
            'products', 'group_id', 'faq',
        ]
        read_only_fields = ['is_verified', 'is_vip', 'is_pro', 'rating', 'views_count', 'created_at']

    def get_products(self, obj):
        if hasattr(obj, '_prefetched_products'):
            return ProductSerializer(obj._prefetched_products, many=True, context=self.context).data
        qs = obj.products.filter(is_available=True)
        return ProductSerializer(qs, many=True, context=self.context).data

    def get_subscribers_count(self, obj):
        if hasattr(obj, '_subscribers_count'):
            return obj._subscribers_count
        return obj.subscribers.count()

    def get_is_subscribed(self, obj):
        if hasattr(obj, '_is_subscribed'):
            return obj._is_subscribed
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.subscribers.filter(user=request.user).exists()
        return False


class BusinessCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Business
        fields = [
            'brand_name', 'description', 'category',
            'city', 'address', 'phone', 'website', 'logo', 'cover', 'audio', 'faq',
        ]

    def create(self, validated_data):
        user = self.context['request'].user
        group = GroupChat.objects.create(
            name=validated_data.get('brand_name', 'Группа'),
            description=f'Группа магазина {validated_data.get("brand_name", "")}',
            creator=user,
        )
        GroupMember.objects.create(group=group, user=user, role=GroupMember.Role.OWNER)
        return Business.objects.create(
            owner=user,
            group=group,
            **validated_data
        )