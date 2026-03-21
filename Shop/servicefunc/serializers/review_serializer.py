from rest_framework import serializers
from Shop.models import Review


class ReviewSerializer(serializers.ModelSerializer):
    author_name   = serializers.CharField(source='author.username', read_only=True)
    author_avatar = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ['id', 'author_name', 'author_avatar', 'rating', 'text', 'pros', 'cons', 'created_at']

    def get_author_avatar(self, obj):
        if obj.author.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.author.avatar.url)
            return obj.author.avatar.url
        return None


class ReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['rating', 'text', 'pros', 'cons']

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError('Оценка должна быть от 1 до 5')
        return value
