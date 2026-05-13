"""
admins/models.py
AMECO — AdminProfile model.
"""

from django.db import models
from authentication.models import CustomUser


class AdminProfile(models.Model):
    GENDER_CHOICES = [('M', 'Male'), ('F', 'Female'), ('O', 'Other')]

    user           = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='adminprofile', null=True, blank=True)
    profile_image  = models.ImageField(upload_to='admins/profiles/', null=True, blank=True)
    first_name     = models.CharField(max_length=100)
    middle_name    = models.CharField(max_length=100, blank=True)
    last_name      = models.CharField(max_length=100, blank=True)
    phone_number   = models.CharField(max_length=30, blank=True)
    gender         = models.CharField(max_length=1, choices=GENDER_CHOICES, default='M')
    description    = models.TextField(blank=True)
    admin_tag      = models.CharField(max_length=100, blank=True)
    digital_id     = models.CharField(max_length=50, unique=True, blank=True)
    id_card_image  = models.ImageField(upload_to='admins/id_cards/', null=True, blank=True)
    gate_registered_on = models.CharField(max_length=50, blank=True)
    gates_assigned_to  = models.CharField(max_length=255, blank=True)  # comma-separated IDs
    registered_by  = models.CharField(max_length=255, blank=True)
    registered_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'admin_profile'

    def __str__(self):
        return f'{self.first_name} {self.last_name} (Admin)'

    def full_name(self):
        return f'{self.first_name} {self.middle_name} {self.last_name}'.strip()