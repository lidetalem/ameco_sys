"""
cameras/views.py
AMECO — Camera CRUD + power/status toggles with WebSocket broadcast.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from authentication.permissions import IsAdmin, IsAdminOrGuard
from .models import GateWithCamera
from .serializers import GateWithCameraSerializer
from notifications.broadcast import broadcast_camera_update


class GateWithCameraViewSet(viewsets.ModelViewSet):
    queryset = GateWithCamera.objects.all().order_by('-created_at')
    serializer_class = GateWithCameraSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAdminOrGuard()]
        return [IsAdmin()]

    def perform_destroy(self, instance):
        instance.delete()
        broadcast_camera_update({'type': 'camera_deleted'})

    @action(detail=True, methods=['patch'], permission_classes=[IsAdmin])
    def toggle_power(self, request, pk=None):
        camera = self.get_object()
        camera.power = 'off' if camera.power == 'on' else 'on'
        camera.save()
        broadcast_camera_update({
            'type': 'camera_power',
            'camera_id': camera.id,
            'power': camera.power,
        })
        return Response(GateWithCameraSerializer(camera).data)

    @action(detail=True, methods=['patch'], permission_classes=[IsAdmin])
    def toggle_status(self, request, pk=None):
        camera = self.get_object()
        camera.status = 'maintenance' if camera.status == 'active' else 'active'
        camera.save()
        broadcast_camera_update({
            'type': 'camera_status',
            'camera_id': camera.id,
            'status': camera.status,
        })
        return Response(GateWithCameraSerializer(camera).data)