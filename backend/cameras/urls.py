from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GateWithCameraViewSet

router = DefaultRouter()
router.register('terminals', GateWithCameraViewSet, basename='camera')

urlpatterns = [
    path('', include(router.urls)),
]