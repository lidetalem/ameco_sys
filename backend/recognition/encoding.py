"""
recognition/encoding.py
AMECO — Face encoding computation and in-memory cache management.

The cache is a module-level dict loaded once at startup and updated
whenever new biometric data is saved. This avoids hitting the database
on every scan request.

Cache structure:
{
  person_key: {
    'name': str,
    'role': str,
    'digital_id': str,
    'profile_image': str | None,
    'encodings': list[np.ndarray],
  }
}
"""

import io
import base64
import logging
import numpy as np

logger = logging.getLogger(__name__)

# ── In-Memory Encoding Cache ──────────────────────────────────────────────────
_ENCODING_CACHE: dict = {}


def get_cache() -> dict:
    return _ENCODING_CACHE


def clear_cache():
    _ENCODING_CACHE.clear()


def load_all_encodings():
    """Load all BiometricData records from DB into the in-memory cache."""
    try:
        import face_recognition
        from recognition.models import BiometricData

        clear_cache()
        records = BiometricData.objects.select_related('content_type').all()

        for bio in records:
            try:
                obj = bio.content_object
                if obj is None:
                    continue

                encodings = bio.face_encodings
                if not encodings:
                    continue

                np_encodings = [np.array(e) for e in encodings if e]

                name = ''
                role = bio.content_type.model.upper()
                digital_id = getattr(obj, 'digital_id', '')
                profile_image = None

                if hasattr(obj, 'first_name'):
                    parts = [
                        getattr(obj, 'first_name', ''),
                        getattr(obj, 'middle_name', ''),
                        getattr(obj, 'last_name', ''),
                    ]
                    name = ' '.join(p for p in parts if p).strip()

                if hasattr(obj, 'profile_image') and obj.profile_image:
                    profile_image = obj.profile_image.url

                key = f'{bio.content_type.model}_{bio.object_id}'
                _ENCODING_CACHE[key] = {
                    'name': name,
                    'role': role,
                    'digital_id': digital_id,
                    'profile_image': profile_image,
                    'encodings': np_encodings,
                    'position': getattr(obj, 'position', ''),
                }
            except Exception as e:
                logger.warning(f'Skipping BiometricData #{bio.id}: {e}')

        logger.info(f'Encoding cache loaded: {len(_ENCODING_CACHE)} persons.')
    except Exception as e:
        logger.error(f'Failed to load encoding cache: {e}')


def compute_and_store_encodings(bio_instance):
    """
    Extract face encodings from the 5 face images in a BiometricData record
    and store them back into the DB + update the in-memory cache.
    """
    try:
        import face_recognition
        from PIL import Image

        encodings = []
        face_fields = [
            bio_instance.face_front,
            bio_instance.face_left,
            bio_instance.face_right,
            bio_instance.face_down,
            bio_instance.face_unusual,
        ]

        for image_field in face_fields:
            if not image_field:
                continue
            try:
                image_field.open()
                img = Image.open(image_field).convert('RGB')
                img_array = np.array(img)
                found = face_recognition.face_encodings(img_array)
                if found:
                    encodings.append(found[0].tolist())
            except Exception as e:
                logger.warning(f'Could not encode image {image_field}: {e}')

        bio_instance.face_encodings = encodings
        bio_instance.save(update_fields=['face_encodings'])
        logger.info(f'Stored {len(encodings)} encodings for BiometricData #{bio_instance.id}')

        # Refresh cache for this person
        load_all_encodings()
        return encodings
    except Exception as e:
        logger.error(f'compute_and_store_encodings failed: {e}')
        return []


def base64_to_np_image(b64_string: str) -> np.ndarray:
    """Convert a base64 image string to a numpy RGB array."""
    from PIL import Image
    if ',' in b64_string:
        b64_string = b64_string.split(',', 1)[1]
    raw = base64.b64decode(b64_string)
    img = Image.open(io.BytesIO(raw)).convert('RGB')
    return np.array(img)


def save_base64_image(b64_string: str, upload_path: str, field):
    """Save a base64 image to an ImageField."""
    from django.core.files.base import ContentFile
    if not b64_string:
        return
    if ',' in b64_string:
        b64_string = b64_string.split(',', 1)[1]
    raw = base64.b64decode(b64_string)
    field.save(upload_path, ContentFile(raw), save=False)