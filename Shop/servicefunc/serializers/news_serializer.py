from rest_framework import serializers
from Shop.models.models import News

class NewsSerializer(serializers.ModelSerializer):
    author_name    = serializers.CharField(source='author.username', read_only=True)
    business_name  = serializers.CharField(source='business.brand_name', read_only=True)
    business_id    = serializers.IntegerField(source='business.id', read_only=True)
    media_display  = serializers.SerializerMethodField()
    tags           = serializers.SerializerMethodField()
    is_favorited    = serializers.SerializerMethodField()
    favorites_count = serializers.SerializerMethodField()

    class Meta:
        model = News
        fields = [
            'id', 'news_type', 'business_id', 'business_name',
            'author_name', 'title', 'text',
            'media_display', 'media_type',
            'tags', 'views_count', 'is_published',
            'is_favorited', 'favorites_count',
            'created_at', 'updated_at',
        ]

    def get_is_favorited(self, obj):
        if hasattr(obj, '_is_favorited'):
            return obj._is_favorited
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.favorites.filter(user=request.user).exists()
        return False

    def get_favorites_count(self, obj):
        if hasattr(obj, '_favorites_count'):
            return obj._favorites_count
        return obj.favorites.count()

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
        return [t.name for t in obj.tags.all()]


class NewsCreateUpdateSerializer(serializers.ModelSerializer):
    tags = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False, write_only=True,
    )

    class Meta:
        model = News
        fields = ['title', 'text', 'media', 'media_url', 'media_type', 'tags', 'is_published']

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
        instance = News.objects.create(**validated_data)
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