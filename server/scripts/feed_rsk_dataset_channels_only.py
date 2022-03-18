import os
import pyrsktools
import django
from django.core.files import File
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sklecvis.settings')
django.setup()

from api.models import *
BASE_DIR = os.path.join(os.path.dirname(__file__), '..')



files = os.listdir(os.path.join(BASE_DIR, 'local/dataset/ruskins'))
user = SiteUser.objects.first()

for f in files:
    full_path = os.path.join(BASE_DIR, 'local/dataset/ruskins', f)
    rsk = pyrsktools.open(full_path)
    visfile = VisFile.objects.get(file_name=f)

    channels = []
    startdate = rsk.npsamples()[0][0],
    enddate = rsk.npsamples()[-1][0],
    for c in rsk.sample_fields:
        if not c in rsk.channels:
            continue
        channel = rsk.channels[c]
        datachannel = DataChannel(visfile=visfile,
                                  name=channel.name,
                                  label=c,
                                  unit=channel.units,
                                  datetime_start=startdate[0],
                                  datetime_end=enddate[0],
                                  shape=None,
                                  )
        channels.append(datachannel)
        datachannel.save()

    rsk.close()
