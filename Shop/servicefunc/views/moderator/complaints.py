from django.utils import timezone
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from Shop.models import Complaint, Post, Business
from Shop.servicefunc.views.verification.verification import IsModerator


class ComplaintCreateView(APIView):
    """
    POST /api/complaints/
    Any authenticated user can file a complaint.
    Body: { post_id?, business_id?, reason, description }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        post_id     = request.data.get('post_id')
        business_id = request.data.get('business_id')
        reason      = request.data.get('reason', 'OTHER')
        description = request.data.get('description', '')

        if not post_id and not business_id:
            return Response({'detail': 'Укажите post_id или business_id.'}, status=400)

        post     = None
        business = None

        if post_id:
            try:
                post = Post.objects.get(pk=post_id)
            except Post.DoesNotExist:
                return Response({'detail': 'Пост не найден.'}, status=404)

        if business_id:
            try:
                business = Business.objects.get(pk=business_id)
            except Business.DoesNotExist:
                return Response({'detail': 'Бизнес не найден.'}, status=404)

        valid_reasons = [r.value for r in Complaint.Reason]
        if reason not in valid_reasons:
            reason = 'OTHER'

        complaint = Complaint.objects.create(
            reporter=request.user,
            post=post,
            business=business,
            reason=reason,
            description=description,
        )
        return Response({'id': complaint.id, 'status': complaint.status}, status=201)


class ModeratorComplaintListView(APIView):
    """
    GET /api/moderator/complaints/
    Query params: ?status=PENDING|RESOLVED|REJECTED
    """
    permission_classes = [IsAuthenticated, IsModerator]

    def get(self, request):
        qs = Complaint.objects.select_related(
            'reporter', 'post', 'post__business', 'business', 'resolved_by'
        ).order_by('-created_at')

        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter.upper())

        data = []
        for c in qs:
            data.append({
                'id':          c.id,
                'reason':      c.reason,
                'description': c.description,
                'status':      c.status,
                'created_at':  c.created_at,
                'resolved_at': c.resolved_at,
                'resolution_note': c.resolution_note,
                'reporter': {
                    'id':    c.reporter.id,
                    'email': c.reporter.email,
                    'username': c.reporter.username,
                },
                'post': {
                    'id':   c.post.id,
                    'text': c.post.text[:100],
                    'business_name': c.post.business.brand_name,
                } if c.post else None,
                'business': {
                    'id':         c.business.id,
                    'brand_name': c.business.brand_name,
                } if c.business else None,
                'resolved_by': c.resolved_by.email if c.resolved_by else None,
            })

        return Response(data)


class ModeratorComplaintDetailView(APIView):
    """
    PATCH /api/moderator/complaints/<pk>/
    Body: { status: RESOLVED|REJECTED, resolution_note? }
    """
    permission_classes = [IsAuthenticated, IsModerator]

    def patch(self, request, pk):
        try:
            complaint = Complaint.objects.get(pk=pk)
        except Complaint.DoesNotExist:
            return Response({'detail': 'Жалоба не найдена.'}, status=404)

        new_status = request.data.get('status', '').upper()
        if new_status not in ('RESOLVED', 'REJECTED'):
            return Response({'detail': 'Статус должен быть RESOLVED или REJECTED.'}, status=400)

        complaint.status          = new_status
        complaint.resolved_by     = request.user
        complaint.resolved_at     = timezone.now()
        complaint.resolution_note = request.data.get('resolution_note', '')
        complaint.save(update_fields=['status', 'resolved_by', 'resolved_at', 'resolution_note'])

        return Response({'id': complaint.id, 'status': complaint.status})
