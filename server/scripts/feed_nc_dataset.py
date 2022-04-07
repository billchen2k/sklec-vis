import os
import pyrsktools
import django
from django.core.files import File
import netCDF4
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sklecvis.settings')
django.setup()

from api.models import *
BASE_DIR = os.path.join(os.path.dirname(__file__), '..')



files = os.listdir(os.path.join(BASE_DIR, 'local/dataset/netCDF'))
user = SiteUser.objects.first()

for f in files:
    full_path = os.path.join(BASE_DIR, 'local/dataset/netCDF', f)
    nc = netCDF4.Dataset(full_path)
    description = '''A dataset from netCDF database.'''
    meta = {}
    meta['name'] = f
    # meta['classification_level'] = nc.classification_level
    # meta['distribution_statement'] = nc.distribution_statement
    # meta['downgrade_data'] = nc.downgrade_date
    # meta['institution'] = nc.institution
    # meta['source'] = nc.source
    # meta['history'] = nc.history
    # meta['field_type'] = nc.field_type
    # meta['Conventions'] = nc.Conventions
    # meta['History'] = nc.History

    dataset = Dataset(created_by=user,
                      meta_data=meta,
                      name=meta['name'],
                      description=description,
                      # datetime_start=startdate[0],
                      # datetime_end=enddate[0],
                      dataset_type=Dataset.DatasetType.NCF,
                      )
    dataset.save()

    fobj = open(full_path, 'rb')

    visfile = VisFile(dataset=dataset,
                      format=VisFile.FileFormat.NCF,
                      file=File(fobj, name=f),
                      file_name=os.path.basename(full_path),
                      file_size=os.path.getsize(full_path),
                      # default_sample_count=min(rsk.npsamples().shape[0], 100000),
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
    for c in nc.variables.keys():
        channel = nc[c]
        datachannel = DataChannel(visfile=visfile,
                                  name=channel.long_name,
                                  label=c,
                                  unit=channel.units,
                                  # datetime_start=startdate[0],
                                  # datetime_end=enddate[0],
                                  shape=str(channel.shape),
                                  )
        # channel的meta数据如下,不同channel有不同的meta数据:
        # <class 'netCDF4._netCDF4.Variable'>
        # int16 salinity(time, depth, lat, lon)
        #     long_name: Salinity
        #     standard_name: sea_water_salinity
        #     units: psu
        #     _FillValue: -30000
        #     missing _value: -30000
        #     scale_factor: 0.001
        #     add_offset: 20.0
        #     NAVO_code: 16
        #     coordinates: time depth lat lon lat lon
        # unlimited dimensions: time
        # current shape = (1, 40, 113, 189)
        # filling on
        # Salinity
        # 是否需要在models.DataChannel中也增加一个meta字典记录以上数据
        channels.append(datachannel)
        datachannel.save()

    print(f'Inserted {dataset.name} - {len(channels)} channels')
    nc.close()