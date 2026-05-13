from django.urls import path
from .views import FaceScanView, ReloadEncodingCacheView

urlpatterns = [
    path('scan/',   FaceScanView.as_view(),          name='face-scan'),
    path('reload/', ReloadEncodingCacheView.as_view(), name='reload-cache'),
]