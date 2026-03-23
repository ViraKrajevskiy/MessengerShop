from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.contrib.auth import get_user_model
from Shop.models import GroupChat, GroupMember, GroupMessage
from Shop.servicefunc.serializers.group_serializer import (
    GroupChatListSerializer, GroupChatDetailSerializer,
    GroupMemberSerializer, GroupMessageSerializer,
)

User = get_user_model()


class GroupListCreateView(APIView):
    """GET — мои группы, POST — создать группу."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        groups = GroupChat.objects.filter(members__user=request.user)
        return Response(GroupChatListSerializer(groups, many=True, context={'request': request}).data)

    def post(self, request):
        name = request.data.get('name', '').strip()
        if not name:
            return Response({'detail': 'Название обязательно'}, status=status.HTTP_400_BAD_REQUEST)
        group = GroupChat.objects.create(
            name=name,
            description=request.data.get('description', ''),
            photo_url=request.data.get('photo_url', ''),
            creator=request.user,
        )
        GroupMember.objects.create(group=group, user=request.user, role=GroupMember.Role.OWNER)
        return Response(GroupChatDetailSerializer(group, context={'request': request}).data, status=status.HTTP_201_CREATED)


class GroupDetailView(APIView):
    """GET — детали группы, PATCH — редактировать, DELETE — удалить."""
    permission_classes = [IsAuthenticated]

    def _get_group(self, pk, user):
        try:
            group = GroupChat.objects.get(pk=pk)
        except GroupChat.DoesNotExist:
            return None, None
        membership = group.members.filter(user=user).first()
        return group, membership

    def get(self, request, pk):
        group, membership = self._get_group(pk, request.user)
        if not group or not membership:
            return Response({'detail': 'Не найдено'}, status=status.HTTP_404_NOT_FOUND)
        return Response(GroupChatDetailSerializer(group, context={'request': request}).data)

    def patch(self, request, pk):
        group, membership = self._get_group(pk, request.user)
        if not group or not membership:
            return Response({'detail': 'Не найдено'}, status=status.HTTP_404_NOT_FOUND)
        if membership.role not in (GroupMember.Role.OWNER, GroupMember.Role.ADMIN):
            return Response({'detail': 'Нет прав'}, status=status.HTTP_403_FORBIDDEN)
        for field in ('name', 'description', 'photo_url'):
            if field in request.data:
                setattr(group, field, request.data[field])
        group.save()
        return Response(GroupChatDetailSerializer(group, context={'request': request}).data)

    def delete(self, request, pk):
        group, membership = self._get_group(pk, request.user)
        if not group or not membership:
            return Response({'detail': 'Не найдено'}, status=status.HTTP_404_NOT_FOUND)
        if membership.role != GroupMember.Role.OWNER:
            return Response({'detail': 'Только владелец может удалить группу'}, status=status.HTTP_403_FORBIDDEN)
        group.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class GroupMembersView(APIView):
    """GET — участники, POST — добавить по username."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            group = GroupChat.objects.get(pk=pk)
        except GroupChat.DoesNotExist:
            return Response({'detail': 'Не найдено'}, status=status.HTTP_404_NOT_FOUND)
        if not group.members.filter(user=request.user).exists():
            return Response({'detail': 'Нет доступа'}, status=status.HTTP_403_FORBIDDEN)
        members = group.members.select_related('user').all()
        return Response(GroupMemberSerializer(members, many=True, context={'request': request}).data)

    def post(self, request, pk):
        """Добавить пользователя: { username, role? }"""
        try:
            group = GroupChat.objects.get(pk=pk)
        except GroupChat.DoesNotExist:
            return Response({'detail': 'Не найдено'}, status=status.HTTP_404_NOT_FOUND)
        me = group.members.filter(user=request.user).first()
        if not me or me.role not in (GroupMember.Role.OWNER, GroupMember.Role.ADMIN):
            return Response({'detail': 'Нет прав на добавление'}, status=status.HTTP_403_FORBIDDEN)

        username = request.data.get('username', '').strip()
        if not username:
            return Response({'detail': 'username обязателен'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            target_user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'detail': 'Пользователь не найден'}, status=status.HTTP_404_NOT_FOUND)

        if group.members.filter(user=target_user).exists():
            return Response({'detail': 'Уже в группе'}, status=status.HTTP_400_BAD_REQUEST)

        role = request.data.get('role', GroupMember.Role.MEMBER)
        if role not in dict(GroupMember.Role.choices):
            role = GroupMember.Role.MEMBER
        # Нельзя назначить OWNER
        if role == GroupMember.Role.OWNER:
            role = GroupMember.Role.MEMBER

        member = GroupMember.objects.create(group=group, user=target_user, role=role)
        return Response(GroupMemberSerializer(member, context={'request': request}).data, status=status.HTTP_201_CREATED)


