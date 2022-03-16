from django.contrib import admin

# Register your models here.
from api import models


@admin.register(models.Dataset, models.VisFile, models.RawFile, models.DataChannel, models.SiteUser)
class DatasetAdmin(admin.ModelAdmin):
    pass
