"""
recognition/views.py
AMECO — Face Recognition Scan API.

POST /api/recognition/scan/
  - Accepts base64 face image
  - Anti-spoofing check via DeepFace
  - Face matching against in-memory encoding cache
  - Redis counter for unknown attempts (max 4, locked 5 min)
  - Returns: ACCEPTED | REJECTED | SPOOF_DETECTED | ATTEMPT_LIMIT_REACHED
"""

import logging
import numpy as np
import redis
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from authentication.permissions import IsAdminOrGuard
from .encoding import get_cache, base64_to_np_image, load_all_encodings
from logs.utils import create_log

logger = logging.getLogger(__name__)

TOLERANCE      = 0.5
MAX_ATTEMPTS   = 4
BLOCK_SECONDS  = 300  # 5 minutes

# Redis client for attempt counters
_redis = redis.Redis.from_url(settings.CELERY_BROKER_URL, decode_responses=True)


class FaceScanView(APIView):
    permission_classes = [IsAdminOrGuard]

    def post(self, request):
        b64_image = request.data.get('image')
        camera_id = request.data.get('camera_id', 'UNKNOWN')

        if not b64_image:
            return Response({'result': 'ERROR', 'message': 'No image provided.'}, status=400)

        # ── 1. Decode image ───────────────────────────────────────────────────
        try:
            img_array = base64_to_np_image(b64_image)
        except Exception as e:
            return Response({'result': 'ERROR', 'message': f'Image decode failed: {e}'}, status=400)

        # ── 2. Anti-spoofing / liveness check ────────────────────────────────
        try:
            from deepface import DeepFace
            analysis = DeepFace.analyze(
                img_path=img_array,
                actions=['emotion'],
                enforce_detection=False,
                silent=True,
            )
            # DeepFace doesn't expose liveness directly in all versions;
            # use face area ratio as a proxy liveness signal.
            # A photo-of-photo typically shows a much smaller face region.
            if isinstance(analysis, list):
                analysis = analysis[0]
            region = analysis.get('region', {})
            face_w = region.get('w', 0)
            face_h = region.get('h', 0)
            img_h, img_w = img_array.shape[:2]
            face_area_ratio = (face_w * face_h) / (img_w * img_h + 1e-6)

            if face_area_ratio < 0.04:
                create_log(actor=request.user, action_type='SPOOF_DETECTED',
                           description=f'Spoof detected at {camera_id}')
                return Response({'result': 'SPOOF_DETECTED'})
        except Exception as e:
            logger.warning(f'Liveness check skipped: {e}')

        # ── 3. Extract encoding of incoming face ──────────────────────────────
        try:
            import face_recognition
            incoming_encodings = face_recognition.face_encodings(img_array)
            if not incoming_encodings:
                return Response({'result': 'REJECTED', 'message': 'No face detected.'})
            incoming_enc = incoming_encodings[0]
        except Exception as e:
            return Response({'result': 'ERROR', 'message': f'Encoding failed: {e}'}, status=500)

        # ── 4. Compare against cache ──────────────────────────────────────────
        cache = get_cache()
        if not cache:
            load_all_encodings()
            cache = get_cache()

        best_match = None
        best_distance = 1.0

        for key, data in cache.items():
            stored_encodings = data.get('encodings', [])
            if not stored_encodings:
                continue
            try:
                distances = face_recognition.face_distance(stored_encodings, incoming_enc)
                min_dist = float(np.min(distances))
                if min_dist < best_distance:
                    best_distance = min_dist
                    best_match = (key, data, min_dist)
            except Exception:
                continue

        # ── 5. Evaluate match ─────────────────────────────────────────────────
        if best_match and best_distance <= TOLERANCE:
            key, person_data, confidence = best_match
            confidence_pct = round((1 - confidence) * 100, 1)

            # Reset any attempt counter for this "face"
            _redis.delete(f'unknown_attempts:{camera_id}')

            create_log(
                actor=request.user,
                action_type='SCAN_ACCEPTED',
                description=f'{person_data["name"]} scanned at {camera_id} — confidence {confidence_pct}%',
            )

            return Response({
                'result': 'ACCEPTED',
                'name': person_data['name'],
                'role': person_data['role'],
                'digital_id': person_data['digital_id'],
                'position': person_data.get('position', ''),
                'profile_image': person_data['profile_image'],
                'confidence': confidence_pct,
            })

        # ── 6. Unknown face — track attempts ──────────────────────────────────
        attempt_key = f'unknown_attempts:{camera_id}'
        current = _redis.get(attempt_key)
        count = int(current) + 1 if current else 1

        if count >= MAX_ATTEMPTS:
            _redis.setex(attempt_key, BLOCK_SECONDS, count)
            create_log(
                actor=request.user,
                action_type='ATTEMPT_LIMIT',
                description=f'4 failed scans at {camera_id}. Blocked for 5 minutes.',
            )
            return Response({'result': 'ATTEMPT_LIMIT_REACHED'})

        _redis.setex(attempt_key, BLOCK_SECONDS, count)
        create_log(
            actor=request.user,
            action_type='SCAN_REJECTED',
            description=f'Unknown face at {camera_id} — attempt {count}/{MAX_ATTEMPTS}',
        )
        return Response({'result': 'REJECTED', 'attempts': count})


class ReloadEncodingCacheView(APIView):
    """Admin-only endpoint to force-reload the face encoding cache from DB."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'admin':
            return Response({'detail': 'Admin only.'}, status=403)
        load_all_encodings()
        return Response({'detail': f'Cache reloaded. {len(get_cache())} persons loaded.'})