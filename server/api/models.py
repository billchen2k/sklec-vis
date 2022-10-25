from django.db import models
from django.contrib.auth.models import User
import uuid
from sklecvis import settings
from django.utils.translation import gettext_lazy as _
# Create your models here.


def uuid4_short(length=settings.UUID_SHORT_LENGTH):
    return uuid.uuid4().hex[:length]

class SiteUser(models.Model):

    class UserRole(models.IntegerChoices):
        SUPERADMIN = 8
        ADMIN = 6
        INTERNAL_USER = 4
        EXTERNAL_USER = 2

    uuid = models.CharField(default=uuid4_short, editable=False, max_length=20)
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    display_name = models.CharField(max_length=100, blank=True, null=True)
    affiliation = models.CharField(max_length=50, blank=True, null=True)
    country = models.CharField(max_length=50, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.CharField(max_length=100, blank=True, null=True)
    city = models.CharField(max_length=50, blank=True, null=True)
    state = models.CharField(max_length=50, blank=True, null=True)
    is_deleted = models.BooleanField(default=False)
    is_activated = models.BooleanField(default=False)  # 用户邮箱地址是否已验证
    email_token = models.CharField(max_length=100, blank=True, null=True)  # 邮箱验证用token

    def __str__(self):
        """
        Will be used for Django admin display.
        """
        return f'{self.id}({self.uuid}): {self.user.username}'

class DatasetTag(models.Model):
    uuid = models.CharField(default=uuid4_short, editable=False, max_length=20)
    name = models.CharField(max_length=30, blank=True, null=True)
    full_name = models.CharField(max_length=100, blank=True, null=True)
    parent = models.ForeignKey(to='self', blank=True, null=True, on_delete=models.SET_NULL)
    description = models.CharField(max_length=200, blank=True, null=True)
    fa_icon = models.CharField(max_length=50, blank=True, null=True)
    color = models.CharField(max_length=20, blank=True, null=True)

    def get_tag_chain(self):
        """
        Return a list of tags from the root to the current tag.
        """
        chain = [self]
        parent = self.parent
        while parent:
            chain.append(parent)
            parent = parent.parent
        return reversed(chain)

    def __str__(self):
        chain = self.get_tag_chain()
        return ' -> '.join([f'{self.id}({self.uuid}): {tag.name}({tag.full_name})' for tag in chain])

class Dataset(models.Model):

    class DatasetType(models.TextChoices):
        RBR = 'RBR' # 来自 RBR 浮标的数据，如 OBS 浊度计的数据
        NCF = 'NCF' # netCDF 格式数据，二维模型
        RASTER = 'RT' # 光栅文件数据，要在地图上显示的数据
        TABLE = 'TABLE' # 简单的表格数据
        GENERAL = 'GNR' # 普通数据，不需要在地图上显示

    uuid = models.CharField(default=uuid4_short, editable=False, max_length=20)
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
    meta_data = models.JSONField(default=dict, blank=True, null=True)
    datetime_start = models.DateTimeField(blank=True, null=True)
    datetime_end = models.DateTimeField(blank=True, null=True)
    dataset_type = models.CharField(choices=DatasetType.choices, max_length=20, default=DatasetType.GENERAL)
    tags = models.ManyToManyField(DatasetTag, blank=True)

    def __str__(self):
        return f'{self.id}({self.uuid}): {self.name}'


class VisFile(models.Model):
    class FileFormat(models.TextChoices):
        RSK = 'rsk'
        CSV = 'csv'
        NCF = 'ncf'
        TIFF = 'tiff'
        OTHER = 'other'

    class GeoreferencedType(models.TextChoices):
        GEOTIFF = 'geotiff'  # 嵌入进文件的地理坐标信息
        EXPLICIT = 'explicit'  # 显示声明的地理坐标信息 （通过 longitude1, latitude1, longitude2, latitude2）
        NONE = 'none'          # 无地理坐标信息

    uuid = models.CharField(default=uuid4_short, editable=False, max_length=20)
    dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE, null=True, related_name='vis_files')
    file_name = models.CharField(max_length=200)
    file_size = models.BigIntegerField(default=0)
    file = models.FileField(upload_to='datasets/vis/', blank=True, null=True)
    format = models.CharField(choices=FileFormat.choices, max_length=20, default=FileFormat.OTHER)
    default_sample_count = models.IntegerField(default=1)
    meta_data = models.JSONField(default=dict, blank=True, null=True)
    first_dimension_name = models.CharField(max_length=50, blank=True, null=True, default='Time')
    is_georeferenced = models.BooleanField(default=False)
    georeference_type = models.CharField(choices=GeoreferencedType.choices, max_length=20, default=GeoreferencedType.NONE)
    longitude1 = models.FloatField(default=0.0)
    latitude1 = models.FloatField(default=0.0)
    longitude2 = models.FloatField(default=0.0)
    latitude2 = models.FloatField(default=0.0)
    datetime_start = models.DateTimeField(null=True, blank=True)
    datetime_end = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['datetime_start', 'file_name']

    def __str__(self):
        return f'{self.id}({self.uuid}): {self.file_name}'

