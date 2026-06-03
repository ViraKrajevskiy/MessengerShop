from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html, mark_safe
from Shop.models import (
    User, Business, Product, Story, StoryView,
    Comment, Post, ProductInquiry, InquiryMessage,
    VerificationRequest, VerificationDocument, VerificationMessage,
    News, Complaint, ComplaintReason,
    Tag, Article, Review,
    BusinessSubscription, BusinessFavorite, PostFavorite, NewsFavorite,
    ProductLike, GroupChat, GroupMember, GroupMessage,
    PaymentRequest, Notification, EmailVerificationCode,
    Survey, SurveyOption, SurveyResponse,
)

# ── News ──────────────────────────────────────────────────────────────────────
@admin.register(News)
class NewsAdmin(admin.ModelAdmin):
    # Поля, которые будут отображаться в списке всех новостей
    list_display = ('title', 'news_type', 'business_brand', 'author_email', 'is_published', 'views_count', 'created_at')

    # Фильтры в правой колонке
    list_filter = ('news_type', 'is_published', 'created_at')

    # Поля для поиска
    search_fields = ('title', 'text', 'business__brand_name', 'author__email')

    # Сортировка (сначала новые)
    ordering = ('-created_at',)

    # Позволяет менять статус публикации прямо из списка
    list_editable = ('is_published',)

    def business_brand(self, obj):
        return obj.business.brand_name if obj.business else mark_safe('<b style="color: #d32f2f;">Платформа</b>')

    business_brand.short_description = 'Источник (Бизнес)'

    def author_email(self, obj):
        return obj.author.email if obj.author else '—'

    author_email.short_description = 'Автор'

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display  = ('email', 'username', 'role', 'is_active', 'is_staff', 'created_at')
    list_filter   = ('role', 'is_active', 'is_staff', 'is_superuser')
    search_fields = ('email', 'username')
    ordering      = ('-created_at',)

    fieldsets = (
        (None,           {'fields': ('email', 'username', 'password')}),
        ('Роль/Город',   {'fields': ('role', 'city', 'avatar')}),
        ('Статус',       {'fields': ('is_active', 'is_staff', 'is_superuser', 'verification_code')}),
        ('Права',        {'fields': ('groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'role', 'password1', 'password2', 'is_active', 'is_staff'),
        }),
    )


# ── Business ──────────────────────────────────────────────────────────────────
@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    list_display  = ('brand_name', 'owner_email', 'category', 'city', 'is_verified', 'plan_type', 'plan_expires_at', 'created_at')
    list_filter   = ('category', 'is_verified', 'plan_type')
    search_fields = ('brand_name', 'owner__email', 'city')
    ordering      = ('-created_at',)
    list_editable = ('is_verified', 'plan_type', 'plan_expires_at')

    def owner_email(self, obj):
        return obj.owner.email if obj.owner else '—'
    owner_email.short_description = 'Владелец'


# ── Product ───────────────────────────────────────────────────────────────────
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display  = ('name', 'business', 'price', 'currency', 'created_at')
    list_filter   = ('currency',)
    search_fields = ('name', 'business__brand_name')
    ordering      = ('-created_at',)


# ── Story ─────────────────────────────────────────────────────────────────────
@admin.register(Story)
class StoryAdmin(admin.ModelAdmin):
    list_display  = ('author', 'media_type', 'is_active', 'expires_at', 'views_count', 'created_at')
    list_filter   = ('media_type',)
    search_fields = ('author__username', 'author__email')
    ordering      = ('-created_at',)
    readonly_fields = ('views_count',)

    def is_active(self, obj):
        active = obj.is_active
        color = 'green' if active else 'red'
        label = 'Активна' if active else 'Истекла'
        return format_html('<span style="color:{}">{}</span>', color, label)
    is_active.short_description = 'Статус'


# ── Post ──────────────────────────────────────────────────────────────────────
@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display  = ('business', 'media_type', 'short_text', 'views_count', 'created_at')
    list_filter   = ('media_type',)
    search_fields = ('business__brand_name', 'text')
    ordering      = ('-created_at',)

    def short_text(self, obj):
        return obj.text[:60] + '...' if len(obj.text) > 60 else obj.text
    short_text.short_description = 'Текст'


# ── ProductInquiry ────────────────────────────────────────────────────────────
@admin.register(ProductInquiry)
class ProductInquiryAdmin(admin.ModelAdmin):
    list_display  = ('sender', 'product', 'short_message', 'is_read', 'created_at')
    list_filter   = ('is_read',)
    search_fields = ('sender__email', 'product__name')
    ordering      = ('-created_at',)
    list_editable = ('is_read',)

    def short_message(self, obj):
        return obj.message[:60] + '...' if len(obj.message) > 60 else obj.message
    short_message.short_description = 'Сообщение'


# ── Comment ───────────────────────────────────────────────────────────────────
@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display  = ('author', 'story', 'short_text', 'created_at')
    search_fields = ('author__username', 'text')
    ordering      = ('-created_at',)

    def short_text(self, obj):
        return obj.text[:60] + '...' if len(obj.text) > 60 else obj.text
    short_text.short_description = 'Комментарий'


# ── VerificationRequest ───────────────────────────────────────────────────────
@admin.register(VerificationRequest)
class VerificationRequestAdmin(admin.ModelAdmin):
    list_display  = ('business', 'status', 'created_at')
    list_filter   = ('status',)
    search_fields = ('business__brand_name',)
    ordering      = ('-created_at',)


@admin.register(ComplaintReason)
class ComplaintReasonAdmin(admin.ModelAdmin):
    list_display  = ('label', 'order', 'is_active', 'created_at')
    list_editable = ('order', 'is_active')
    ordering      = ('order', 'id')


@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display  = ('id', 'reason', 'status', 'reporter', 'post', 'business', 'created_at')
    list_filter   = ('status',)
    search_fields = ('reason', 'description', 'reporter__email')
    ordering      = ('-created_at',)


@admin.register(VerificationMessage)
class VerificationMessageAdmin(admin.ModelAdmin):
    list_display  = ('request', 'sender', 'short_text', 'created_at')
    search_fields = ('sender__email',)
    ordering      = ('-created_at',)

    def short_text(self, obj):
        return obj.text[:60] + '...' if len(obj.text) > 60 else obj.text
    short_text.short_description = 'Сообщение'


# ── Tag ──────────────────────────────────────────────────────────────────────
@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)


