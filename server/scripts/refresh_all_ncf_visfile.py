import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sklecvis.settings')
django.setup()

from api.models import *
from api.sklec.NcfCore import NcfCore


def main():
    print('Total refresh number:', len(VisFile.objects.all()))
    for visfile in VisFile.objects.all():
        if visfile.format != 'ncf' or visfile.dataset is None:
            continue
        print(visfile.file.name)
        try:
            core = NcfCore(visfile.file.name)
            uuid = core.refresh_visfile(visfile.uuid)
            print(f'Refresh visfile {uuid} succeed. dataset uuid {visfile.dataset.uuid}.')
        except Exception as e:
            print(f'Refresh visfile {uuid} failed. dataset uuid {visfile.dataset.uuid}. message: {e.args}')


if __name__ == '__main__':
    main()