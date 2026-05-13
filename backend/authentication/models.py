"""
authentication/models.py
AMECO — Custom User Model extending AbstractUser.
Roles: admin, guard
"""

from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('guard', 'Guard'),
    ]

    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='guard')
    full_name = models.CharField(max_length=255, blank=True)
    profile_image = models.ImageField(upload_to='profiles/', null=True, blank=True)

    class Meta:
        db_table = 'auth_custom_user'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f'{self.username} ({self.role})'

    @property
    def display_name(self):
        return self.full_name or self.get_full_name() or self.username