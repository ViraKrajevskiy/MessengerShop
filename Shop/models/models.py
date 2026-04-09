import uuid as uuid_lib
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models import Q
from django.db.models.functions import Lower
from django.utils import timezone
from datetime import timedelta



class BaseController(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class User(AbstractUser, BaseController):
    class Role(models.TextChoices):
        USER = 'USER', 'Base User'
        BUSINESS = 'BUSINESS', 'Businessman'
        MODERATOR = 'MODERATOR', 'Moderator'

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.USER)
    city = models.CharField(max_length=100, blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    is_active = models.BooleanField(default=False)
    verification_code = models.CharField(max_length=6, blank=True, null=True)
    google_id = models.CharField(max_length=255, blank=True, null=True)
    qr_token  = models.UUIDField(default=uuid_lib.uuid4, unique=True, editable=False)
    last_seen = models.DateTimeField(null=True, blank=True)
    is_profile_blocked = models.BooleanField(default=False)
    profile_blocked_by = models.ForeignKey(
        'self', null=True, blank=True, on_delete=models.SET_NULL, related_name='profile_blocks_given',
    )
    profile_blocked_at = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return f'{self.email} ({self.role})'

    @property
    def is_business(self):
        return self.role == self.Role.BUSINESS

    @property
    def is_online(self):
        if not self.last_seen:
            return False
        return (timezone.now() - self.last_seen).total_seconds() < 300  # 5 минут


class Business(BaseController):
    class Category(models.TextChoices):
        BEAUTY    = 'BEAUTY',    'Красота и уход'
        HEALTH    = 'HEALTH',    'Здоровье'
        REALTY    = 'REALTY',    'Недвижимость'
        EDUCATION = 'EDUCATION', 'Образование'
        FINANCE   = 'FINANCE',   'Финансы'
        LEGAL     = 'LEGAL',     'Юридические услуги'
        TOURISM   = 'TOURISM',   'Туризм'
        FOOD      = 'FOOD',      'Еда и рестораны'
        TRANSPORT = 'TRANSPORT', 'Транспорт'
        OTHER     = 'OTHER',     'Другое'

    class PlanType(models.TextChoices):
        FREE = 'FREE', 'Бесплатный'
        PRO  = 'PRO',  'Pro'
        VIP  = 'VIP',  'VIP'

    class PlanPeriod(models.TextChoices):
        MONTH   = 'MONTH',   '1 месяц'
        QUARTER = 'QUARTER', '3 месяца'
        YEAR    = 'YEAR',    '12 месяцев'

    owner = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='business_profile',
        limit_choices_to={'role': User.Role.BUSINESS},
    )
    brand_name   = models.CharField(max_length=200)
    description  = models.TextField(blank=True)
    category     = models.CharField(max_length=20, choices=Category.choices, default=Category.OTHER)
    city         = models.CharField(max_length=100, blank=True)
    address      = models.CharField(max_length=300, blank=True)
    phone        = models.CharField(max_length=30, blank=True)
    website      = models.URLField(blank=True)
    logo         = models.ImageField(upload_to='logos/', blank=True, null=True)
    cover        = models.ImageField(upload_to='covers/', blank=True, null=True)
    is_verified  = models.BooleanField(default=False)
    plan_type    = models.CharField(max_length=10, choices=PlanType.choices, default=PlanType.FREE)
    plan_period  = models.CharField(max_length=10, choices=PlanPeriod.choices, null=True, blank=True)
    plan_expires_at = models.DateTimeField(null=True, blank=True)
    rating       = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    views_count  = models.PositiveIntegerField(default=0)
    group        = models.OneToOneField(
        'GroupChat', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='business',
    )
    audio    = models.FileField(upload_to='business_audio/', blank=True, null=True)
    faq      = models.JSONField(default=list, blank=True)
    services = models.JSONField(default=list, blank=True)
    tags     = models.ManyToManyField('Tag', blank=True, related_name='businesses')

    # Social media links
    social_telegram  = models.CharField(max_length=200, blank=True)
    social_whatsapp  = models.CharField(max_length=200, blank=True)
    social_instagram = models.CharField(max_length=200, blank=True)
    social_youtube   = models.CharField(max_length=200, blank=True)
    social_tiktok    = models.CharField(max_length=200, blank=True)
    social_facebook  = models.CharField(max_length=200, blank=True)

    @property
    def is_vip(self):
        if self.plan_type != self.PlanType.VIP:
            return False
        if self.plan_expires_at and self.plan_expires_at < timezone.now():
            return False
        return True

    @property
    def is_pro(self):
        if self.plan_type not in (self.PlanType.PRO, self.PlanType.VIP):
            return False
        if self.plan_expires_at and self.plan_expires_at < timezone.now():
            return False
        return True

    class Meta:
        ordering = ['-plan_type', '-rating', '-created_at']
        verbose_name = 'Business'
        verbose_name_plural = 'Businesses'
        constraints = [
            models.UniqueConstraint(
                Lower('brand_name'),
                name='uniq_business_brand_name_ci',
            ),
            models.UniqueConstraint(
                fields=['phone'],
                condition=~Q(phone=''),
                name='uniq_business_phone_when_set',
            ),
        ]

    def __str__(self):
        return f'{self.brand_name} ({self.owner.email})'