class DataChannel(models.Model):
    uuid = models.CharField(default=uuid4_short, editable=False, max_length=20)
    visfile = models.ForeignKey(VisFile, on_delete=models.CASCADE, related_name='data_channels')
    shape = models.CharField(max_length=50, blank=True, null=True, default='')
    name = models.CharField(max_length=50, blank=True, null=True)  # 展示出来的真正的名字
    label = models.CharField(max_length=50, blank=True, null=True) # 机器名
    description = models.CharField(max_length=200, blank=True, null=True)
    unit = models.CharField(max_length=50, blank=True, null=True)
    unit_symbol = models.CharField(max_length=50, blank=True, null=True)
    datetime_start = models.DateTimeField(blank=True, null=True)
    datetime_end = models.DateTimeField(blank=True, null=True)
    meta_data = models.JSONField(default=dict, blank = True, null = True)
    def __str__(self):
        return f'{self.id}({self.uuid}): {self.label}'

class RawFile(models.Model):
    uuid = models.CharField(default=uuid4_short, editable=False, max_length=20)
    dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE, null=True, related_name='raw_files')
    file_name = models.CharField(max_length=200)
    file_size = models.BigIntegerField(default=0)
    file = models.FileField(upload_to='datasets/raw/', null=True, blank=True)
    meta_data = models.JSONField(default=dict)
    folder_hierarchy = models.CharField(max_length=200, blank=True, null=True, default='/') # 用于模拟一个数据集下的多个文件的文件夹层级结构。todo。

    # If the same as visualization file, then the raw file is not needed
    file_same_as_vis = models.BooleanField(default=False)
    visfile = models.ForeignKey(VisFile, on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return f'{self.id}({self.uuid}): {self.file_name}'

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

class ViewTiffFile(models.Model):
    is_preview = models.BooleanField(blank=True, null=True)
    file = models.FileField(upload_to='cache_files/nc_to_tiff/', null=True, blank=True)

    file_size = models.BigIntegerField(blank = True, null = True)
    file_name = models.CharField(max_length = 200, blank = True, null = True)

    datetime = models.IntegerField(blank = True, null = True)
    depth = models.IntegerField(blank = True, null = True)
    longitude_start = models.IntegerField(blank = True, null = True)
    longitude_end = models.IntegerField(blank = True, null = True)
    latitude_start = models.IntegerField(blank = True, null = True)
    latitude_end = models.IntegerField(blank = True, null = True)
    label = models.CharField(max_length=100, blank = True, null = True)

    min_value = models.FloatField(blank = True, null = True)
    max_value = models.FloatField(blank = True, null = True)
    file = models.CharField(max_length = 256, blank = True, null = True)

    create_time = models.DateTimeField(blank = True, null = True)
    last_access_time = models.DateTimeField(blank = True, null = True)


class FormDataTableType(models.Model):
    class TableTypes(models.TextChoices):
        BENTHOS = 'benthos'
        SURFACE_SEDIMENT = 'surface_sediment'
        VEGETATION = 'vegetation'
        DEFAULT = 'default'

    uuid = models.CharField(default=uuid4_short, editable=False, max_length=20)
    type = models.CharField(choices=TableTypes.choices, max_length=20, default=TableTypes.DEFAULT)
    name = models.CharField(max_length=256, blank=True, null=True)
    meta_data = models.JSONField(default=dict)


class FormDataFieldType(models.Model):
    class AttributeTypes(models.TextChoices):
        DEFAULT = 'default'
        NUMERICAL = 'numerical'
        TEMPORAL = 'temporal'
        SPACIAL = 'spacial'
        CATEGORICAL = 'categorical'

    uuid = models.CharField(default=uuid4_short, editable=False, max_length=20)
    table_type = models.ForeignKey(FormDataTableType, on_delete=models.CASCADE, null=True, blank=True,
                                   related_name='field_types')
    name = models.CharField(max_length=256, blank=True, null=True)
    attribute_type = models.CharField(choices=AttributeTypes.choices, max_length=20, default=AttributeTypes.DEFAULT)
    unit = models.CharField(max_length=30, blank=True, null=True)
    index = models.IntegerField(blank=True, null=True, default=0)
    meta_data = models.JSONField(default=dict)


class FormDataTable(models.Model):
    uuid = models.CharField(default=uuid4_short, editable=False, max_length=20)
    dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE, null=True, blank=True,
                                related_name='tables')
    table_type = models.ForeignKey(FormDataTableType, on_delete=models.CASCADE, null=True, blank=True,
                                   related_name='tables')
    name = models.CharField(max_length=30, blank=True, null=True)
    meta_data = models.JSONField(default=dict)


class FormDataFieldValue(models.Model):
    uuid = models.CharField(default=uuid4_short, editable=False, max_length=20)
    table = models.ForeignKey(FormDataTable, on_delete=models.CASCADE, null=True, blank=True,
                              related_name='field_values')
    field_type = models.ForeignKey(FormDataFieldType, on_delete=models.CASCADE, null=True, blank=True,
                                   related_name='field_values')
    index_row = models.IntegerField(blank=True, null=True)
    value_numerical = models.FloatField(blank=True, null=True)
    value_temporal = models.DateTimeField(blank=True, null=True)
    value_spacial = models.FloatField(blank=True, null=True)
    value_categorical = models.CharField(max_length=256, blank=True, null=True)
