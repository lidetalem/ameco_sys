"""
authentication/views.py
AMECO — Login, logout, token refresh views.
"""

from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .serializers import LoginSerializer
from logs.utils import create_log


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token

        # Store login time in token for session duration calc on logout
        request.session['login_time'] = timezone.now().isoformat()

        profile_image_url = None
        if hasattr(user, 'profile_image') and user.profile_image:
            profile_image_url = request.build_absolute_uri(user.profile_image.url)

        # Build full name from related profile
        full_name = user.display_name
        try:
            if user.role == 'admin' and hasattr(user, 'adminprofile'):
                p = user.adminprofile
                full_name = f'{p.first_name} {p.middle_name} {p.last_name}'.strip()
                profile_image_url = request.build_absolute_uri(p.profile_image.url) if p.profile_image else profile_image_url
            elif user.role == 'guard' and hasattr(user, 'guardprofile'):
                p = user.guardprofile
                full_name = f'{p.first_name} {p.middle_name} {p.last_name}'.strip()
                profile_image_url = request.build_absolute_uri(p.profile_image.url) if p.profile_image else profile_image_url
        except Exception:
            pass

        create_log(
            actor=user,
            action_type='LOGIN',
            description=f'{user.username} logged in.',
        )

        return Response({
            'access': str(access),
            'refresh': str(refresh),
            'role': user.role,
            'user_id': user.id,
            'username': user.username,
            'full_name': full_name,
            'profile_image_url': profile_image_url,
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'detail': 'Refresh token required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        create_log(
            actor=request.user,
            action_type='LOGOUT',
            description=f'{request.user.username} logged out.',
        )

        return Response({'detail': 'Logged out successfully.'}, status=status.HTTP_200_OK)


class MeView(APIView):
    """Return the logged-in user's profile info."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        full_name = user.display_name
        profile_image_url = None

        try:
            if user.role == 'admin' and hasattr(user, 'adminprofile'):
                p = user.adminprofile
                full_name = f'{p.first_name} {p.middle_name} {p.last_name}'.strip()
                profile_image_url = request.build_absolute_uri(p.profile_image.url) if p.profile_image else None
            elif user.role == 'guard' and hasattr(user, 'guardprofile'):
                p = user.guardprofile
                full_name = f'{p.first_name} {p.middle_name} {p.last_name}'.strip()
                profile_image_url = request.build_absolute_uri(p.profile_image.url) if p.profile_image else None
        except Exception:
            pass

        return Response({
            'user_id': user.id,
            'username': user.username,
            'role': user.role,
            'full_name': full_name,
            'profile_image_url': profile_image_url,
        })