from rest_framework import serializers

from Shop.models import Story, StoryView, Comment


class StoryAuthorSerializer(serializers.Serializer):
    id         = serializers.IntegerField()
    email      = serializers.EmailField()
    username   = serializers.CharField()
    avatar     = serializers.ImageField()
    city       = serializers.CharField()
    brand_name = serializers.SerializerMethodField()

    def get_brand_name(self, obj):
        try:
            return obj.business_profile.brand_name
        except Exception:
            return None


class StorySerializer(serializers.ModelSerializer):
    author        = StoryAuthorSerializer(read_only=True)
    business_id   = serializers.SerializerMethodField()
    is_active     = serializers.BooleanField(read_only=True)
    views_count   = serializers.IntegerField(read_only=True)
    comments_count = serializers.SerializerMethodField()
    media_display = serializers.SerializerMethodField()

    class Meta:
        model = Story
        fields = [
            'id', 'author', 'business_id', 'media', 'media_url', 'media_display', 'media_type', 'caption',
            'expires_at', 'is_active', 'views_count', 'comments_count',
            'created_at',
        ]
        read_only_fields = ['expires_at', 'created_at']

    def get_business_id(self, obj):
        try:
            return obj.author.business_profile.id
        except Exception:
            return None

    def get_comments_count(self, obj):
        if hasattr(obj, '_comments_count'):
            return obj._comments_count
        return obj.comments.filter(is_deleted=False, parent=None).count()

    def get_media_display(self, obj):
        """Возвращает URL медиафайла (загруженный или внешний)"""
        if obj.media_url:
            return obj.media_url
        if obj.media:
            request = self.context.get('request')
            try:
                return request.build_absolute_uri(obj.media.url) if request else obj.media.url
            except Exception:
                return None
        return None


class StoryCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Story
        fields = ['media', 'media_type', 'caption']

    def create(self, validated_data):
        request = self.context['request']
        return Story.objects.create(author=request.user, **validated_data)


class StoryViewSerializer(serializers.ModelSerializer):
    viewer_email = serializers.EmailField(source='viewer.email', read_only=True)
    viewed_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = StoryView
        fields = ['viewer_email', 'viewed_at']