def story_expires_at():
    return timezone.now() + timedelta(hours=24)


class Story(BaseController):
    class MediaType(models.TextChoices):
        IMAGE = 'IMAGE', 'Image'
        VIDEO = 'VIDEO', 'Video'

    author = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='stories',
        limit_choices_to={'role': User.Role.BUSINESS},
    )
    media      = models.FileField(upload_to='stories/', blank=True, null=True)
    media_url  = models.URLField(blank=True)
    media_type = models.CharField(max_length=10, choices=MediaType.choices, default=MediaType.IMAGE)
    caption    = models.CharField(max_length=500, blank=True)
    expires_at = models.DateTimeField(default=story_expires_at)
    is_blocked  = models.BooleanField(default=False)
    blocked_by  = models.ForeignKey(
        'User', null=True, blank=True, on_delete=models.SET_NULL, related_name='blocked_stories',
    )
    blocked_at  = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Story'
        verbose_name_plural = 'Stories'

    def __str__(self):
        return f'Story by {self.author.email} at {self.created_at:%Y-%m-%d %H:%M}'

    @property
    def is_active(self):
        return timezone.now() < self.expires_at

    @property
    def views_count(self):
        return self.story_views.count()


class StoryView(models.Model):
    story     = models.ForeignKey(Story, on_delete=models.CASCADE, related_name='story_views')
    viewer    = models.ForeignKey(User, on_delete=models.CASCADE, related_name='viewed_stories')
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('story', 'viewer')
        verbose_name = 'Story View'
        verbose_name_plural = 'Story Views'

    def __str__(self):
        return f'{self.viewer.email} viewed story #{self.story_id}'


class Product(BaseController):
    class Currency(models.TextChoices):
        TRY = 'TRY', '₺ Лира'
        USD = 'USD', '$ Доллар'
        EUR = 'EUR', '€ Евро'
        RUB = 'RUB', '₽ Рубль'

    class ProductType(models.TextChoices):       # НОВОЕ
        PRODUCT = 'PRODUCT', 'Продукт'
        SERVICE = 'SERVICE', 'Услуга'

    business     = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='products')
    name         = models.CharField(max_length=200)
    description  = models.TextField(blank=True)
    product_type = models.CharField(                # НОВОЕ
        max_length=10,
        choices=ProductType.choices,
        default=ProductType.PRODUCT,
    )
    price        = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency     = models.CharField(max_length=3, choices=Currency.choices, default=Currency.TRY)
    image        = models.ImageField(upload_to='products/', blank=True, null=True)
    image_url    = models.URLField(blank=True)
    is_available = models.BooleanField(default=True)
    views_count  = models.PositiveIntegerField(default=0)
    tags         = models.ManyToManyField('Tag', blank=True, related_name='products')
    is_blocked   = models.BooleanField(default=False)
    blocked_by   = models.ForeignKey(
        'User', null=True, blank=True, on_delete=models.SET_NULL, related_name='blocked_products',
    )
    blocked_at   = models.DateTimeField(null=True, blank=True)


class VerificationRequest(BaseController):
    class Status(models.TextChoices):
        PENDING  = 'PENDING',  'На рассмотрении'
        APPROVED = 'APPROVED', 'Подтверждён'
        REJECTED = 'REJECTED', 'Отклонён'

    business    = models.OneToOneField(
        'Business', on_delete=models.CASCADE, related_name='verification',
    )
    status      = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    comment     = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='reviewed_verifications',
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Verification Request'
        verbose_name_plural = 'Verification Requests'

    def __str__(self):
        return f'Verification [{self.status}] — {self.business.brand_name}'


