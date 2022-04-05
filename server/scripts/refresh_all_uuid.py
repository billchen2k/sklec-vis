import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sklecvis.settings')
django.setup()

from api.models import *

def main():
    models_with_uuid = [SiteUser, DatasetTag, Dataset, VisFile, DataChannel, RawFile]
    for model in models_with_uuid:
        for obj in model.objects.all():
            print(f'{model.__name__} {obj.uuid}')
            obj.uuid = uuid4_short()
            obj.save()

if __name__ == '__main__':
    main()