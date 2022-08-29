import os
import pyrsktools
import django
from django.core.files import File
import netCDF4
import numpy as np
import argparse
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sklecvis.settings')
django.setup()

from api.models import *
BASE_DIR = os.path.join(os.path.dirname(__file__), '..')

def init_argparse():
    parser = argparse.ArgumentParser()
    parser.add_argument('--filename', '-f', default = '',)

    args = parser.parse_args()
    return args

args = init_argparse()
filename = args.filename

files = os.listdir(os.path.join(BASE_DIR, 'media/datasets/ncf'))
user = SiteUser.objects.first()

for f in files:
    # if (f == '4dim.nc'): continue
    if (filename != ' ' and filename != f): 
        continue
    full_path = os.path.join(BASE_DIR, 'media/datasets/ncf', f)
    # print(full_path)
    core = NcfCoreClass(fullpath)
    nc = netCDF4.Dataset(full_path)
    print(nc.dimensions)
    print(nc.variables)
    description = '''A dataset from netCDF database.'''
    # meta = nc.__dict__
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
    # print(dataset)
    dataset.save()

    fobj = open(full_path, 'rb')

    meta = {}
    dimensions = []
    variables = []
    string_for_datetime = ['datetime', 'time']
    string_for_longitude = ['lon', 'Lon', 'longitude', 'Longitude']
    string_for_latitude = ['lat', 'Lat', 'latitude', 'Latitude']
    string_for_depth = ['depth', 'Depth']

    for dim in nc.dimensions.keys():
        # 'level' 字段需要特殊处理
        if not (dim in nc.variables.keys()): 
            continue
        # print(dim)
        dim_dict = {}
        dim_dict['dimension_name'] = dim
        dim_dict['dimension_length'] = nc.dimensions[dim].size
        dimension_type = ''
        if (dim in string_for_datetime):
            dimension_type = 'datetime'
        elif (dim in string_for_longitude):
            dimension_type = 'longitude'
        elif (dim in string_for_latitude):
            dimension_type = 'latitude'
        elif (dim in string_for_depth):
            dimension_type = 'depth'
        dim_dict['dimension_type'] = dimension_type
        # dim_dict['dimension_units'] = nc.dimensions[dim].units
        dim_dict['dimension_values'] = list(np.asarray(nc[dim][:], dtype=np.float64))
        dimensions.append(dim_dict)

    for variable in nc.variables.keys():
        if (variable in nc.dimensions.keys()): continue
        var_dict = {}
        var_dict['variable_name'] = variable
        if hasattr(nc[variable], 'units'):
            var_dict['variable_units'] = nc[variable].units
        else:
            var_dict['variable_units'] = ''
        if hasattr(nc[variable], 'long_name'):
            var_dict['variable_longname'] = nc[variable].long_name
        else:
            var_dict['variable_longname'] = ''
        var_dict['variable_dimensions'] = []
        for dim in nc[variable].dimensions:
            dimension_type = ''
            if (dim in string_for_datetime):
                dimension_type = 'datetime'
            elif (dim in string_for_longitude):
                dimension_type = 'longitude'
            elif (dim in string_for_latitude):
                dimension_type = 'latitude'
            elif (dim in string_for_depth):
                dimension_type = 'depth'
            var_dict['variable_dimensions'].append(dimension_type)
        preview_info = core.gen_preview(variable, visfile.uuid)
        url = preview_info['filepath'].replace(settings.MEDIA_ROOT, 'media')
        # print(preview_info['filepath'])
        # print(url)
        preview_info['file'] = url
        del preview_info['filepath']
        var_dict['preview_info'] = preview_info
        print(preview_info)
        variables.append(var_dict)

    meta['dimensions'] = dimensions
    meta['variables'] = variables
    visfile = VisFile(dataset=dataset,
                      format=VisFile.FileFormat.NCF,
                      file=File(fobj, name=f),
                      file_name=os.path.basename(full_path),
                      file_size=os.path.getsize(full_path) / 1024,
                      meta_data=meta,
                      # default_sample_count=min(rsk.npsamples().shape[0], 100000),
                      )
    visfile.save()

    rawfile = RawFile(dataset=dataset,
                      file_name=os.path.basename(full_path),
                      file_size=os.path.getsize(full_path) / 1024,
                      file=None,
                      file_same_as_vis=True,
                      visfile=visfile,)

    rawfile.save()

    channels = []
    for c in nc.variables.keys():
        channel = nc[c]
        # if c in nc.dimensions.keys():
        #     channel_meta['type'] = 'dimension'
        # elif c in nc.variables.keys():
        #     channel_meta['type'] = 'variable'
        channel_meta = {}
        datachannel = DataChannel(visfile=visfile,
                                  name=channel.long_name if hasattr(channel, 'long_name') else '',
                                  label=c,
                                  unit=channel.units if hasattr(channel, 'units') else '',
                                  # datetime_start=startdate[0],
                                  # datetime_end=enddate[0],
                                  shape=str(channel.shape),
                                  meta_data = channel_meta
                                  )
        channels.append(datachannel)
        datachannel.save()

    print(f'Inserted {dataset.name} - {len(channels)} channels')
    nc.close()