from rest_framework import serializers

from Shop.models import Comment


class CommentAuthorSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    avatar = serializers.ImageField()
    role = serializers.CharField()


class ReplySerializer(serializers.ModelSerializer):
    author = CommentAuthorSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'author', 'text', 'created_at']


class CommentSerializer(serializers.ModelSerializer):
    author = CommentAuthorSerializer(read_only=True)
    replies = ReplySerializer(many=True, read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'author', 'story', 'parent', 'text', 'replies', 'created_at']
        read_only_fields = ['created_at']

    def validate(self, data):
        parent = data.get('parent')
        story = data.get('story')
        # reply должен принадлежать тому же сторису
        if parent and parent.story_id != story.id:
            raise serializers.ValidationError(
                {'parent': 'Родительский комментарий не принадлежит этому сторису.'}
            )
        # нельзя отвечать на реплай
        if parent and parent.parent is not None:
            raise serializers.ValidationError(
                {'parent': 'Нельзя отвечать на реплай — только на корневой комментарий.'}
            )
        return data

    def create(self, validated_data):
        request = self.context['request']
        return Comment.objects.create(author=request.user, **validated_data)


class CommentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ['story', 'parent', 'text']

    def validate(self, data):
        parent = data.get('parent')
        story = data.get('story')
        if parent and parent.story_id != story.id:
            raise serializers.ValidationError(
                {'parent': 'Родительский комментарий не принадлежит этому сторису.'}
            )
        if parent and parent.parent is not None:
            raise serializers.ValidationError(
                {'parent': 'Нельзя отвечать на реплай.'}
            )
        return data

    def create(self, validated_data):
        return Comment.objects.create(
            author=self.context['request'].user,
            **validated_data
        )
