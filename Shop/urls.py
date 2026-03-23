from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from Shop.servicefunc.views.auth.registration import RegisterView
from Shop.servicefunc.views.auth.login import LoginView
from Shop.servicefunc.views.auth.logout import LogoutView
from Shop.servicefunc.views.auth.verify_email import VerifyEmailView
from Shop.servicefunc.views.auth.me import MeView
from Shop.servicefunc.views.auth.password_reset import PasswordResetRequestView, PasswordResetConfirmView
from Shop.servicefunc.views.auth.qr_login import QRTokenView, QRLoginView
from Shop.servicefunc.views.story.stories import StoryListCreateView, StoryDetailView, StoryViewersView
from Shop.servicefunc.views.story.comments import CommentListCreateView, CommentDetailView
from Shop.servicefunc.views.verification.verification import (
    MyVerificationView, UploadDocumentView, VerificationChatView,
    ModeratorVerificationListView, ModeratorVerificationDetailView,
)
from Shop.servicefunc.views.business.business import (
    BusinessListView, BusinessCreateView, BusinessDetailView, MyBusinessView,
)
from Shop.servicefunc.views.business.subscribe import BusinessSubscribeView
from Shop.servicefunc.views.product.product import BusinessProductListView, ProductDetailView, ProductLikeView, ProductSearchView, BusinessStatsView
from Shop.servicefunc.views.post.post import PostListView, BusinessPostListView, ProductInquiryView, InquiryListView, InquiryMessagesView, InquiryMessageActionView
from Shop.servicefunc.views.review.reviews import BusinessReviewListCreateView, ProductReviewListCreateView
from Shop.servicefunc.views.groups import (
    GroupListCreateView, GroupDetailView,
    GroupMembersView, GroupMemberDetailView,
    GroupMessagesView, GroupMessageActionView,
    GroupJoinView,
)

urlpatterns = [
    path('auth/register/',               RegisterView.as_view(),              name='auth_register'),
    path('auth/verify-email/',           VerifyEmailView.as_view(),           name='auth_verify_email'),
    path('auth/login/',                  LoginView.as_view(),                 name='auth_login'),
    path('auth/logout/',                 LogoutView.as_view(),                name='auth_logout'),
    path('auth/me/',                     MeView.as_view(),                    name='auth_me'),
    path('auth/token/refresh/',          TokenRefreshView.as_view(),          name='token_refresh'),
    path('auth/password-reset/',         PasswordResetRequestView.as_view(),  name='password_reset'),
    path('auth/password-reset/confirm/', PasswordResetConfirmView.as_view(),  name='password_reset_confirm'),
    path('auth/qr-token/',               QRTokenView.as_view(),               name='qr_token'),
    path('auth/qr-login/',               QRLoginView.as_view(),               name='qr_login'),

    path('businesses/',                  BusinessListView.as_view(),          name='business_list'),
    path('businesses/create/',           BusinessCreateView.as_view(),        name='business_create'),
    path('businesses/me/',               MyBusinessView.as_view(),            name='business_me'),
    path('businesses/<int:pk>/',         BusinessDetailView.as_view(),        name='business_detail'),

    path('businesses/<int:pk>/subscribe/', BusinessSubscribeView.as_view(),   name='business_subscribe'),
    path('businesses/<int:pk>/products/', BusinessProductListView.as_view(),  name='business_products'),
    path('businesses/<int:pk>/reviews/',  BusinessReviewListCreateView.as_view(), name='business_reviews'),
    path('products/<int:pk>/reviews/',    ProductReviewListCreateView.as_view(),  name='product_reviews'),
    path('products/search/',               ProductSearchView.as_view(),        name='product_search'),
    path('products/<int:pk>/',            ProductDetailView.as_view(),        name='product_detail'),
    path('products/<int:pk>/like/',       ProductLikeView.as_view(),          name='product_like'),
    path('products/<int:pk>/inquiry/',    ProductInquiryView.as_view(),       name='product_inquiry'),
    path('businesses/me/stats/',          BusinessStatsView.as_view(),        name='business_stats'),
    path('inquiries/',                    InquiryListView.as_view(),          name='inquiry_list'),
    path('inquiries/<int:pk>/messages/',              InquiryMessagesView.as_view(),      name='inquiry_messages'),
    path('inquiries/<int:pk>/messages/<int:msg_pk>/', InquiryMessageActionView.as_view(), name='inquiry_message_action'),

    path('posts/',                        PostListView.as_view(),             name='post_list'),
    path('businesses/<int:pk>/posts/',    BusinessPostListView.as_view(),     name='business_posts'),

    path('stories/',                        StoryListCreateView.as_view(),    name='story_list_create'),
    path('stories/<int:pk>/',               StoryDetailView.as_view(),        name='story_detail'),
    path('stories/<int:pk>/viewers/',       StoryViewersView.as_view(),       name='story_viewers'),
    path('stories/<int:story_pk>/comments/', CommentListCreateView.as_view(), name='comment_list_create'),

    path('comments/<int:pk>/',              CommentDetailView.as_view(),      name='comment_detail'),

    path('verification/my/',             MyVerificationView.as_view(),        name='verification_my'),
    path('verification/upload/',         UploadDocumentView.as_view(),        name='verification_upload'),
    path('verification/chat/',           VerificationChatView.as_view(),      name='verification_chat'),
    path('verification/',                ModeratorVerificationListView.as_view(),   name='verification_list'),
    path('verification/<int:pk>/',       ModeratorVerificationDetailView.as_view(), name='verification_detail'),
    path('verification/<int:req_id>/chat/', VerificationChatView.as_view(),   name='verification_mod_chat'),

    path('groups/',                                    GroupListCreateView.as_view(),    name='group_list_create'),
    path('groups/<int:pk>/',                           GroupDetailView.as_view(),        name='group_detail'),
    path('groups/<int:pk>/members/',                   GroupMembersView.as_view(),       name='group_members'),
    path('groups/<int:pk>/members/<int:member_pk>/',   GroupMemberDetailView.as_view(),  name='group_member_detail'),
    path('groups/<int:pk>/messages/',                  GroupMessagesView.as_view(),      name='group_messages'),
    path('groups/<int:pk>/messages/<int:msg_pk>/',     GroupMessageActionView.as_view(), name='group_message_action'),
    path('groups/<int:pk>/join/',                      GroupJoinView.as_view(),          name='group_join'),
]
