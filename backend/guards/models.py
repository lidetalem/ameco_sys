"""
guards/models.py
AMECO — GuardProfile model.
"""

from django.db import models
from authentication.models import CustomUser


class GuardProfile(models.Model):
    GENDER_CHOICES = [('M', 'Male'), ('F', 'Female'), ('O', 'Other')]

    user             = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='guardprofile', null=True, blank=True)
    profile_image    = models.ImageField(upload_to='guards/profiles/', null=True, blank=True)
    first_name       = models.CharField(max_length=100)
    middle_name      = models.CharField(max_length=100, blank=True)
    last_name        = models.CharField(max_length=100, blank=True)
    phone_number     = models.CharField(max_length=30, blank=True)
    gender           = models.CharField(max_length=1, choices=GENDER_CHOICES, default='M')
    description      = models.TextField(blank=True)
    guard_tag        = models.CharField(max_length=100, blank=True)
    digital_id       = models.CharField(max_length=50, unique=True, blank=True)
    id_card_image    = models.ImageField(upload_to='guards/id_cards/', null=True, blank=True)
    gate_registered_on  = models.CharField(max_length=50, blank=True)
    gates_assigned_to   = models.CharField(max_length=255, blank=True)
    registered_by    = models.CharField(max_length=255, blank=True)
    registered_at    = models.DateTimeField(auto_now_add=True)

    # convenience for serializer queries
    assigned_by_name = models.CharField(max_length=255, blank=True)
    email            = models.EmailField(blank=True)
    username         = models.CharField(max_length=150, blank=True)
    gate_camera_id   = models.CharField(max_length=50, blank=True)

    class Meta:
        db_table = 'guard_profile'

    def __str__(self):
        return f'{self.first_name} {self.last_name} (Guard)'

    def full_name(self):
        return f'{self.first_name} {self.middle_name} {self.last_name}'.strip()