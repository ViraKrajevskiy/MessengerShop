from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import BusinessSubscription, Post, InquiryMessage, GroupMessage, Notification


@receiver(post_save, sender=BusinessSubscription)
def notify_new_subscriber(sender, instance, created, **kwargs):
    if not created:
        return
    business_owner = instance.business.owner
    Notification.objects.create(
        recipient=business_owner,
        type=Notification.Type.FOLLOW,
        title='Новый подписчик',
        body=f'{instance.user.username} подписался на ваш бизнес «{instance.business.brand_name}»',
        data={'business_id': instance.business.id, 'user_id': instance.user.id},
    )


@receiver(post_save, sender=Post)
def notify_new_post(sender, instance, created, **kwargs):
    if not created:
        return
    subscribers = instance.business.subscribers.select_related('user').all()
    notifications = [
        Notification(
            recipient=sub.user,
            type=Notification.Type.NEW_POST,
            title=f'Новый пост от «{instance.business.brand_name}»',
            body=instance.text[:120] if instance.text else '',
            data={'post_id': instance.id, 'business_id': instance.business.id},
        )
        for sub in subscribers
    ]
    if notifications:
        Notification.objects.bulk_create(notifications)


@receiver(post_save, sender=InquiryMessage)
def notify_inquiry_message(sender, instance, created, **kwargs):
    if not created:
        return
    inquiry = instance.inquiry
    biz = inquiry.biz  # business (direct chat) or product.business
    if biz is None:
        return
    business_owner = biz.owner
    if instance.sender == business_owner:
        recipient = inquiry.sender
        title = f'Ответ от «{biz.brand_name}»'
    else:
        recipient = business_owner
        if inquiry.product:
            title = f'Новый запрос по товару «{inquiry.product.name}»'
        else:
            title = f'Новое сообщение для «{biz.brand_name}»'
    if recipient is None:
        return
    Notification.objects.create(
        recipient=recipient,
        type=Notification.Type.INQUIRY_MSG,
        title=title,
        body=instance.text[:120],
        data={
            'inquiry_id': inquiry.id,
            'product_id': inquiry.product.id if inquiry.product else None,
        },
    )


@receiver(post_save, sender=GroupMessage)
def notify_group_message(sender, instance, created, **kwargs):
    if not created or instance.is_deleted:
        return
    members = instance.group.members.select_related('user').exclude(user=instance.sender)
    notifications = [
        Notification(
            recipient=member.user,
            type=Notification.Type.GROUP_MSG,
            title=f'Новое сообщение в «{instance.group.name}»',
            body=f'{instance.sender.username if instance.sender else "?"}: {instance.text[:80]}',
            data={'group_id': instance.group.id},
        )
        for member in members
    ]
    if notifications:
        Notification.objects.bulk_create(notifications)
