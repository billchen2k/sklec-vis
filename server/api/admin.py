from django.contrib import admin

# Register your models here.
from api import models


@admin.register(models.Dataset, models.VisFile, models.RawFile, models.DataChannel, models.SiteUser, models.DatasetTag,
                models.FormDataTableMeta, models.FormDataTable, models.FormDataFieldMeta, models.FormDataCell)
class DatasetAdmin(admin.ModelAdmin):
    pass