# ── Article ──────────────────────────────────────────────────────────────────
@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ('title', 'business', 'views_count', 'created_at')
    search_fields = ('title', 'business__brand_name')
    ordering = ('-created_at',)


# ── Review ───────────────────────────────────────────────────────────────────
@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('author', 'business', 'rating', 'created_at')
    list_filter = ('rating',)
    search_fields = ('author__email', 'business__brand_name')
    ordering = ('-created_at',)


# ── InquiryMessage ───────────────────────────────────────────────────────────
@admin.register(InquiryMessage)
class InquiryMessageAdmin(admin.ModelAdmin):
    list_display = ('inquiry', 'sender', 'short_text', 'created_at')
    search_fields = ('sender__email', 'text')
    ordering = ('-created_at',)

    def short_text(self, obj):
        return obj.text[:60] + '...' if len(obj.text) > 60 else obj.text
    short_text.short_description = 'Текст'


# ── Subscriptions / Favorites / Likes ────────────────────────────────────────
@admin.register(BusinessSubscription)
class BusinessSubscriptionAdmin(admin.ModelAdmin):
    list_display = ('user', 'business', 'created_at')
    search_fields = ('user__email', 'business__brand_name')


@admin.register(BusinessFavorite)
class BusinessFavoriteAdmin(admin.ModelAdmin):
    list_display = ('user', 'business', 'created_at')
    search_fields = ('user__email', 'business__brand_name')


@admin.register(PostFavorite)
class PostFavoriteAdmin(admin.ModelAdmin):
    list_display = ('user', 'post', 'created_at')
    search_fields = ('user__email',)


@admin.register(NewsFavorite)
class NewsFavoriteAdmin(admin.ModelAdmin):
    list_display = ('user', 'news', 'created_at')
    search_fields = ('user__email',)


@admin.register(ProductLike)
class ProductLikeAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'created_at')
    search_fields = ('user__email', 'product__name')


# ── Group Chat ───────────────────────────────────────────────────────────────
@admin.register(GroupChat)
class GroupChatAdmin(admin.ModelAdmin):
    list_display = ('name', 'business', 'created_at')
    search_fields = ('name', 'business__brand_name')
    ordering = ('-created_at',)


@admin.register(GroupMember)
class GroupMemberAdmin(admin.ModelAdmin):
    list_display = ('user', 'group', 'role', 'joined_at')
    list_filter = ('role',)
    search_fields = ('user__email', 'group__name')


@admin.register(GroupMessage)
class GroupMessageAdmin(admin.ModelAdmin):
    list_display = ('group', 'sender', 'short_text', 'created_at')
    search_fields = ('sender__email', 'text')
    ordering = ('-created_at',)

    def short_text(self, obj):
        return obj.text[:60] + '...' if len(obj.text) > 60 else obj.text
    short_text.short_description = 'Текст'


# ── Verification Document ────────────────────────────────────────────────────
@admin.register(VerificationDocument)
class VerificationDocumentAdmin(admin.ModelAdmin):
    list_display = ('request', 'uploaded_at')
    ordering = ('-uploaded_at',)


# ── Payment ──────────────────────────────────────────────────────────────────
@admin.register(PaymentRequest)
class PaymentRequestAdmin(admin.ModelAdmin):
    list_display = ('business', 'plan_type', 'status', 'created_at')
    list_filter = ('status', 'plan_type')
    search_fields = ('business__brand_name',)
    ordering = ('-created_at',)


# ── Notification ─────────────────────────────────────────────────────────────
@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('recipient', 'type', 'is_read', 'created_at')
    list_filter = ('type', 'is_read')
    search_fields = ('recipient__email',)
    ordering = ('-created_at',)


# ── Email Verification Code ──────────────────────────────────────────────────
@admin.register(EmailVerificationCode)
class EmailVerificationCodeAdmin(admin.ModelAdmin):
    list_display = ('email', 'created_at', 'is_used')
    search_fields = ('email',)
    ordering = ('-created_at',)


# ── Survey ───────────────────────────────────────────────────────────────────
@admin.register(Survey)
class SurveyAdmin(admin.ModelAdmin):
    list_display = ('question', 'survey_type', 'is_active', 'priority', 'created_at')
    list_filter = ('is_active', 'survey_type')
    search_fields = ('question',)
    ordering = ('-created_at',)


@admin.register(SurveyOption)
class SurveyOptionAdmin(admin.ModelAdmin):
    list_display = ('text', 'survey')
    search_fields = ('text', 'survey__question')


@admin.register(SurveyResponse)
class SurveyResponseAdmin(admin.ModelAdmin):
    list_display = ('user', 'survey', 'created_at')
    search_fields = ('user__email',)
    ordering = ('-created_at',)