class VerificationDocument(models.Model):
    request     = models.ForeignKey(VerificationRequest, on_delete=models.CASCADE, related_name='documents')
    file        = models.FileField(upload_to='verification_docs/')
    name        = models.CharField(max_length=200)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.name} → {self.request}'


class VerificationMessage(models.Model):
    request    = models.ForeignKey(VerificationRequest, on_delete=models.CASCADE, related_name='messages')
    sender     = models.ForeignKey(User, on_delete=models.CASCADE, related_name='verification_messages')
    text       = models.TextField(blank=True)
    file       = models.FileField(upload_to='verification_chat/', null=True, blank=True)
    file_name  = models.CharField(max_length=255, blank=True)
    is_edited  = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'Message from {self.sender.email} in {self.request}'

class News(BaseController):
    class MediaType(models.TextChoices):
        IMAGE = 'IMAGE', 'Image'
        VIDEO = 'VIDEO', 'Video'

    class NewsType(models.TextChoices):
        BUSINESS = 'BUSINESS', 'Новости бизнеса'
        PLATFORM = 'PLATFORM', 'Новости платформы'

    # Если business=None — это глобальная новость платформы (от админа)
    business    = models.ForeignKey(
        Business, on_delete=models.CASCADE,
        related_name='news', null=True, blank=True,
    )
    author      = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='news_authored',
    )
    news_type   = models.CharField(max_length=20, choices=NewsType.choices, default=NewsType.BUSINESS)
    title       = models.CharField(max_length=300)
    text        = models.TextField(blank=True)
    media       = models.FileField(upload_to='news/', blank=True, null=True)
    media_url   = models.URLField(blank=True)
    media_type  = models.CharField(max_length=10, choices=MediaType.choices, default=MediaType.IMAGE)
    tags        = models.ManyToManyField('Tag', blank=True, related_name='news')
    views_count = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'News'
        verbose_name_plural = 'News'

    def __str__(self):
        src = self.business.brand_name if self.business else 'Платформа'
        return f'[{src}] {self.title}'

    @property
    def media_display(self):
        if self.media_url:
            return self.media_url
        if self.media:
            return self.media.url
        return None




class Post(BaseController):
    class MediaType(models.TextChoices):
        IMAGE = 'IMAGE', 'Image'
        VIDEO = 'VIDEO', 'Video'

    views_count = models.PositiveIntegerField(default=0)
    tags = models.ManyToManyField('Tag', blank=True, related_name='posts')
    business   = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='posts')
    text       = models.TextField(blank=True)
    media      = models.FileField(upload_to='posts/', blank=True, null=True)
    media_url  = models.URLField(blank=True)
    media_type = models.CharField(max_length=10, choices=MediaType.choices, default=MediaType.IMAGE)
    views_count = models.PositiveIntegerField(default=0)
    is_blocked  = models.BooleanField(default=False)
    blocked_by  = models.ForeignKey(
        'User', null=True, blank=True, on_delete=models.SET_NULL, related_name='blocked_posts',
    )
    blocked_at  = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Post'
        verbose_name_plural = 'Posts'

    def __str__(self):
        return f'Post by {self.business.brand_name} at {self.created_at:%Y-%m-%d %H:%M}'

    @property
    def media_display(self):
        if self.media_url:
            return self.media_url
        if self.media:
            return self.media.url
        return None


class ProductLike(models.Model):
    product    = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='likes')
    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='liked_products')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('product', 'user')

    def __str__(self):
        return f'{self.user.email} liked {self.product.name}'


class ProductInquiry(BaseController):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='inquiries')
    sender  = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_inquiries')
    message = models.TextField()
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Product Inquiry'
        verbose_name_plural = 'Product Inquiries'

    def __str__(self):
        return f'Inquiry from {self.sender.email} for {self.product.name}'


class InquiryMessage(models.Model):
    inquiry    = models.ForeignKey(ProductInquiry, on_delete=models.CASCADE, related_name='messages')
    sender     = models.ForeignKey(User, on_delete=models.CASCADE, related_name='inquiry_messages')
    text       = models.TextField()
    is_edited  = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'Message from {self.sender.email} in inquiry #{self.inquiry_id}'


