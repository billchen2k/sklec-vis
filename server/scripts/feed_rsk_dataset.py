import os
import pyrsktools
import django
from django.core.files import File
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sklecvis.settings')
django.setup()

from api.models import *
BASE_DIR = os.path.join(os.path.dirname(__file__), '..')
user = SiteUser.objects.first()
files = os.listdir(os.path.join(BASE_DIR, 'local/dataset/ruskins'))

for f in files:
    full_path = os.path.join(BASE_DIR, 'local/dataset/ruskins', f)
    rsk = pyrsktools.open(full_path)
    version = rsk._db.execute('SELECT version FROM dbInfo').fetchone()[0]
    description = '''A dataset from RBR RSK database.'''
    meta = {}
    meta['name'] = rsk.deployment.name
    meta['instrument'] = {
                             'serial': rsk.instrument.serial,
                             'model': rsk.instrument.model,
                             'firmware_version': rsk.instrument.firmware_version,
                             'firmware_type': rsk.instrument.firmware_type[0],
                         },
    meta['sample_size'] = rsk.deployment.sample_size
    meta['rsk_version'] = version

    startdate = rsk.npsamples()[0][0],
    enddate = rsk.npsamples()[-1][0],

    dataset = Dataset(created_by=user,
                                     meta_data=meta,
                                     name=meta['name'],
                                     description=description,
                                     datetime_start=startdate[0],
                                     datetime_end=enddate[0],
                                     dataset_type=Dataset.DatasetType.RBR,
                                     )
    dataset.save()
    fobj = open(full_path, 'rb')

    visfile = VisFile(dataset=dataset,
                                     format=VisFile.FileFormat.RSK,
                                     file=File(fobj, name=f),
                                     file_name=os.path.basename(full_path),
                                     file_size=os.path.getsize(full_path),
                                     default_sample_count=min(rsk.npsamples().shape[0], 100000),
                                     )
    visfile.save()

    rawfile = RawFile(dataset=dataset,
                      file_name=os.path.basename(full_path),
                      file_size=os.path.getsize(full_path),
                      file=None,
                      file_same_as_vis=True,
                      visfile=visfile,)

    rawfile.save()

    channels = []
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

    print(f'Inserted {dataset.name} - {len(channels)} channels')
    rsk.close()
