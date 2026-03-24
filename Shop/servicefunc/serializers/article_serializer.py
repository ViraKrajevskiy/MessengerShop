from rest_framework import serializers
from Shop.models.models import Article


class ArticleSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(source='business.brand_name', read_only=True)
    business_id   = serializers.IntegerField(source='business.id', read_only=True)
    media_display = serializers.SerializerMethodField()
    tags          = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = [
            'id', 'business_id', 'business_name',
            'title', 'text',
            'media_display', 'media_type',
            'tags', 'views_count',
            'created_at', 'updated_at',
        ]

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