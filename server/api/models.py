from django.db import models
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _
# Create your models here.

class SiteUser(models.Model):

    SUPERADMIN = 8
    ADMIN = 6
    INTERNAL_USER = 4
    EXTERNAL_USER = 2

    ROLE_CHOICES = (
        (SUPERADMIN, _('Super Admin')),
        (ADMIN, _('Admin')),
        (INTERNAL_USER, _('Internal User')),
        (EXTERNAL_USER, _('External User')),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    affiliation = models.CharField(max_length=50, blank=True, null=True)
    country = models.CharField(max_length=50, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.CharField(max_length=100, blank=True, null=True)
    city = models.CharField(max_length=50, blank=True, null=True)
    state = models.CharField(max_length=50, blank=True, null=True)
    is_deleted = models.BooleanField(default=False)

    def __str__(self):
        return self.user.username

class Dataset(models.Model):

    class DatasetType(models.TextChoices):
        TABLE = 'TC', _('Table')
        NCF = 'NCF', _('NetCDF')
        RASTER = 'RT', _('Raster')
        PLAIN = 'PN', _('Plain')

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(SiteUser, on_delete=models.CASCADE)
    is_public = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    is_deleted = models.BooleanField(default=False)
    is_coordinated = models.BooleanField(default=True)
    longitude = models.FloatField(default=0.0)
    latitude = models.FloatField(default=0.0)
    meta_data = models.JSONField(default=dict)
    dataset_type = models.CharField(choices=DatasetType.choices, max_length=20, default=DatasetType.TABLE)

    def __str__(self):
        return self.name

class VisFile(models.Model):
    dataset = models.ForeignKey(Dataset, on_delete=models.SET_NULL, null=True)
    file_name = models.CharField(max_length=200)
    file_size = models.IntegerField(default=0)
    file = models.FileField(upload_to='datasets/vis/')
    bounds_leftup = models.FloatField(default=0.0, blank=True, null=True)
    bounds_rightdown = models.FloatField(default=0.0, blank=True, null=True)

class RawFile(models.Model):
    dataset = models.ForeignKey(Dataset, on_delete=models.SET_NULL, null=True)
    file_name = models.CharField(max_length=200)
    file_size = models.IntegerField(default=0)
    file = models.FileField(upload_to='datasets/raw/')