class GroupMemberDetailView(APIView):
    """PATCH — изменить роль/доступы, DELETE — удалить участника."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk, member_pk):
        try:
            group = GroupChat.objects.get(pk=pk)
        except GroupChat.DoesNotExist:
            return Response({'detail': 'Не найдено'}, status=status.HTTP_404_NOT_FOUND)
        me = group.members.filter(user=request.user).first()
        if not me or me.role not in (GroupMember.Role.OWNER, GroupMember.Role.ADMIN):
            return Response({'detail': 'Нет прав'}, status=status.HTTP_403_FORBIDDEN)

        try:
            member = group.members.get(pk=member_pk)
        except GroupMember.DoesNotExist:
            return Response({'detail': 'Участник не найден'}, status=status.HTTP_404_NOT_FOUND)

        # Нельзя менять владельца
        if member.role == GroupMember.Role.OWNER and me.role != GroupMember.Role.OWNER:
            return Response({'detail': 'Нельзя изменить владельца'}, status=status.HTTP_403_FORBIDDEN)

        new_role = request.data.get('role')
        if new_role and new_role in dict(GroupMember.Role.choices) and new_role != GroupMember.Role.OWNER:
            member.role = new_role

        for perm in ('can_delete_messages', 'can_pin_messages', 'can_send_messages'):
            if perm in request.data:
                setattr(member, perm, bool(request.data[perm]))

        member.save()
        return Response(GroupMemberSerializer(member, context={'request': request}).data)

    def delete(self, request, pk, member_pk):
        try:
            group = GroupChat.objects.get(pk=pk)
        except GroupChat.DoesNotExist:
            return Response({'detail': 'Не найдено'}, status=status.HTTP_404_NOT_FOUND)
        me = group.members.filter(user=request.user).first()
        if not me or me.role not in (GroupMember.Role.OWNER, GroupMember.Role.ADMIN):
            return Response({'detail': 'Нет прав'}, status=status.HTTP_403_FORBIDDEN)

        try:
            member = group.members.get(pk=member_pk)
        except GroupMember.DoesNotExist:
            return Response({'detail': 'Участник не найден'}, status=status.HTTP_404_NOT_FOUND)

        if member.role == GroupMember.Role.OWNER:
            return Response({'detail': 'Нельзя удалить владельца'}, status=status.HTTP_403_FORBIDDEN)

        member.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class GroupMessagesView(APIView):
    """GET — сообщения группы, POST — отправить сообщение."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            group = GroupChat.objects.get(pk=pk)
        except GroupChat.DoesNotExist:
            return Response({'detail': 'Не найдено'}, status=status.HTTP_404_NOT_FOUND)
        if not group.members.filter(user=request.user).exists():
            return Response({'detail': 'Нет доступа'}, status=status.HTTP_403_FORBIDDEN)

        messages = group.group_messages.select_related('sender').filter(is_deleted=False)
        return Response(GroupMessageSerializer(messages, many=True, context={'request': request}).data)

    def post(self, request, pk):
        try:
            group = GroupChat.objects.get(pk=pk)
        except GroupChat.DoesNotExist:
            return Response({'detail': 'Не найдено'}, status=status.HTTP_404_NOT_FOUND)
        membership = group.members.filter(user=request.user).first()
        if not membership:
            return Response({'detail': 'Нет доступа'}, status=status.HTTP_403_FORBIDDEN)
        if not membership.can_send_messages:
            return Response({'detail': 'Вам запрещено отправлять сообщения'}, status=status.HTTP_403_FORBIDDEN)

        text = request.data.get('text', '').strip()
        if not text:
            return Response({'detail': 'Текст обязателен'}, status=status.HTTP_400_BAD_REQUEST)

        msg = GroupMessage.objects.create(group=group, sender=request.user, text=text)
        return Response(GroupMessageSerializer(msg, context={'request': request}).data, status=status.HTTP_201_CREATED)


