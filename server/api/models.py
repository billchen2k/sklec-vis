from django.db import models
from django.contrib.auth.models import User
import uuid
from django.utils.translation import gettext_lazy as _
# Create your models here.

class SiteUser(models.Model):

    class UserRole(models.IntegerChoices):
        SUPERADMIN = 8
        ADMIN = 6
        INTERNAL_USER = 4
        EXTERNAL_USER = 2

    uuid = models.UUIDField(default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    display_name = models.CharField(max_length=100, blank=True, null=True)
    affiliation = models.CharField(max_length=50, blank=True, null=True)
    country = models.CharField(max_length=50, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.CharField(max_length=100, blank=True, null=True)
    city = models.CharField(max_length=50, blank=True, null=True)
    state = models.CharField(max_length=50, blank=True, null=True)
    is_deleted = models.BooleanField(default=False)

class Dataset(models.Model):

    class DatasetType(models.TextChoices):
        RBR = 'RBR' # 来自 RBR 浮标的数据，如 OBS 浊度计的数据
        NCF = 'NCF' # netCDF 格式数据，二维模型
        RASTER = 'RT' # 光栅文件数据，要在地图上显示的数据
        TABLE = 'TABLE' # 简单的表格数据
        GENERAL = 'GNR' # 普通数据，不需要在地图上显示

    uuid = models.UUIDField(default=uuid.uuid4, editable=False)
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
    datetime_start = models.DateTimeField(blank=True, null=True)
    datetime_end = models.DateTimeField(blank=True, null=True)
    dataset_type = models.CharField(choices=DatasetType.choices, max_length=20, default=DatasetType.GENERAL)

    def __str__(self):
        return self.name

class VisFile(models.Model):
    class FileFormat(models.TextChoices):
        RSK = 'rsk'
        CSV = 'csv'
        TIFF = 'tiff'
        OTHER = 'other'

    class GeoreferencedType(models.TextChoices):
        EMBEDDED = 'embedded'  # 嵌入进文件的地理坐标信息
        EXPLICIT = 'explicit'  # 显示声明的地理坐标信息 （通过 longitude1, latitude1, longitude2, latitude2）
        NONE = 'none'          # 无地理坐标信息

    uuid = models.UUIDField(default=uuid.uuid4, editable=False)
    dataset = models.ForeignKey(Dataset, on_delete=models.SET_NULL, null=True, related_name='vis_files')
    file_name = models.CharField(max_length=200)
    file_size = models.IntegerField(default=0)
    file = models.FileField(upload_to='datasets/vis/', blank=True, null=True)
    format = models.CharField(choices=FileFormat.choices, max_length=20, default=FileFormat.OTHER)
    default_sample_count = models.IntegerField(default=1)
    meta_data = models.JSONField(default=dict)
    is_georeferenced = models.BooleanField(default=False)
    longitude1 = models.FloatField(default=0.0)
    latitude1 = models.FloatField(default=0.0)
    longitude2 = models.FloatField(default=0.0)
    latitude2 = models.FloatField(default=0.0)

class DataChannel(models.Model):

    uuid = models.UUIDField(default=uuid.uuid4, editable=False)
    visfile = models.ForeignKey(VisFile, on_delete=models.CASCADE, related_name='data_channels')
    shape = models.CharField(max_length=50, blank=True, null=True, default='')
    name = models.CharField(max_length=50, blank=True, null=True)
    label = models.CharField(max_length=50, blank=True, null=True)
    unit = models.CharField(max_length=50, blank=True, null=True)
    unit_symbol = models.CharField(max_length=50, blank=True, null=True)
    datetime_start = models.DateTimeField(blank=True, null=True)
    datetime_end = models.DateTimeField(blank=True, null=True)

class RawFile(models.Model):
    uuid = models.UUIDField(default=uuid.uuid4, editable=False)
    dataset = models.ForeignKey(Dataset, on_delete=models.SET_NULL, null=True, related_name='raw_files')
    file_name = models.CharField(max_length=200)
    file_size = models.IntegerField(default=0)
    file = models.FileField(upload_to='datasets/raw/', null=True, blank=True)
    meta_data = models.JSONField(default=dict)
    folder_hierarchy = models.CharField(max_length=200, blank=True, null=True, default='/') # 用于模拟一个数据集下的多个文件的文件夹层级结构。todo。

    # If the same as visualization file, then the raw file is not needed
    file_same_as_vis = models.BooleanField(default=False)
    visfile = models.ForeignKey(VisFile, on_delete=models.SET_NULL, null=True, blank=True)

class DownloadRecord(models.Model):
    dataset = models.ForeignKey(Dataset, on_delete=models.SET_NULL, null=True, blank=True, related_name='download_records')
    rawfile = models.ForeignKey(RawFile, on_delete=models.SET_NULL, null=True, blank=True)
    user = models.ForeignKey(SiteUser, on_delete=models.SET_NULL, null=True, blank=True)
    download_datetime = models.DateTimeField(auto_now_add=True)
    download_ip = models.GenericIPAddressField()

class LoginRecord(models.Model):
    user = models.ForeignKey(SiteUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='login_records')
    login_datetime = models.DateTimeField(auto_now_add=True)
    ip = models.GenericIPAddressField()

class PasswordUpdateRecord(models.Model):
    user = models.ForeignKey(SiteUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='password_update_records')
    update_datetime = models.DateTimeField(auto_now_add=True)
    ip = models.GenericIPAddressField()
    previous_password = models.CharField(max_length=200)
    new_password = models.CharField(max_length=200)