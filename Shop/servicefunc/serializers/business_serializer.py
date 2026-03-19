from rest_framework import serializers
from Shop.models import Business
from .product_serializer import ProductSerializer


class BusinessListSerializer(serializers.ModelSerializer):
    """Краткая карточка для списка (главная страница)"""
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    owner_avatar   = serializers.ImageField(source='owner.avatar', read_only=True)
    category_label = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = Business
        fields = [
            'id', 'brand_name', 'category', 'category_label',
            'city', 'logo', 'is_verified', 'is_vip',
            'rating', 'views_count',
            'owner_username', 'owner_avatar',
        ]


class BusinessDetailSerializer(serializers.ModelSerializer):
    """Полный профиль бизнеса"""
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    owner_email    = serializers.EmailField(source='owner.email', read_only=True)
    owner_avatar   = serializers.ImageField(source='owner.avatar', read_only=True)
    category_label = serializers.CharField(source='get_category_display', read_only=True)
    products       = serializers.SerializerMethodField()

    class Meta:
        model = Business
        fields = [
            'id', 'brand_name', 'description', 'category', 'category_label',
            'city', 'address', 'phone', 'website',
            'logo', 'cover', 'is_verified', 'is_vip',
            'rating', 'views_count', 'created_at',
            'owner_username', 'owner_email', 'owner_avatar',
            'products',
        ]
        read_only_fields = ['is_verified', 'is_vip', 'rating', 'views_count', 'created_at']

    def get_products(self, obj):
        qs = obj.products.filter(is_available=True)
        return ProductSerializer(qs, many=True, context=self.context).data


class BusinessCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Business
        fields = [
            'brand_name', 'description', 'category',
            'city', 'address', 'phone', 'website', 'logo', 'cover',
        ]

    def create(self, validated_data):
        return Business.objects.create(
            owner=self.context['request'].user,
            **validated_data
        )
