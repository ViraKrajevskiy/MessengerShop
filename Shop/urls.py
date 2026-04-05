from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from Shop.servicefunc.views.auth.registration import RegisterView
from Shop.servicefunc.views.auth.login import LoginView
from Shop.servicefunc.views.auth.logout import LogoutView
from Shop.servicefunc.views.auth.verify_email import VerifyEmailView
from Shop.servicefunc.views.auth.me import MeView
from Shop.servicefunc.views.auth.password_reset import PasswordResetRequestView, PasswordResetConfirmView
from Shop.servicefunc.views.auth.qr_login import QRTokenView, QRLoginView
from Shop.servicefunc.views.auth.google_auth import GoogleAuthView
from Shop.servicefunc.views.moderator.auth import ModeratorLoginView
from Shop.servicefunc.views.moderator.posts import ModeratorPostListView, ModeratorPostBlockView
from Shop.servicefunc.views.moderator.complaints import ComplaintCreateView, ModeratorComplaintListView, ModeratorComplaintDetailView
from Shop.servicefunc.views.moderator.tariffs import ModeratorBusinessListView, ModeratorTariffAssignView
from Shop.servicefunc.views.moderator.content import (
    ModeratorStoryListView, ModeratorStoryBlockView,
    ModeratorCommentListView, ModeratorCommentBlockView,
    ModeratorProductListView, ModeratorProductBlockView,
    ModeratorReviewListView, ModeratorReviewBlockView,
)
from Shop.servicefunc.views.story.stories import StoryListCreateView, StoryDetailView, StoryViewersView
from Shop.servicefunc.views.story.comments import CommentListCreateView, CommentDetailView
from Shop.servicefunc.views.verification.verification import (
    MyVerificationView, UploadDocumentView, VerificationChatView,
    ModeratorVerificationListView, ModeratorVerificationDetailView,
    VerificationMessageEditView,
)
from Shop.servicefunc.views.business.business import (
    BusinessListView, BusinessCreateView, BusinessDetailView, MyBusinessView,
)
from Shop.servicefunc.views.business.subscribe import BusinessSubscribeView
from Shop.servicefunc.views.product.product import (
    AllProductsListView, BusinessProductListView, ProductDetailView, ProductLikeView,
    ProductSearchView, BusinessStatsView,
)
from Shop.servicefunc.views.post.post import (
    PostListView, BusinessPostListView, ProductInquiryView,
    InquiryListView, InquiryMessagesView, InquiryMessageActionView, PostFavoriteView, PostFavoritesListView,
)
from Shop.servicefunc.views.review.reviews import (
    BusinessReviewListCreateView, ProductReviewListCreateView,
)
from Shop.servicefunc.views.groups import (
    GroupListCreateView, GroupDetailView,
    GroupMembersView, GroupMemberDetailView,
    GroupMessagesView, GroupMessageActionView,
    GroupJoinView,
)
from Shop.servicefunc.views.news.newses import BusinessNewsListView, NewsListView, NewsCreateView, NewsDetailView
from Shop.servicefunc.views.tags import TagListView

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
    path('auth/google/',                 GoogleAuthView.as_view(),            name='google_auth'),

    path('businesses/',                  BusinessListView.as_view(),          name='business_list'),
    path('businesses/create/',           BusinessCreateView.as_view(),        name='business_create'),
    path('businesses/me/',               MyBusinessView.as_view(),            name='business_me'),
    path('businesses/<int:pk>/',         BusinessDetailView.as_view(),        name='business_detail'),

    path('businesses/<int:pk>/subscribe/', BusinessSubscribeView.as_view(),       name='business_subscribe'),
    path('businesses/<int:pk>/products/', BusinessProductListView.as_view(),      name='business_products'),
    path('businesses/<int:pk>/reviews/',  BusinessReviewListCreateView.as_view(), name='business_reviews'),
    path('businesses/<int:pk>/posts/',    BusinessPostListView.as_view(),         name='business_posts'),
    path('businesses/<int:pk>/news/',     BusinessNewsListView.as_view(),        name='business_news'),

    path('products/',                     AllProductsListView.as_view(),          name='all_products'),
    path('products/<int:pk>/reviews/',   ProductReviewListCreateView.as_view(),  name='product_reviews'),
    path('products/search/',             ProductSearchView.as_view(),            name='product_search'),
    path('products/<int:pk>/',           ProductDetailView.as_view(),            name='product_detail'),
    path('products/<int:pk>/like/',      ProductLikeView.as_view(),              name='product_like'),
    path('products/<int:pk>/inquiry/',   ProductInquiryView.as_view(),           name='product_inquiry'),

    path('businesses/me/stats/',         BusinessStatsView.as_view(),            name='business_stats'),

    path('inquiries/',                                InquiryListView.as_view(),          name='inquiry_list'),
    path('inquiries/<int:pk>/messages/',              InquiryMessagesView.as_view(),      name='inquiry_messages'),
    path('inquiries/<int:pk>/messages/<int:msg_pk>/', InquiryMessageActionView.as_view(), name='inquiry_message_action'),

    path('posts/',                       PostListView.as_view(),              name='post_list'),

    path('stories/',                          StoryListCreateView.as_view(),   name='story_list_create'),
    path('stories/<int:pk>/',                 StoryDetailView.as_view(),       name='story_detail'),
    path('stories/<int:pk>/viewers/',         StoryViewersView.as_view(),      name='story_viewers'),
    path('stories/<int:story_pk>/comments/',  CommentListCreateView.as_view(), name='comment_list_create'),

    path('comments/<int:pk>/',           CommentDetailView.as_view(),         name='comment_detail'),

    path('verification/my/',                MyVerificationView.as_view(),              name='verification_my'),
    path('verification/upload/',            UploadDocumentView.as_view(),              name='verification_upload'),
    path('verification/chat/',              VerificationChatView.as_view(),            name='verification_chat'),
    path('verification/messages/<int:msg_id>/', VerificationMessageEditView.as_view(),  name='verification_msg_edit'),
    path('verification/',                   ModeratorVerificationListView.as_view(),   name='verification_list'),
    path('verification/<int:pk>/',          ModeratorVerificationDetailView.as_view(), name='verification_detail'),
    path('verification/<int:req_id>/chat/', VerificationChatView.as_view(),            name='verification_mod_chat'),

    path('groups/',                                    GroupListCreateView.as_view(),    name='group_list_create'),
    path('groups/<int:pk>/',                           GroupDetailView.as_view(),        name='group_detail'),
    path('groups/<int:pk>/members/',                   GroupMembersView.as_view(),       name='group_members'),
    path('groups/<int:pk>/members/<int:member_pk>/',   GroupMemberDetailView.as_view(),  name='group_member_detail'),
    path('groups/<int:pk>/messages/',                  GroupMessagesView.as_view(),      name='group_messages'),
    path('groups/<int:pk>/messages/<int:msg_pk>/',     GroupMessageActionView.as_view(), name='group_message_action'),
    path('groups/<int:pk>/join/',                      GroupJoinView.as_view(),          name='group_join'),

    path('news/',             NewsListView.as_view(),   name='news_list'),
    path('news/create/',      NewsCreateView.as_view(), name='news_create'),
    path('news/<int:pk>/',    NewsDetailView.as_view(), name='news_detail'),

    path('posts/favorites/',           PostFavoritesListView.as_view(), name='post_favorites'),
    path('posts/<int:pk>/favorite/',   PostFavoriteView.as_view(),      name='post_favorite'),

    path('tags/',                      TagListView.as_view(),           name='tag_list'),

    # ── Complaints (any authenticated user) ──────────────────────────────────
    path('complaints/',                ComplaintCreateView.as_view(),              name='complaint_create'),

    # ── Moderator panel ──────────────────────────────────────────────────────
    path('moderator/login/',           ModeratorLoginView.as_view(),               name='moderator_login'),
    path('moderator/posts/',           ModeratorPostListView.as_view(),            name='moderator_post_list'),
    path('moderator/posts/<int:pk>/block/', ModeratorPostBlockView.as_view(),      name='moderator_post_block'),
    path('moderator/complaints/',      ModeratorComplaintListView.as_view(),       name='moderator_complaint_list'),
    path('moderator/complaints/<int:pk>/', ModeratorComplaintDetailView.as_view(), name='moderator_complaint_detail'),
    path('moderator/businesses/',      ModeratorBusinessListView.as_view(),        name='moderator_business_list'),
    path('moderator/businesses/<int:pk>/tariff/', ModeratorTariffAssignView.as_view(), name='moderator_tariff_assign'),

    path('moderator/stories/',                      ModeratorStoryListView.as_view(),    name='moderator_story_list'),
    path('moderator/stories/<int:pk>/block/',        ModeratorStoryBlockView.as_view(),   name='moderator_story_block'),
    path('moderator/comments/',                     ModeratorCommentListView.as_view(),  name='moderator_comment_list'),
    path('moderator/comments/<int:pk>/block/',       ModeratorCommentBlockView.as_view(), name='moderator_comment_block'),
    path('moderator/products/',                     ModeratorProductListView.as_view(),  name='moderator_product_list'),
    path('moderator/products/<int:pk>/block/',       ModeratorProductBlockView.as_view(), name='moderator_product_block'),
    path('moderator/reviews/',                      ModeratorReviewListView.as_view(),   name='moderator_review_list'),
    path('moderator/reviews/<int:pk>/block/',        ModeratorReviewBlockView.as_view(),  name='moderator_review_block'),
]