class Review(models.Model):
    author   = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='reviews', null=True, blank=True)
    product  = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews', null=True, blank=True)
    rating   = models.PositiveSmallIntegerField()
    text     = models.TextField(blank=True)
    pros     = models.CharField(max_length=500, blank=True)
    cons     = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_blocked = models.BooleanField(default=False)
    blocked_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='blocked_reviews',
    )
    blocked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['author', 'business'],
                condition=models.Q(business__isnull=False),
                name='unique_user_business_review',
            ),
            models.UniqueConstraint(
                fields=['author', 'product'],
                condition=models.Q(product__isnull=False),
                name='unique_user_product_review',
            ),
        ]

    def __str__(self):
        return f'Review {self.rating}★ by {self.author.email}'


class BusinessSubscription(models.Model):
    user     = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscriptions')
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='subscribers')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'business')
        ordering = ['-created_at']
        verbose_name = 'Business Subscription'
        verbose_name_plural = 'Business Subscriptions'

    def __str__(self):
        return f'{self.user.email} → {self.business.brand_name}'


class GroupChat(BaseController):
    name        = models.CharField(max_length=200)
    description = models.CharField(max_length=500, blank=True)
    photo       = models.ImageField(upload_to='group_photos/', blank=True, null=True)
    photo_url   = models.URLField(blank=True)
    creator     = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_groups')

    class Meta:
        ordering = ['-updated_at']
        verbose_name = 'Group Chat'
        verbose_name_plural = 'Group Chats'

    def __str__(self):
        return self.name


class GroupMember(models.Model):
    class Role(models.TextChoices):
        OWNER     = 'OWNER',     'Владелец'
        ADMIN     = 'ADMIN',     'Администратор'
        MODERATOR = 'MODERATOR', 'Модератор'
        MEMBER    = 'MEMBER',    'Участник'

    group     = models.ForeignKey(GroupChat, on_delete=models.CASCADE, related_name='members')
    user      = models.ForeignKey(User, on_delete=models.CASCADE, related_name='group_memberships')
    role      = models.CharField(max_length=10, choices=Role.choices, default=Role.MEMBER)
    can_delete_messages = models.BooleanField(default=False)
    can_pin_messages    = models.BooleanField(default=False)
    can_send_messages   = models.BooleanField(default=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('group', 'user')
        verbose_name = 'Group Member'
        verbose_name_plural = 'Group Members'

    def __str__(self):
        return f'{self.user.email} in {self.group.name} ({self.role})'

    def save(self, *args, **kwargs):
        if self.role in (self.Role.OWNER, self.Role.ADMIN, self.Role.MODERATOR):
            self.can_delete_messages = True
            self.can_pin_messages = True
        super().save(*args, **kwargs)


class GroupMessage(models.Model):
    group      = models.ForeignKey(GroupChat, on_delete=models.CASCADE, related_name='group_messages')
    sender     = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='group_messages_sent')
    text       = models.TextField()
    is_pinned  = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    is_edited  = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        verbose_name = 'Group Message'
        verbose_name_plural = 'Group Messages'

    def __str__(self):
        return f'GroupMessage #{self.id} in {self.group.name}'


class Tag(models.Model):
    """Хэштеги для бизнесов, постов и продуктов."""
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Tag'
        verbose_name_plural = 'Tags'

    def __str__(self):
        return f'#{self.name}'


class Article(BaseController):
    """Статьи бизнесов (long-form content)."""
    class MediaType(models.TextChoices):
        IMAGE = 'IMAGE', 'Image'
        VIDEO = 'VIDEO', 'Video'

    business    = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='articles')
    title       = models.CharField(max_length=300)
    text        = models.TextField()
    media       = models.FileField(upload_to='articles/', blank=True, null=True)
    media_url   = models.URLField(blank=True)
    media_type  = models.CharField(max_length=10, choices=MediaType.choices, default=MediaType.IMAGE)
    tags        = models.ManyToManyField(Tag, blank=True, related_name='articles')
    views_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Article'
        verbose_name_plural = 'Articles'

    def __str__(self):
        return f'{self.title} — {self.business.brand_name}'

    @property
    def media_display(self):
        if self.media_url:
            return self.media_url
        if self.media:
            return self.media.url
        return None


