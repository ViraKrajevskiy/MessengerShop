import uuid as uuid_lib
from django.contrib.auth.models import AbstractUser
from django.db import models
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

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return f'{self.email} ({self.role})'

    @property
    def is_business(self):
        return self.role == self.Role.BUSINESS


# ── Business Profile ───────────────────────────────────────────────────────────

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
    is_vip       = models.BooleanField(default=False)
    rating       = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    views_count  = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-is_vip', '-rating', '-created_at']
        verbose_name = 'Business'
        verbose_name_plural = 'Businesses'

    def __str__(self):
        return f'{self.brand_name} ({self.owner.email})'


# ── Stories ────────────────────────────────────────────────────────────────────

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
    media_url  = models.URLField(blank=True)   # внешняя ссылка на фото (для seed-данных)
    media_type = models.CharField(max_length=10, choices=MediaType.choices, default=MediaType.IMAGE)
    caption    = models.CharField(max_length=500, blank=True)
    expires_at = models.DateTimeField(default=story_expires_at)

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


# ── Products ───────────────────────────────────────────────────────────────────

class Product(BaseController):
    class Currency(models.TextChoices):
        TRY = 'TRY', '₺ Лира'
        USD = 'USD', '$ Доллар'
        EUR = 'EUR', '€ Евро'
        RUB = 'RUB', '₽ Рубль'

    business    = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='products')
    name        = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price       = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency    = models.CharField(max_length=3, choices=Currency.choices, default=Currency.TRY)
    image       = models.ImageField(upload_to='products/', blank=True, null=True)
    image_url   = models.URLField(blank=True)   # внешняя ссылка (для seed-данных)
    is_available = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Product'
        verbose_name_plural = 'Products'

    def __str__(self):
        return f'{self.name} — {self.business.brand_name}'


# ── Verification ──────────────────────────────────────────────────────────────

class VerificationRequest(BaseController):
    class Status(models.TextChoices):
        PENDING  = 'PENDING',  'На рассмотрении'
        APPROVED = 'APPROVED', 'Подтверждён'
        REJECTED = 'REJECTED', 'Отклонён'

    business    = models.OneToOneField(
        'Business', on_delete=models.CASCADE, related_name='verification',
    )
    status      = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    comment     = models.TextField(blank=True)       # комментарий модератора
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
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'Message from {self.sender.email} in {self.request}'


# ── Posts ──────────────────────────────────────────────────────────────────────

class Post(BaseController):
    class MediaType(models.TextChoices):
        IMAGE = 'IMAGE', 'Image'
        VIDEO = 'VIDEO', 'Video'

    business   = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='posts')
    text       = models.TextField(blank=True)
    media      = models.FileField(upload_to='posts/', blank=True, null=True)
    media_url  = models.URLField(blank=True)
    media_type = models.CharField(max_length=10, choices=MediaType.choices, default=MediaType.IMAGE)
    views_count = models.PositiveIntegerField(default=0)

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


# ── Product Inquiry ─────────────────────────────────────────────────────────────

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


# ── Comments ───────────────────────────────────────────────────────────────────

class Comment(BaseController):
    story  = models.ForeignKey(Story, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    parent = models.ForeignKey(
        'self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies',
    )
    text       = models.TextField(max_length=1000)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        ordering = ['created_at']
        verbose_name = 'Comment'
        verbose_name_plural = 'Comments'

    def __str__(self):
        return f'Comment by {self.author.email} on story #{self.story_id}'
