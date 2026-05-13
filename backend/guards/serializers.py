"""
guards/serializers.py
"""
import uuid
from rest_framework import serializers
from authentication.models import CustomUser
from .models import GuardProfile


class GuardProfileSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    role     = serializers.CharField(write_only=True, required=False)

    profile_image_base64  = serializers.CharField(write_only=True, required=False, allow_blank=True)
    face_scan_1_base64    = serializers.CharField(write_only=True, required=False, allow_blank=True)
    face_scan_2_base64    = serializers.CharField(write_only=True, required=False, allow_blank=True)
    face_scan_3_base64    = serializers.CharField(write_only=True, required=False, allow_blank=True)
    face_scan_4_base64    = serializers.CharField(write_only=True, required=False, allow_blank=True)
    face_scan_5_base64    = serializers.CharField(write_only=True, required=False, allow_blank=True)
    id_card_front_base64  = serializers.CharField(write_only=True, required=False, allow_blank=True)
    id_card_back_base64   = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = GuardProfile
        fields = '__all__'
        read_only_fields = ('digital_id', 'registered_at')

    def create(self, validated_data):
        from recognition.encoding import save_base64_image, compute_and_store_encodings
        from recognition.models import BiometricData
        from django.contrib.contenttypes.models import ContentType

        password = validated_data.pop('password', None)
        validated_data.pop('role', None)

        b64_fields = {k: validated_data.pop(k, '') for k in [
            'profile_image_base64', 'face_scan_1_base64', 'face_scan_2_base64',
            'face_scan_3_base64', 'face_scan_4_base64', 'face_scan_5_base64',
            'id_card_front_base64', 'id_card_back_base64',
        ]}

        validated_data['digital_id'] = f'GRD-{uuid.uuid4().hex[:8].upper()}'

        username = validated_data.get('username', '')
        if username and password:
            user = CustomUser.objects.create_user(
                username=username, password=password,
                email=validated_data.get('email', ''), role='guard'
            )
            validated_data['user'] = user

        profile = GuardProfile.objects.create(**validated_data)

        bio = BiometricData(
            content_type=ContentType.objects.get_for_model(profile),
            object_id=profile.id,
        )
        self._save_biometrics(bio, b64_fields)
        bio.save()
        compute_and_store_encodings(bio)

        return profile

    def _save_biometrics(self, bio, b64_fields):
        from recognition.encoding import save_base64_image
        mapping = [
            ('face_scan_1_base64', 'face_front'),
            ('face_scan_2_base64', 'face_left'),
            ('face_scan_3_base64', 'face_right'),
            ('face_scan_4_base64', 'face_down'),
            ('face_scan_5_base64', 'face_unusual'),
            ('id_card_front_base64', 'id_card_front'),
            ('id_card_back_base64', 'id_card_back'),
        ]
        for b64_key, field_name in mapping:
            if b64_fields.get(b64_key):
                save_base64_image(b64_fields[b64_key], f'{field_name}.jpg', getattr(bio, field_name))