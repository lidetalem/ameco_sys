"""
authentication/serializers.py
AMECO — Login serializer and token response.
"""

from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, data):
        username = data.get('username', '').strip()
        password = data.get('password', '')

        if not username or not password:
            raise serializers.ValidationError('Username and password are required.')

        user = authenticate(username=username, password=password)
        if not user:
            raise serializers.ValidationError('Invalid credentials.')
        if not user.is_active:
            raise serializers.ValidationError('Account is disabled.')

        data['user'] = user
        return data