from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Count, Exists, OuterRef

from Shop.models import Post, Product, ProductInquiry, Business, InquiryMessage
from Shop.models.models import PostFavorite, BusinessSubscription
from Shop.servicefunc.serializers.post_serializer import (
    PostSerializer, PostCreateSerializer,
    ProductInquiryCreateSerializer,
    InquiryMessageSerializer,
)


class PostListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Post.objects.select_related('business__owner').prefetch_related('tags').annotate(
            _favorites_count=Count('favorites', distinct=True),
        )

        if request.user.is_authenticated:
            qs = qs.annotate(
                _is_favorited=Exists(
                    PostFavorite.objects.filter(post=OuterRef('pk'), user=request.user)
                ),
                _is_subscribed=Exists(
                    BusinessSubscription.objects.filter(
                        business=OuterRef('business'), user=request.user
                    )
                ),
            )

        posts = qs.order_by('-created_at')[:50]
        serializer = PostSerializer(posts, many=True, context={'request': request})
        response = Response(serializer.data)
        response['Cache-Control'] = 'public, max-age=60'
        return response


class BusinessPostListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        qs = Post.objects.filter(business_id=pk).select_related(
            'business__owner'
        ).prefetch_related('tags').annotate(
            _favorites_count=Count('favorites', distinct=True),
        )
        if request.user.is_authenticated:
            qs = qs.annotate(
                _is_favorited=Exists(
                    PostFavorite.objects.filter(post=OuterRef('pk'), user=request.user)
                ),
                _is_subscribed=Exists(
                    BusinessSubscription.objects.filter(
                        business=OuterRef('business'), user=request.user
                    )
                ),
            )
        serializer = PostSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, pk):
        if not request.user.is_authenticated:
            return Response({'detail': 'Требуется авторизация'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            business = Business.objects.get(pk=pk, owner=request.user)
        except Business.DoesNotExist:
            return Response({'detail': 'Бизнес не найден или нет доступа'}, status=status.HTTP_403_FORBIDDEN)

        serializer = PostCreateSerializer(data=request.data)
        if serializer.is_valid():
            post = serializer.save(business=business)
            return Response(PostSerializer(post, context={'request': request}).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProductInquiryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            product = Product.objects.select_related('business').get(pk=pk)
        except Product.DoesNotExist:
            return Response({'detail': 'Товар не найден'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ProductInquiryCreateSerializer(data=request.data)
        if serializer.is_valid():
            inquiry = serializer.save(product=product, sender=request.user)
            InquiryMessage.objects.create(
                inquiry=inquiry,
                sender=request.user,
                text=serializer.validated_data['message'],
            )
            return Response({'detail': 'Сообщение отправлено'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class InquiryListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if hasattr(user, 'business_profile'):
            inquiries = (
                ProductInquiry.objects
                .filter(product__business__owner=user)
                .select_related('product__business__owner', 'sender')
                .prefetch_related('messages')
                .order_by('-created_at')
            )
        else:
            inquiries = (
                ProductInquiry.objects
                .filter(sender=user)
                .select_related('product__business__owner', 'sender')
                .prefetch_related('messages')
                .order_by('-created_at')
            )

        is_business = hasattr(user, 'business_profile')
        data = []
        for inq in inquiries:
            biz = inq.product.business
            logo = None
            if is_business:
                logo = inq.sender.avatar.url if inq.sender.avatar else None
            else:
                logo = biz.logo.url if biz.logo else None

            # Use prefetched messages cache instead of .last() query
            msgs = list(inq.messages.all())
            last_msg = msgs[-1] if msgs else None

            # Определяем онлайн-статус собеседника
            other_user = inq.sender if is_business else biz.owner
            other_online = other_user.is_online if other_user else False

            data.append({
                'id':           inq.id,
                'product_id':   inq.product.id,
                'product_name': inq.product.name,
                'biz_id':       biz.id,
                'biz_name':     biz.brand_name,
                'sender_id':    inq.sender.id,
                'sender_name':  inq.sender.username,
                'message':      last_msg.text if last_msg else inq.message,
                'last_sender_id': last_msg.sender_id if last_msg else inq.sender_id,
                'is_read':      inq.is_read,
                'is_online':    other_online,
                'created_at':   inq.created_at.isoformat(),
                'logo':         request.build_absolute_uri(logo) if logo else None,
            })

        return Response(data)


class InquiryMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_inquiry(self, pk, user):
        try:
            inq = ProductInquiry.objects.select_related(
                'product__business__owner', 'sender'
            ).get(pk=pk)
        except ProductInquiry.DoesNotExist:
            return None, None
        is_business = hasattr(user, 'business_profile')
        if is_business and inq.product.business.owner != user:
            return None, None
        if not is_business and inq.sender != user:
            return None, None
        return inq, is_business

    def get(self, request, pk):
        inq, is_business = self._get_inquiry(pk, request.user)
        if inq is None:
            return Response({'detail': 'Не найдено или нет доступа'}, status=status.HTTP_404_NOT_FOUND)

        if is_business and not inq.is_read:
            ProductInquiry.objects.filter(pk=pk).update(is_read=True)

        messages = inq.messages.select_related('sender').filter(is_deleted=False)
        return Response(InquiryMessageSerializer(messages, many=True, context={'request': request}).data)

    def post(self, request, pk):
        inq, _ = self._get_inquiry(pk, request.user)
        if inq is None:
            return Response({'detail': 'Не найдено или нет доступа'}, status=status.HTTP_404_NOT_FOUND)

        text = request.data.get('text', '').strip()
        if not text:
            return Response({'detail': 'Текст не может быть пустым'}, status=status.HTTP_400_BAD_REQUEST)

        msg = InquiryMessage.objects.create(inquiry=inq, sender=request.user, text=text)
        return Response(InquiryMessageSerializer(msg, context={'request': request}).data, status=status.HTTP_201_CREATED)


class InquiryMessageActionView(APIView):
    """PATCH — редактировать, DELETE — удалить сообщение в чате."""
    permission_classes = [IsAuthenticated]

    def _get_message(self, pk, msg_pk, user):
        try:
            inq = ProductInquiry.objects.select_related('product__business__owner', 'sender').get(pk=pk)
        except ProductInquiry.DoesNotExist:
            return None, None
        is_business = hasattr(user, 'business_profile')
        if is_business and inq.product.business.owner != user:
            return None, None
        if not is_business and inq.sender != user:
            return None, None
        try:
            msg = inq.messages.select_related('sender').get(pk=msg_pk)
        except InquiryMessage.DoesNotExist:
            return None, None
        return inq, msg

    def patch(self, request, pk, msg_pk):
        """Редактировать своё сообщение."""
        _, msg = self._get_message(pk, msg_pk, request.user)
        if msg is None:
            return Response({'detail': 'Не найдено'}, status=status.HTTP_404_NOT_FOUND)
        if msg.sender != request.user:
            return Response({'detail': 'Можно редактировать только свои сообщения'}, status=status.HTTP_403_FORBIDDEN)
        text = request.data.get('text', '').strip()
        if not text:
            return Response({'detail': 'Текст обязателен'}, status=status.HTTP_400_BAD_REQUEST)
        msg.text = text
        msg.is_edited = True
        msg.save(update_fields=['text', 'is_edited'])
        return Response(InquiryMessageSerializer(msg, context={'request': request}).data)

    def delete(self, request, pk, msg_pk):
        """Удалить своё сообщение."""
        _, msg = self._get_message(pk, msg_pk, request.user)
        if msg is None:
            return Response({'detail': 'Не найдено'}, status=status.HTTP_404_NOT_FOUND)
        if msg.sender != request.user:
            return Response({'detail': 'Можно удалять только свои сообщения'}, status=status.HTTP_403_FORBIDDEN)
        msg.is_deleted = True
        msg.save(update_fields=['is_deleted'])
        return Response(status=status.HTTP_204_NO_CONTENT)


class PostFavoriteView(APIView):
    """
    POST /api/posts/<pk>/favorite/ — добавить/убрать из избранного
    GET  /api/posts/favorites/     — мои избранные посты
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            post = Post.objects.get(pk=pk)
        except Post.DoesNotExist:
            return Response({'detail': 'Пост не найден'}, status=status.HTTP_404_NOT_FOUND)

        fav, created = PostFavorite.objects.get_or_create(user=request.user, post=post)
        if not created:
            fav.delete()
            return Response({'favorited': False, 'favorites_count': post.favorites.count()})
        return Response({'favorited': True, 'favorites_count': post.favorites.count()}, status=status.HTTP_201_CREATED)


class PostFavoritesListView(APIView):
    """GET /api/posts/favorites/ — список избранных постов текущего пользователя"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        posts = Post.objects.filter(
            favorites__user=request.user
        ).select_related('business__owner').prefetch_related('tags').annotate(
            _favorites_count=Count('favorites', distinct=True),
            _is_favorited=Exists(
                PostFavorite.objects.filter(post=OuterRef('pk'), user=request.user)
            ),
            _is_subscribed=Exists(
                BusinessSubscription.objects.filter(
                    business=OuterRef('business'), user=request.user
                )
            ),
        ).order_by('-favorites__created_at')
        return Response(PostSerializer(posts, many=True, context={'request': request}).data)