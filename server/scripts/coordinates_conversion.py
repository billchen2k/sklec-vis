import os
import geopy
import django
from django.core.files import File
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sklecvis.settings')
django.setup()
from api.models import *
BASE_DIR = os.path.join(os.path.dirname(__file__), '..')

raw = """1,122°13'5.60'',31°04'4.00'',,
2,121°59'24.00'',31°07'23.50'',,
3,121°49'20.16'',31°12'57.03'',,
4,122°20'2.40'',31°24'36.00'',,
5,122°03'11.71'',31°21'26.97'',,
6,121°50'5.40'',31°22'52.00'',,"""

coordinates = raw.split('\n')
for coordinate in coordinates:
    id, long, lat, *other = coordinate.split(',')
    long = long.replace('°', ' ').replace("''", 's ').replace("'", 'm ') + 'E'
    lat = lat.replace('°', ' ').replace("''", 's ').replace("'", 'm ') + 'N'
    point = geopy.Point(f'{lat} {long}')
    d = Dataset.objects.get(name__contains=f'#{id}')
    d.longitude = point.longitude
    d.latitude = point.latitude
    d.save()
    print(f'{d.name} {d.longitude} {d.latitude}')
    pass


