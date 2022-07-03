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
from api.serializers import *
from api.sklec.NcfCore import NcfCoreClass
BASE_DIR = os.path.join(os.path.dirname(__file__), '..')

visfiles = VisFile.objects.all().filter(format='ncf')

string_for_datetime = ['datetime', 'time']
string_for_longitude = ['lon', 'Lon', 'longitude', 'Longitude']
string_for_latitude = ['lat', 'Lat', 'latitude', 'Latitude']
string_for_depth = ['depth', 'Depth']

undefined_list = ['etopo1.nc', 'FlowFM_map.nc', 'FlowFM_his.nc', 'Delft3D_trim.nc']

# core = NcfCoreClass()
for visfile in visfiles:
    path = visfile.file.path
    print(visfile.file_name)
    if (visfile.file_name in undefined_list):
        continue
    nc = netCDF4.Dataset(path)
    core = NcfCoreClass(path)
    print(path)
    print(visfile.uuid)
    variables = []
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
    # print(variables)
    visfile.meta_data['variables'] = variables
    visfile.save()
    # a = VisFileSerializer(visfile)
    # print(a.data)


    # break
    # break
    # meta_data = visfile.meta_data
    # # visfile.meta_data = meta_data
    # # visfile.save()
    # nc = netCDF4.Dataset(visfile.file)
    # print(nc.dimensions.keys())
    # for dim in nc.dimensions.keys():
    #     # 'level' 字段需要特殊处理
    #     if not (dim in nc.variables.keys()): 
    #         continue
    #     # print(dim)
    #     dim_dict = {}
    #     dim_dict['dimension_name'] = dim
    #     dim_dict['dimension_length'] = nc.dimensions[dim].size
    #     dimension_type = ''
    #     if (dim in string_for_datetime):
    #         dimension_type = 'datetime'
    #     elif (dim in string_for_longitude):
    #         dimension_type = 'longitude'
    #     elif (dim in string_for_latitude):
    #         dimension_type = 'latitude'
    #     elif (dim in string_for_depth):
    #         dimension_type = 'depth'
    #     dim_dict['dimension_type'] = dimension_type
    #     # dim_dict['dimension_units'] = nc.dimensions[dim].units
    #     dim_dict['dimension_values'] = list(np.asarray(nc[dim][:], dtype=np.float64))
    #     dimensions.append(dim_dict)
    # for variable in nc.variables.keys():
    #     if (variable in nc.dimensions.keys()): continue
    #     # print(nc[variable])
    #     var_dict = {}
    #     var_dict['variable_name'] = variable
    #     if hasattr(nc[variable], 'units'):
    #         var_dict['variable_units'] = nc[variable].units
    #     else:
    #         var_dict['variable_units'] = ''
    #     if hasattr(nc[variable], 'long_name'):
    #         var_dict['variable_longname'] = nc[variable].long_name
    #     else:
    #         var_dict['variable_longname'] = ''
    #     var_dict['variable_dimensions'] = []
    #     for dim in nc[variable].dimensions:
    #         dimension_type = ''
    #         if (dim in string_for_datetime):
    #             dimension_type = 'datetime'
    #         elif (dim in string_for_longitude):
    #             dimension_type = 'longitude'
    #         elif (dim in string_for_latitude):
    #             dimension_type = 'latitude'
    #         elif (dim in string_for_depth):
    #             dimension_type = 'depth'
    #         var_dict['variable_dimensions'].append(dimension_type)
    #     variables.append(var_dict)
    # # print(variables)
    # meta['dimensions'] = dimensions
    # meta['variables'] = variables

    # break