from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from authentication.permissions import IsAdmin
from .models import AdminProfile
from .serializers import AdminProfileSerializer


class AdminProfileViewSet(viewsets.ModelViewSet):
    queryset = AdminProfile.objects.all().order_by('-registered_at')
    serializer_class = AdminProfileSerializer
    permission_classes = [IsAdmin]