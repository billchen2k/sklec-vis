import os
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

    # 文件的meta数据如下,不同文件有不同的meta数据,不能直接取
    meta = {}
    for key in nc.__dict__.keys():
        meta[key] = str(nc.__dict__[key])  # 转为str
    meta['filename'] = f

    dataset = Dataset(created_by=user,
                      meta_data=meta,
                      name=meta['filename'],
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

    for index in nc.variables:
        # TODO coordinates自变量和因变量的关系，类似于int16 salinity(time, depth, lat, lon)怎么拿到，怎么存
        # print(nc.variables[index])
        # try:
        #     print(nc.variables[index].coordinates)
        #     print(type(nc.variables[index].coordinates))
        # except:
        #     print('no coordinates')
        # print(dir(nc.variables[index]))
        variable_dict = nc.variables[index].__dict__
        channel_type = 1 if index in nc.dimensions else 2 # 1: dimension, 2: variable
        meta_data = {}
        for key in variable_dict.keys():
            meta_data[key] = str(variable_dict[key])  # 转为str
        
        datachannel = DataChannel(meta_data=meta_data,
                                  channel_type=channel_type,
                                  missing_value=variable_dict.get('missing_value'), # 可能为None
                                  scale_factor=variable_dict.get('scale_factor'), # 可能为None
                                  add_offset=variable_dict.get('add_offset'), # 可能为None
                                  name=variable_dict.get('long_name'),
                                  label=index,
                                  unit=variable_dict.get('units'),
                                  shape=variable_dict.get('shape'),
                                  visfile=visfile,
                                  # datetime_start=startdate[0],
                                  # datetime_end=enddate[0],
                                  )
        channels.append(datachannel)
        datachannel.save()


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
        

    print(f'Inserted {dataset.name} - {len(channels)} channels')
    nc.close()
