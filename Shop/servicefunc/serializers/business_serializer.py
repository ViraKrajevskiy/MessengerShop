import re

from django.db import IntegrityError, transaction
from rest_framework import serializers
from Shop.models import Business, GroupChat, GroupMember
from .product_serializer import ProductSerializer

# Одна фраза для дубликата названия/телефона — не раскрываем, что именно занято.
BUSINESS_IDENTITY_CONFLICT_MSG = 'Не удалось сохранить: укажите другое название и другие контактные данные.'


def _norm_brand_name(value):
    s = (value or '').strip()
    s = re.sub(r'\s+', ' ', s)
    return s


def _norm_phone(value):
    if value is None:
        return ''
    return re.sub(r'\s+', '', str(value).strip())


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
    remove_audio = serializers.BooleanField(required=False, write_only=True, default=False)

    class Meta:
        model = Business
        fields = [
            'brand_name', 'description', 'category',
            'city', 'address', 'phone', 'website', 'logo', 'cover', 'audio', 'faq', 'services',
            'social_telegram', 'social_whatsapp', 'social_instagram',
            'social_youtube', 'social_tiktok', 'social_facebook',
            'tags', 'remove_audio',
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

    def validate(self, attrs):
        instance = self.instance
        if instance:
            brand = _norm_brand_name(
                attrs['brand_name'] if 'brand_name' in attrs else instance.brand_name
            )
            phone = _norm_phone(
                attrs['phone'] if 'phone' in attrs else instance.phone
            )
        else:
            brand = _norm_brand_name(attrs.get('brand_name', ''))
            phone = _norm_phone(attrs.get('phone', ''))

        if 'brand_name' in attrs:
            attrs['brand_name'] = brand
        if 'phone' in attrs:
            attrs['phone'] = phone

        qs = Business.objects.all()
        if instance is not None:
            qs = qs.exclude(pk=instance.pk)

        brand_taken = bool(brand) and qs.filter(brand_name__iexact=brand).exists()
        phone_taken = bool(phone) and qs.filter(phone=phone).exists()
        if brand_taken or phone_taken:
            raise serializers.ValidationError(BUSINESS_IDENTITY_CONFLICT_MSG)

        return attrs

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
        validated_data.pop('remove_audio', False)
        user = self.context['request'].user
        try:
            with transaction.atomic():
                group = GroupChat.objects.create(
                    name=validated_data.get('brand_name', 'Группа'),
                    description=f'Группа магазина {validated_data.get("brand_name", "")}',
                    creator=user,
                )
                GroupMember.objects.create(group=group, user=user, role=GroupMember.Role.OWNER)
                instance = Business.objects.create(owner=user, group=group, **validated_data)
        except IntegrityError:
            raise serializers.ValidationError(BUSINESS_IDENTITY_CONFLICT_MSG)
        if tag_names:
            self._set_tags(instance, tag_names)
        return instance

    def update(self, instance, validated_data):
        tag_names = validated_data.pop('tags', None)
        remove_audio = validated_data.pop('remove_audio', False)

        if remove_audio and instance.audio:
            instance.audio.delete(save=False)
            instance.audio = None

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        try:
            instance.save()
        except IntegrityError:
            raise serializers.ValidationError(BUSINESS_IDENTITY_CONFLICT_MSG)
        if tag_names is not None:
            self._set_tags(instance, tag_names)
        return instance
