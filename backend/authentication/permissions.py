"""
authentication/permissions.py
AMECO — Role-based permission classes.
"""

from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Grants access only to users with role='admin'."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'admin')


class IsGuard(BasePermission):
    """Grants access only to users with role='guard'."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'guard')


class IsAdminOrGuard(BasePermission):
    """Grants access to both admins and guards."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ('admin', 'guard'))