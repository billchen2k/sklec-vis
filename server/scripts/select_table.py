import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sklecvis.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import *

visfile = VisFile.objects.first()
print(visfile)
print(visfile.dataset)
print(visfile.meta_data)
print(visfile.uuid)