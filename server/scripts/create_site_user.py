import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sklecvis.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import SiteUser

site_user = SiteUser(user=User.objects.first())
site_user.save()