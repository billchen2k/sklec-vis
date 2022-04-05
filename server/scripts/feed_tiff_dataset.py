import datetime
import os
import django
from django.core.files import File
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sklecvis.settings')
django.setup()

from api.models import *
BASE_DIR = os.path.join(os.path.dirname(__file__), '..')
user = SiteUser.objects.first()
files = os.listdir(os.path.join(BASE_DIR, 'local/dataset/sentinel3-vis-1000LZW/'))
files = list(filter(lambda x: not x[0] == '.', files))
dataset = Dataset.objects.get(name__contains='RDI')
def main():
    for f in files:
        print(f'Processing {f}')
        year = f[8:12]
        month = f[12:14]
        day = f[14:16]
        dobj = datetime.datetime.strptime(year + '-' + month + '-' + day, '%Y-%m-%d')

        full_path = os.path.join(BASE_DIR, 'local/dataset/sentinel3-vis-1000LZW/', f)
        fobj = open(full_path, 'rb')
        visfile = VisFile.objects.create(
            dataset=dataset,
            file_name=f,
            file=File(fobj, name=f),
            file_size=os.path.getsize(full_path),
            format = VisFile.FileFormat.TIFF,
            is_georeferenced=True,
            georeference_type=VisFile.GeoreferencedType.GEOTIFF,
            datetime_start=dobj.isoformat(),
            datetime_end=dobj.isoformat(),
        )
        visfile.save()

        rawfile = RawFile.objects.create(
            dataset=dataset,
            file_name=f,
            file_size=os.path.getsize(full_path),
            folder_hierarchy='/',
            file_same_as_vis=True,
            visfile=visfile,
        )
        rawfile.save()

if __name__ == '__main__':
    main()
