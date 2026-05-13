from django.apps import AppConfig


class RecognitionConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'recognition'

    def ready(self):
        """Load the face encoding cache into memory when Django starts."""
        try:
            from .encoding import load_all_encodings
            load_all_encodings()
        except Exception:
            pass  # DB may not be ready during migrations