class GroupMessageActionView(APIView):
    """PATCH — закрепить/откр, DELETE — удалить сообщение."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk, msg_pk):
        """Закрепить / открепить или редактировать текст."""
        try:
            group = GroupChat.objects.get(pk=pk)
        except GroupChat.DoesNotExist:
            return Response({'detail': 'Не найдено'}, status=status.HTTP_404_NOT_FOUND)
        membership = group.members.filter(user=request.user).first()
        if not membership:
            return Response({'detail': 'Нет доступа'}, status=status.HTTP_403_FORBIDDEN)

        try:
            msg = group.group_messages.get(pk=msg_pk)
        except GroupMessage.DoesNotExist:
            return Response({'detail': 'Сообщение не найдено'}, status=status.HTTP_404_NOT_FOUND)

        update_fields = []

        # Закрепление (нужны права)
        if 'is_pinned' in request.data:
            if not membership.can_pin_messages:
                return Response({'detail': 'Нет прав на закрепление'}, status=status.HTTP_403_FORBIDDEN)
            msg.is_pinned = bool(request.data['is_pinned'])
            update_fields.append('is_pinned')

        # Редактирование текста (только автор)
        if 'text' in request.data:
            if msg.sender != request.user:
                return Response({'detail': 'Можно редактировать только свои сообщения'}, status=status.HTTP_403_FORBIDDEN)
            text = request.data['text'].strip()
            if not text:
                return Response({'detail': 'Текст обязателен'}, status=status.HTTP_400_BAD_REQUEST)
            msg.text = text
            msg.is_edited = True
            update_fields += ['text', 'is_edited']

        if update_fields:
            msg.save(update_fields=update_fields)

        return Response(GroupMessageSerializer(msg, context={'request': request}).data)

    def delete(self, request, pk, msg_pk):
        try:
            group = GroupChat.objects.get(pk=pk)
        except GroupChat.DoesNotExist:
            return Response({'detail': 'Не найдено'}, status=status.HTTP_404_NOT_FOUND)
        membership = group.members.filter(user=request.user).first()
        if not membership:
            return Response({'detail': 'Нет доступа'}, status=status.HTTP_403_FORBIDDEN)

        try:
            msg = group.group_messages.get(pk=msg_pk)
        except GroupMessage.DoesNotExist:
            return Response({'detail': 'Сообщение не найдено'}, status=status.HTTP_404_NOT_FOUND)

        # Автор может удалить своё, или участник с правом can_delete_messages
        if msg.sender != request.user and not membership.can_delete_messages:
            return Response({'detail': 'Нет прав на удаление'}, status=status.HTTP_403_FORBIDDEN)

        msg.is_deleted = True
        msg.save(update_fields=['is_deleted'])
        return Response(status=status.HTTP_204_NO_CONTENT)


class GroupJoinView(APIView):
    """POST — вступить в группу (публичный вход)."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            group = GroupChat.objects.get(pk=pk)
        except GroupChat.DoesNotExist:
            return Response({'detail': 'Группа не найдена'}, status=status.HTTP_404_NOT_FOUND)

        if group.members.filter(user=request.user).exists():
            return Response({'detail': 'Вы уже в группе', 'joined': True})

        GroupMember.objects.create(group=group, user=request.user, role=GroupMember.Role.MEMBER)
        return Response({'detail': 'Вы вступили в группу', 'joined': True}, status=status.HTTP_201_CREATED)

    def get(self, request, pk):
        """Проверить статус участия."""
        try:
            group = GroupChat.objects.get(pk=pk)
        except GroupChat.DoesNotExist:
            return Response({'detail': 'Группа не найдена'}, status=status.HTTP_404_NOT_FOUND)

        is_member = group.members.filter(user=request.user).exists()
        return Response({'joined': is_member, 'group_id': group.id, 'group_name': group.name})
