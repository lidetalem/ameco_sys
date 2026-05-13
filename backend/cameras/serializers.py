"""
cameras/serializers.py
"""
from rest_framework import serializers
from .models import GateWithCamera


class GateWithCameraSerializer(serializers.ModelSerializer):
    class Meta:
        model = GateWithCamera
        fields = '__all__'