from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from Shop.servicefunc.views.auth.registration import RegisterView
from Shop.servicefunc.views.auth.login import LoginView
from Shop.servicefunc.views.auth.logout import LogoutView
from Shop.servicefunc.views.auth.verify_email import VerifyEmailView
from Shop.servicefunc.views.auth.me import MeView
from Shop.servicefunc.views.story.stories import StoryListCreateView, StoryDetailView, StoryViewersView
from Shop.servicefunc.views.story.comments import CommentListCreateView, CommentDetailView
from Shop.servicefunc.views.verification.verification import (
    MyVerificationView, UploadDocumentView, VerificationChatView,
    ModeratorVerificationListView, ModeratorVerificationDetailView,
)
from Shop.servicefunc.views.business.business import (
    BusinessListView, BusinessCreateView, BusinessDetailView, MyBusinessView,
)
from Shop.servicefunc.views.product.product import BusinessProductListView, ProductDetailView
from Shop.servicefunc.views.post.post import PostListView, BusinessPostListView, ProductInquiryView

urlpatterns = [
    # ── Auth ──────────────────────────────────────────────────────────────────
    path('auth/register/',       RegisterView.as_view(),    name='auth_register'),
    path('auth/verify-email/',   VerifyEmailView.as_view(), name='auth_verify_email'),
    path('auth/login/',          LoginView.as_view(),       name='auth_login'),
    path('auth/logout/',         LogoutView.as_view(),      name='auth_logout'),
    path('auth/me/',             MeView.as_view(),          name='auth_me'),
    path('auth/token/refresh/',  TokenRefreshView.as_view(),name='token_refresh'),

    # ── Business ──────────────────────────────────────────────────────────────
    # GET  /api/businesses/         — список (публично, с фильтрами)
    # POST /api/businesses/create/  — создать (только BUSINESS)
    # GET/PATCH/DELETE /api/businesses/<pk>/
    # GET /api/businesses/me/       — мой профиль
    path('businesses/',           BusinessListView.as_view(),   name='business_list'),
    path('businesses/create/',    BusinessCreateView.as_view(), name='business_create'),
    path('businesses/me/',        MyBusinessView.as_view(),     name='business_me'),
    path('businesses/<int:pk>/',  BusinessDetailView.as_view(), name='business_detail'),

    # ── Products ──────────────────────────────────────────────────────────────
    # GET  /api/businesses/<pk>/products/ — список товаров бизнеса
    # POST /api/businesses/<pk>/products/ — создать товар (владелец)
    # GET/PATCH/DELETE /api/products/<pk>/
    path('businesses/<int:pk>/products/', BusinessProductListView.as_view(), name='business_products'),
    path('products/<int:pk>/',            ProductDetailView.as_view(),        name='product_detail'),
    path('products/<int:pk>/inquiry/',    ProductInquiryView.as_view(),       name='product_inquiry'),

    # ── Posts ─────────────────────────────────────────────────────────────────
    # GET  /api/posts/                    — лента всех постов
    # GET  /api/businesses/<pk>/posts/    — посты бизнеса
    # POST /api/businesses/<pk>/posts/    — создать пост (владелец)
    path('posts/',                        PostListView.as_view(),             name='post_list'),
    path('businesses/<int:pk>/posts/',    BusinessPostListView.as_view(),     name='business_posts'),

    # ── Stories ───────────────────────────────────────────────────────────────
    path('stories/',                        StoryListCreateView.as_view(), name='story_list_create'),
    path('stories/<int:pk>/',               StoryDetailView.as_view(),     name='story_detail'),
    path('stories/<int:pk>/viewers/',       StoryViewersView.as_view(),    name='story_viewers'),
    path('stories/<int:story_pk>/comments/',CommentListCreateView.as_view(),name='comment_list_create'),

    # ── Comments ──────────────────────────────────────────────────────────────
    path('comments/<int:pk>/',              CommentDetailView.as_view(),   name='comment_detail'),

    # ── Verification (бизнесмен) ──────────────────────────────────────────────
    # GET  /api/verification/my/         — статус моей заявки
    # POST /api/verification/my/         — создать заявку
    # POST /api/verification/upload/     — загрузить документ
    # POST /api/verification/chat/       — написать сообщение (бизнесмен)
    path('verification/my/',             MyVerificationView.as_view(),      name='verification_my'),
    path('verification/upload/',         UploadDocumentView.as_view(),      name='verification_upload'),
    path('verification/chat/',           VerificationChatView.as_view(),    name='verification_chat'),

    # ── Verification (модератор) ──────────────────────────────────────────────
    # GET   /api/verification/           — список заявок
    # GET   /api/verification/<pk>/      — детали заявки + чат
    # PATCH /api/verification/<pk>/      — approve / reject
    # POST  /api/verification/<pk>/chat/ — ответ модератора в чате
    path('verification/',                ModeratorVerificationListView.as_view(),   name='verification_list'),
    path('verification/<int:pk>/',       ModeratorVerificationDetailView.as_view(), name='verification_detail'),
    path('verification/<int:req_id>/chat/', VerificationChatView.as_view(),         name='verification_mod_chat'),
]
