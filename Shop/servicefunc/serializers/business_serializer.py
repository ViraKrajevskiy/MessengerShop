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
    tags              = serializers.SerializerMethodField()

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
            'products', 'group_id', 'faq', 'services', 'tags',
            'social_telegram', 'social_whatsapp', 'social_instagram',
            'social_youtube', 'social_tiktok', 'social_facebook',
        ]
        read_only_fields = ['is_verified', 'is_vip', 'is_pro', 'rating', 'views_count', 'created_at']

    def get_tags(self, obj):
        return [t.name for t in obj.tags.all()]

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


TAG_LIMITS = {
    'FREE': 5,
    'PRO':  15,
    'VIP':  None,   # без ограничений
}

class BusinessCreateUpdateSerializer(serializers.ModelSerializer):
    tags = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False, write_only=True,
    )

    class Meta:
        model = Business
        fields = [
            'brand_name', 'description', 'category',
            'city', 'address', 'phone', 'website', 'logo', 'cover', 'audio', 'faq', 'services',
            'social_telegram', 'social_whatsapp', 'social_instagram',
            'social_youtube', 'social_tiktok', 'social_facebook',
            'tags',
        ]

    def validate_tags(self, value):
        instance = self.instance
        plan = getattr(instance, 'plan_type', 'FREE') if instance else 'FREE'
        limit = TAG_LIMITS.get(plan)
        if limit is not None and len(value) > limit:
            raise serializers.ValidationError(
                f'Тариф {plan} позволяет максимум {limit} хэштегов.'
            )
        return value

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
        user = self.context['request'].user
        group = GroupChat.objects.create(
            name=validated_data.get('brand_name', 'Группа'),
            description=f'Группа магазина {validated_data.get("brand_name", "")}',
            creator=user,
        )
        GroupMember.objects.create(group=group, user=user, role=GroupMember.Role.OWNER)
        instance = Business.objects.create(owner=user, group=group, **validated_data)
        if tag_names:
            self._set_tags(instance, tag_names)
        return instance

    def update(self, instance, validated_data):
        tag_names = validated_data.pop('tags', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if tag_names is not None:
            self._set_tags(instance, tag_names)
        return instance