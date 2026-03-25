from rest_framework import serializers
from Shop.models import Product


class ProductSerializer(serializers.ModelSerializer):
    image_display    = serializers.SerializerMethodField()
    currency_symbol  = serializers.SerializerMethodField()
    business_name    = serializers.CharField(source='business.brand_name', read_only=True)
    business_id      = serializers.IntegerField(source='business.id', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'business_id', 'business_name',
            'name', 'description', 'product_type',   # ДОБАВЬ product_type
            'price', 'currency', 'currency_symbol',
            'image_display', 'is_available', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_image_display(self, obj):
        if obj.image_url:
            return obj.image_url
        if obj.image:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.image.url) if request else obj.image.url
        return None

    def get_currency_symbol(self, obj):
        return {'TRY': '₺', 'USD': '$', 'EUR': '€', 'RUB': '₽'}.get(obj.currency, obj.currency)


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['name', 'description', 'product_type', 'price', 'currency', 'image', 'image_url', 'is_available']  # ДОБАВЬ product_type