class Comment(BaseController):
    story  = models.ForeignKey(Story, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    parent = models.ForeignKey(
        'self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies',
    )
    text       = models.TextField(max_length=1000)
    is_deleted = models.BooleanField(default=False)
    is_blocked = models.BooleanField(default=False)
    blocked_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='blocked_comments',
    )
    blocked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['created_at']
        verbose_name = 'Comment'
        verbose_name_plural = 'Comments'

    def __str__(self):
        return f'Comment by {self.author.email} on story #{self.story_id}'


class PostFavorite(models.Model):
    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorite_posts')
    post       = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='favorites')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'post')
        ordering = ['-created_at']
        verbose_name = 'Post Favorite'
        verbose_name_plural = 'Post Favorites'

    def __str__(self):
        return f'{self.user.email} → {self.post.id}'


class Complaint(BaseController):
    class Reason(models.TextChoices):
        SPAM           = 'SPAM',          'Спам'
        INAPPROPRIATE  = 'INAPPROPRIATE', 'Неприемлемый контент'
        FRAUD          = 'FRAUD',         'Мошенничество'
        MISINFORMATION = 'MISINFORMATION','Дезинформация'
        OTHER          = 'OTHER',         'Другое'

    class Status(models.TextChoices):
        PENDING  = 'PENDING',  'На рассмотрении'
        RESOLVED = 'RESOLVED', 'Решено'
        REJECTED = 'REJECTED', 'Отклонено'

    reporter     = models.ForeignKey(User, on_delete=models.CASCADE, related_name='complaints_sent')
    post         = models.ForeignKey(Post, null=True, blank=True, on_delete=models.CASCADE, related_name='complaints')
    business     = models.ForeignKey(Business, null=True, blank=True, on_delete=models.CASCADE, related_name='complaints')
    target_user  = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.CASCADE, related_name='complaints_received',
    )
    reason       = models.CharField(max_length=20, choices=Reason.choices, default=Reason.OTHER)
    description  = models.TextField(blank=True)
    status       = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    resolved_by  = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='resolved_complaints',
    )
    resolved_at     = models.DateTimeField(null=True, blank=True)
    resolution_note = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Complaint'
        verbose_name_plural = 'Complaints'

    def __str__(self):
        if self.post_id:        target = f'post#{self.post_id}'
        elif self.business_id:  target = f'business#{self.business_id}'
        elif self.target_user_id: target = f'user#{self.target_user_id}'
        else:                   target = '?'
        return f'Complaint [{self.status}] by {self.reporter.email} → {target}'


class PaymentRequest(BaseController):
    """Заявка на оплату тарифа — пользователь прикладывает скрин/фото оплаты."""
    class Status(models.TextChoices):
        PENDING  = 'PENDING',  'На рассмотрении'
        APPROVED = 'APPROVED', 'Подтверждено'
        REJECTED = 'REJECTED', 'Отклонено'

    business        = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='payment_requests')
    plan_type       = models.CharField(max_length=10, choices=Business.PlanType.choices)
    plan_period     = models.CharField(max_length=10, choices=Business.PlanPeriod.choices, null=True, blank=True)
    message         = models.TextField(blank=True)
    proof_file      = models.FileField(upload_to='payment_proofs/', null=True, blank=True)
    status          = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    reviewed_by     = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='reviewed_payments',
    )
    reviewed_at     = models.DateTimeField(null=True, blank=True)
    rejection_note  = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Payment Request'
        verbose_name_plural = 'Payment Requests'

    def __str__(self):
        return f'Payment [{self.status}] {self.business.brand_name} → {self.plan_type}'


class Notification(models.Model):
    class Type(models.TextChoices):
        FOLLOW      = 'FOLLOW',      'Новый подписчик'
        NEW_POST    = 'NEW_POST',    'Новый пост'
        INQUIRY_MSG = 'INQUIRY_MSG', 'Сообщение в запросе'
        GROUP_MSG   = 'GROUP_MSG',   'Сообщение в группе'

    recipient  = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type       = models.CharField(max_length=20, choices=Type.choices)
    title      = models.CharField(max_length=200)
    body       = models.TextField(blank=True)
    is_read    = models.BooleanField(default=False)
    data       = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'

    def __str__(self):
        return f'[{self.type}] → {self.recipient.email}'