"""
visitors/views.py
AMECO — Visitor CRUD + VisitorRequest approve/deny with WebSocket notifications.
"""

from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from authentication.permissions import IsAdmin, IsGuard, IsAdminOrGuard
from .models import Visitor, VisitorRequest
from .serializers import VisitorSerializer, VisitorRequestSerializer


class VisitorViewSet(viewsets.ModelViewSet):
    serializer_class = VisitorSerializer
    permission_classes = [IsAdminOrGuard]

    def get_queryset(self):
        user = self.request.user
        qs = Visitor.objects.all().order_by('-registered_at')
        if user.role == 'guard':
            qs = qs.filter(registered_by=user.username)
        return qs

    def perform_create(self, serializer):
        serializer.save(registered_by=self.request.user.username)


class VisitorRequestViewSet(viewsets.ModelViewSet):
    serializer_class = VisitorRequestSerializer
    permission_classes = [IsAdminOrGuard]

    def get_queryset(self):
        user = self.request.user
        qs = VisitorRequest.objects.select_related('temp_user').all()
        if user.role == 'guard':
            qs = qs.filter(guard_username=user.username)
        return qs

    def perform_create(self, serializer):
        instance = serializer.save(
            guard_username=self.request.user.username,
            status='PENDING',
        )
        # Notify all admins via WebSocket
        self._notify_admins(instance)

    def _notify_admins(self, request_instance):
        try:
            from notifications.broadcast import broadcast_to_role
            broadcast_to_role('admin', {
                'type': 'new_visitor_request',
                'request_id': request_instance.id,
                'visitor_name': request_instance.temp_user.full_name(),
                'guard': request_instance.guard_username,
                'reason': request_instance.reason,
            })
        except Exception:
            pass

    @action(detail=True, methods=['patch'], permission_classes=[IsAdmin])
    def update_status(self, request, pk=None):
        req = self.get_object()
        new_status = request.data.get('status', '').upper()

        if new_status not in ('APPROVED', 'REJECTED'):
            return Response({'detail': 'status must be APPROVED or REJECTED.'}, status=400)

        req.status = new_status
        req.responded_at = timezone.now()
        if new_status == 'REJECTED':
            req.denial_reason = request.data.get('denial_reason', '')
        req.save()

        # Notify the guard
        try:
            from notifications.broadcast import broadcast_to_user
            broadcast_to_user(req.guard_username, {
                'type': 'request_decision',
                'request_id': req.id,
                'status': new_status,
                'visitor_name': req.temp_user.full_name(),
                'denial_reason': req.denial_reason,
            })
        except Exception:
            pass

        return Response(VisitorRequestSerializer(req, context={'request': request}).data)