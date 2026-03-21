from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from Shop.models import Post, Product, ProductInquiry, Business, InquiryMessage
from Shop.servicefunc.serializers.post_serializer import (
    PostSerializer, PostCreateSerializer,
    ProductInquiryCreateSerializer,
    InquiryMessageSerializer,
)


class PostListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        posts = Post.objects.select_related('business').all()[:50]
        serializer = PostSerializer(posts, many=True, context={'request': request})
        response = Response(serializer.data)
        response['Cache-Control'] = 'public, max-age=30'
        return response


class BusinessPostListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        posts = Post.objects.filter(business_id=pk).select_related('business')
        serializer = PostSerializer(posts, many=True, context={'request': request})
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
                .select_related('product__business', 'sender')
                .prefetch_related('messages')
                .order_by('-created_at')
            )
        else:
            inquiries = (
                ProductInquiry.objects
                .filter(sender=user)
                .select_related('product__business', 'sender')
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

            last_msg = inq.messages.last()

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

        messages = inq.messages.select_related('sender').all()
        return Response(InquiryMessageSerializer(messages, many=True).data)

    def post(self, request, pk):
        inq, _ = self._get_inquiry(pk, request.user)
        if inq is None:
            return Response({'detail': 'Не найдено или нет доступа'}, status=status.HTTP_404_NOT_FOUND)

        text = request.data.get('text', '').strip()
        if not text:
            return Response({'detail': 'Текст не может быть пустым'}, status=status.HTTP_400_BAD_REQUEST)

        msg = InquiryMessage.objects.create(inquiry=inq, sender=request.user, text=text)
        return Response(InquiryMessageSerializer(msg).data, status=status.HTTP_201_CREATED)
