import os
import math
import numpy as np
import netCDF4
from api.sklec.SKLECBaseCore import SKLECBaseCore
from django.core.files import File
from django.core.files.storage import default_storage
from osgeo import gdal, osr
from sklecvis import settings
import subprocess
import re
import uuid
import time
import datetime
from collections import defaultdict, namedtuple
from api.models import *

ROOT_DIR = os.path.relpath(os.path.join(os.path.dirname(__file__), '..'))
CACHE_FOLDER_DIR = os.path.join(
    settings.MEDIA_ROOT, 'cache_files', 'nc_to_tiff')

PREVIEW_FOLDER_DIR = os.path.join(
    settings.MEDIA_ROOT, 'previews', 'nc_to_tiff'
)


class NcfCoreException:
    pass


class NcfCacheManager:
    CACHE_FOLDER_DIR = os.path.join(settings.MEDIA_ROOT, 'cache_files', 'nc_to_tiff')
    GIGABYTE = 1024 ** 3
    CACHE_SIZE = 5 * GIGABYTE
    ELIMINATE_SIZE = 2 * GIGABYTE

    @classmethod
    def get_dir_size(cls, p_doc):
        size = 0.0
        status = []
        for root, dirs, files in os.walk(p_doc):
            for file in files:
                file_size = os.path.getsize(os.path.join(root, file))
                file_time = os.path.getatime(os.path.join(root, file))
                size += file_size
                status.append({'file_atime': file_time,
                               'file_size': file_size,
                               'file_name': file})
        # 按照访问时间从小到大排序
        return size, status

    @classmethod
    def eliminate_cache(cls):
        """缓存文件夹超过5GB，则根据最后访问时间按LRU规则淘汰，直到文件夹大小小于2GB"""
        doc_size, status = cls.get_dir_size(NcfUtils.CACHE_FOLDER_DIR)
        if doc_size < cls.CACHE_SIZE:
            return
        doc_counter = 0
        status.sort(key=lambda x: x['file_atime'])
        while doc_size > cls.ELIMINATE_SIZE and doc_counter < len(status):
            oldest_status = status[doc_counter]
            os.remove(os.path.join(NcfUtils.CACHE_FOLDER_DIR, oldest_status['file_name']))
            doc_size -= oldest_status['file_size']
            doc_counter += 1


class NcfUtils:
    CACHE_FOLDER_DIR = os.path.join(settings.MEDIA_ROOT, 'cache_files', 'nc_to_tiff')
    DIMENSION_MATCH = {
        'time': ['datetime', 'time'],
        'depth': ['depth', 'level'],
        'longitude': ['lon', 'longitude'],
        'latitude': ['lat', 'latitude'],
    }
    TIMEUNITS = {
        'milliseconds': 1 / 1000,
        'seconds': 1,
        'minutes': 60,
        'hours': 60 * 60,
        'days': 60 * 60 * 24,
        'weeks': 60 * 60 * 24 * 7,
    }
    AVAILABLE_TIME_FORMAT = [
        '%Y-%m-%d %H:%M:%S',
        '%Y-%m-%dT%H:%M:%SZ',
        '%Y-%m-%d'
    ]
    REPLACE_VALUE = 9.9e36

    class Dim:
        """
        分别记录维度的备选列表、维度在文件中的次序、维度在文件中的命名、维度长度
        """
        def __init__(self, exists=False, index=None, name=None, size=None, value=None, units=None):
            self.exists = exists
            self.index = index
            self.name = name
            self.size = size
            self.value = value
            self.units = units

    class Var:
        """
        记录变量的信息
        """
        def __init__(self, index=None, name=None, dimensions=None, normalized_dimensions=None, long_name=None,
                     units=None, valid_min=None, valid_max=None):
            self.index = index
            self.name = name
            self.dimensions = dimensions
            self.normalized_dimensions = normalized_dimensions
            self.long_name = long_name
            self.units = units
            self.valid_min = valid_min
            self.valid_max = valid_max

    @classmethod
    def get_idx_from_sorted_list(cls, value, lst):
        mn, mx = min(lst), max(lst)
        assert mn <= value <= mx, f'Value {value} out of range [{mn}, {mx}].'
        for i, v in enumerate(lst):
            if value < v:
                return i
        return len(lst)

    @classmethod
    def try_get_attr(cls, obj, attr):
        if hasattr(obj, attr):
            return getattr(obj, attr)
        return None

    @classmethod
    def normalized_dimension(cls, dim):
        if dim is None:
            return None
        for key, value in cls.DIMENSION_MATCH.items():
            if dim.lower() in value:
                return key
        raise Exception(f'Invalid dimension {dim}.')

    @classmethod
    def parse_datetime(cls, str_time):
        for parse_format in cls.AVAILABLE_TIME_FORMAT:
            try:
                return datetime.datetime.strptime(str_time, parse_format)
            except ValueError as e:
                continue
        # return datetime.datetime.strptime('1970-01-01', '%Y-%m-%d')
        raise Exception(f'Invalid time format ({str_time}).')

    @classmethod
    def get_timestamp_and_timeunits(cls, time_since_str):
        split_time = time_since_str.split(' since ')
        time_units, since = split_time[0], split_time[-1]
        assert time_units in cls.TIMEUNITS.keys(), f'time units {time_units} is invalid.'
        since_datetime = cls.parse_datetime(since)
        since_timestamp = since_datetime.timestamp()
        return since_timestamp, time_units

    @classmethod
    def convert_timestamp_to_datetime(cls, timestamp):
        return datetime.datetime.fromtimestamp(timestamp)

    @classmethod
    def check_lat_lng_exists(cls, dimensions):
        lat, lng = False, False
        for dim in dimensions:
            normalized_dimension = cls.normalized_dimension(dim)
            if normalized_dimension == 'longitude':
                lng = True
            if normalized_dimension == 'latitude':
                lat = True
        return lat and lng

    @classmethod
    def convert_params_start_end_valid(cls, start, end, exists, size, name=None):
        if not exists:
            assert (start is None) and (end is None), f"Parameter {name} should not be included."
            start = end = 0

        else:
            if start is not None:
                assert 0 <= start < size, f"{name}_start ({start}) out of range [0, {size})."
            else:
                start = 0
            if end is not None:
                assert 0 <= end < size, f"{name}_start ({end}) out of range [0, {size})."
            else:
                end = size - 1

            assert start <= end, f'{name}_start ({start}) should be less than or equal to {name}_end ({end}).'
        return start, end

    @classmethod
    def convert_params_index_valid(cls, index, exists, size, name):
        if not exists:
            assert index is None, f'Parameter {name} should not be included.'

        if index is not None:
            assert 0 <= index < size, f"{name} ({index}) out of range [0, {size})."
        else:
            index = 0
        return index

    @classmethod
    def get_min_max_value(cls, data_array, replace_value):
        valid_pos = np.where(data_array != replace_value)
        valid_value = data_array[valid_pos]
        min_value, max_value = 0.0, 0.0
        if len(valid_value) > 0:
            min_value = valid_value.min()
            max_value = valid_value.max()
        return float(min_value), float(max_value)

    @classmethod
    def get_down_sampling_2d(cls, total_dim1, total_dim2, limit):
        total = total_dim1 * total_dim2
        if limit > total:
            return total_dim1, total_dim2

        ratio = math.sqrt(total / limit)
        down_sampled_dim1 = max(1, int(total_dim1 / ratio))
        down_sampled_dim1 = min(down_sampled_dim1, limit)
        down_sampled_dim2 = max(1, limit // down_sampled_dim1)
        return down_sampled_dim1, down_sampled_dim2

    @classmethod
    def get_down_sampling_range(cls, total_dim, down_sampling_dim):
        if down_sampling_dim == 1:
            return range(total_dim // 2, total_dim // 2 + 1)

        step = total_dim // (down_sampling_dim - 1)
        left = total_dim % step
        return range(left // 2, total_dim, step)

    @classmethod
    def initialize_tiff(cls, data_array, lon_list, lat_list, tiff_path, driver_name='GTiff', flush=True):
        lon_min, lon_max, lat_min, lat_max = lon_list.min(), lon_list.max(), lat_list.min(), lat_list.max()
        lon_res = (lon_max - lon_min) / (len(lon_list) - 1)
        lat_res = (lat_max - lat_min) / (len(lat_list) - 1)
        driver = gdal.GetDriverByName(driver_name)
        dest_tiff = driver.Create(tiff_path, len(lon_list), len(lat_list), 1, gdal.GDT_Float32,)
        dest_tiff.SetGeoTransform((lon_min, lon_res, 0, lat_min, 0, lat_res))  # 设置影像的显示范围
        dest_tiff.GetRasterBand(1).WriteArray(data_array)
        if flush:
            dest_tiff.FlushCache()  # 写入磁盘
            dest_tiff = None        # 关闭文件（否则不能读取）

    @classmethod
    def warp_tiff(cls, tiff_path, src_tiff=None, warp_epsg=4326,
                  tiled=True, compress='LZW', predictor=1, width=0, height=0):
        """ compress = 'LZW'(predictor) / 'Deflate'(predictor, currently best) / 'Packbits' """
        # srs = osr.SpatialReference()
        # srs.ImportFromEPSG(warp_epsg)
        warp_options = gdal.WarpOptions(
            # srcSRS=srs.ExportToWkt(),
            srcSRS=f'EPSG:{warp_epsg}',
            creationOptions=[
                'TILED=YES' if tiled else 'TILED=NO',
                f'COMPRESS={compress}' if compress is not None else '',
                f'PREDICTOR={predictor}'
            ],
            width=width,
            height=height,
        )
        temperate_tiff_path = tiff_path[:-5] + '_warp.tiff'
        dest_tiff = gdal.Warp(temperate_tiff_path, src_tiff if src_tiff is not None else tiff_path,
                              options=warp_options)
        os.remove(tiff_path)
        os.rename(temperate_tiff_path, tiff_path)
        return dest_tiff

    @classmethod
    def uuid4_short(cls, length=settings.UUID_SHORT_LENGTH):
        return uuid.uuid4().hex[:length]


class NcfCore(SKLECBaseCore):
    """ 重构 NcfCoreClass，将逐步迁移方法至该类 """

    def __init__(self, filepath):
        self.filepath = os.path.join(settings.MEDIA_ROOT, filepath)
        self.filename = os.path.split(self.filepath)[-1]
        self.dataset = netCDF4.Dataset(self.filepath)
        self.dimensions = self.dataset.dimensions
        self.variables = self.dataset.variables
        self.dimension_fields = {}
        self.variable_fields = {}

        self._init_dimension_fields()
        self._init_variable_fields()

    def _init_dimension_fields(self):
        for dim in NcfUtils.DIMENSION_MATCH.keys():
            self.dimension_fields[dim] = NcfUtils.Dim()
        for i, ds_dim in enumerate(self.dimensions):
            # some dimensions do not have data, ignore.
            if ds_dim not in self.variables.keys():
                continue
            normalized_dimension = NcfUtils.normalized_dimension(dim=ds_dim)
            if normalized_dimension in self.dimension_fields.keys():
                self.dimension_fields[normalized_dimension] = NcfUtils.Dim(
                    exists=True, index=i,
                    name=NcfUtils.try_get_attr(self.dimensions.get(ds_dim), 'name'),
                    size=NcfUtils.try_get_attr(self.dimensions.get(ds_dim), 'size'),
                    units=NcfUtils.try_get_attr(self.variables.get(ds_dim), 'units'),
                    value=self.variables.get(ds_dim),
                )
            else:
                raise Exception(f'Initialize failed. Dimension {ds_dim} is invalid.')
        if self.dimension_fields.get('time').exists:
            self.since_timestamp, self.time_units = NcfUtils.get_timestamp_and_timeunits(
                getattr(self.dimension_fields.get('time'), 'units'))
        else:
            self.since_timestamp, self.time_units = None, None

    def _init_variable_fields(self):
        for i, ds_var in enumerate(self.variables):
            self.variable_fields.update({
                ds_var: NcfUtils.Var(
                    index=i, name=ds_var,
                    dimensions=NcfUtils.try_get_attr(self.variables.get(ds_var), 'dimensions'),
                    normalized_dimensions=[NcfUtils.normalized_dimension(dim)
                                           for dim in NcfUtils.try_get_attr(self.variables.get(ds_var), 'dimensions')],
                    long_name=NcfUtils.try_get_attr(self.variables.get(ds_var), 'long_name'),
                    units=NcfUtils.try_get_attr(self.variables.get(ds_var), 'units'),
                    valid_min=NcfUtils.try_get_attr(self.variables.get(ds_var), 'valid_min'),
                    valid_max=NcfUtils.try_get_attr(self.variables.get(ds_var), 'valid_max'),
                )
            })

    def check_latlng(self):
        """
        检查文件的维度中是否包含经纬度
        """
        return self.dimension_fields['longitude'].exists and self.dimension_fields['latitude'].exists

    def get_1d_vq_data(self, label=None, longitude_index=None, latitude_index=None, time_index=None, depth_index=None,
                       fill_value=None, replace_value=None):
        slice_dict = {
            'longitude': longitude_index,
            'latitude': latitude_index,
            'time': time_index if time_index is not None else Ellipsis,
            'depth': depth_index if depth_index is not None else Ellipsis,
        }

        slices = []
        for dimension in self.variables.get(label).dimensions:
            normalized_dimension = NcfUtils.normalized_dimension(dimension)
            slices.append(slice_dict.get(normalized_dimension))
        data_array = np.asarray(self.variables.get(label)[slices]).astype(np.float)

        if (fill_value is not None) and (replace_value is not None):
            fill_pos = np.where(data_array == fill_value)
            data_array[fill_pos] = replace_value
        return data_array

    def get_date_data_list(self):
        date_data = [NcfUtils.convert_timestamp_to_datetime(self.since_timestamp +
                                                            value * NcfUtils.TIMEUNITS.get(self.time_units))
                     for value in self.dimension_fields.get('time').value[:]]
        return date_data

    def get_vqdata_content(self, label=None, longitude_value=None, latitude_value=None, depth_value=None):
        # 深度参数暂时弃用，固定为最浅层
        longitude_index = NcfUtils.get_idx_from_sorted_list(longitude_value,
                                                            self.dimension_fields.get('longitude').value[:].tolist())
        latitude_index = NcfUtils.get_idx_from_sorted_list(latitude_value,
                                                           self.dimension_fields.get('latitude').value[:].tolist())
        fill_value = float(getattr(self.variables.get(label), '_FillValue'))
        replace_value = 0
        data_array = self.get_1d_vq_data(label, longitude_index=longitude_index, latitude_index=latitude_index,
                                         time_index=None, depth_index=0,
                                         fill_value=fill_value, replace_value=replace_value)
        return {
            'date_data': self.get_date_data_list(),
            'stream_data': data_array.tolist(),
        }

    def get_2d_area_data(self, label=None, longitude_start=None, longitude_end=None,
                         latitude_start=None, latitude_end=None,
                         time_index=None, depth_index=None, fill_value=None, replace_value=None):
        """[start, end] 左闭右闭"""
        slice_dict = {
            'longitude': slice(longitude_start, longitude_end + 1),
            'latitude': slice(latitude_start, latitude_end + 1),
            'time': time_index,
            'depth': depth_index,
        }

        slices = []
        for dimension in self.variables.get(label).dimensions:
            normalized_dimension = NcfUtils.normalized_dimension(dimension)
            slices.append(slice_dict.get(normalized_dimension))
        data_array = np.asarray(self.variables.get(label)[slices]).astype(np.float)

        # adjust to [latitude, longitude]
        if self.variable_fields.get(label).normalized_dimensions.index('latitude') > \
                self.variable_fields.get(label).normalized_dimensions.index('longitude'):
            data_array = data_array.transpose((1, 0))

        if (fill_value is not None) and (replace_value is not None):
            fill_pos = np.where(data_array == fill_value)
            data_array[fill_pos] = replace_value
        return data_array

    def generate_tiff(self, label,
                      longitude_start=None, longitude_end=None,
                      latitude_start=None, latitude_end=None,
                      time_index=None, depth_index=None,
                      res_limit=None):
        fill_value = float(getattr(self.variables.get(label), '_FillValue'))
        replace_value = NcfUtils.REPLACE_VALUE
        data_array = self.get_2d_area_data(label=label,
                                           longitude_start=longitude_start, longitude_end=longitude_end,
                                           latitude_start=latitude_start, latitude_end=latitude_end,
                                           time_index=time_index, depth_index=depth_index,
                                           fill_value=fill_value, replace_value=replace_value)
        lon_list = self.dimension_fields.get('longitude').value[slice(longitude_start, longitude_end + 1)]
        lat_list = self.dimension_fields.get('latitude').value[slice(latitude_start, latitude_end + 1)]
        tiff_name = "{}.tiff".format(NcfUtils.uuid4_short())
        tiff_path = os.path.join(NcfUtils.CACHE_FOLDER_DIR, tiff_name)
        NcfUtils.initialize_tiff(data_array=data_array,
                                 lon_list=lon_list, lat_list=lat_list,
                                 tiff_path=tiff_path, driver_name='GTiff', flush=True)

        if res_limit is not None:
            down_sampling_width, down_sampling_height = NcfUtils.get_down_sampling_2d(total_dim1=len(lon_list),
                                                                                      total_dim2=len(lat_list),
                                                                                      limit=res_limit)
        else:
            down_sampling_width, down_sampling_height = 0, 0
        NcfUtils.warp_tiff(tiff_path=tiff_path, warp_epsg=4326,
                           tiled=True, compress='Deflate', predictor=1,
                           width=down_sampling_width, height=down_sampling_height)

        min_value, max_value = NcfUtils.get_min_max_value(data_array=data_array, replace_value=replace_value)

        if (self.since_timestamp is not None) and (self.time_units is not None):
            display_name = '时间: ' + NcfUtils.convert_timestamp_to_datetime(
                self.since_timestamp +
                NcfUtils.TIMEUNITS.get(self.time_units) * self.dimension_fields.get('time').value[time_index]
            ).strftime('%Y-%m-%d %T')
        else:
            display_name = 'GenericDisplayName'
        tiff_meta = {
            'file': tiff_path,
            'file_path': tiff_path,
            'file_name': tiff_name,
            'file_size': os.path.getsize(tiff_path),
            'label': label,
            'longitude_start': longitude_start,
            'longitude_end': longitude_end,
            'latitude_start': latitude_start,
            'latitude_end': latitude_end,
            'time_index': time_index,
            'depth_index': depth_index,
            'fill_value': fill_value,
            'replace_value': replace_value,
            'min_value': min_value,
            'max_value': max_value,
            'display_name': display_name,
            'res_limit': res_limit,
        }
        return tiff_meta

    def generate_ncf_content(self, label,
                             longitude_start=None, longitude_end=None,
                             latitude_start=None, latitude_end=None,
                             time_start=None, time_end=None,
                             depth_start=None, depth_end=None,
                             res_limit=None, filenum_limit=None,
                             *args, **kwargs):
        assert label in self.variables.keys(), f'Label {label} is not included in file.'
        assert NcfUtils.check_lat_lng_exists(self.variables.get(label).dimensions), \
            f'Dimensions of label {label} are invalid.'
        if res_limit is not None:
            assert res_limit > 0, f'res_limit ({res_limit}) invalid.'
        if filenum_limit is not None:
            assert filenum_limit > 0, f'filenum_limit ({filenum_limit}) invalid.'

        longitude_start, longitude_end = \
            NcfUtils.convert_params_start_end_valid(start=longitude_start,
                                                    end=longitude_end,
                                                    exists=self.dimension_fields.get('longitude').exists,
                                                    size=self.dimension_fields.get('longitude').size,
                                                    name='longitude')
        latitude_start, latitude_end = \
            NcfUtils.convert_params_start_end_valid(start=latitude_start,
                                                    end=latitude_end,
                                                    exists=self.dimension_fields.get('latitude').exists,
                                                    size=self.dimension_fields.get('latitude').size,
                                                    name='latitude')
        time_start, time_end = \
            NcfUtils.convert_params_start_end_valid(start=time_start,
                                                    end=time_end,
                                                    exists=self.dimension_fields.get('time').exists,
                                                    size=self.dimension_fields.get('time').size,
                                                    name='time')
        depth_start, depth_end = \
            NcfUtils.convert_params_start_end_valid(start=depth_start,
                                                    end=depth_end,
                                                    exists=self.dimension_fields.get('depth').exists,
                                                    size=self.dimension_fields.get('depth').size,
                                                    name='depth')

        time_length = time_end - time_start + 1
        depth_length = depth_end - depth_start + 1
        if filenum_limit is not None:
            down_sampling_time, down_sampling_depth = NcfUtils.get_down_sampling_2d(total_dim1=time_length,
                                                                                    total_dim2=depth_length,
                                                                                    limit=filenum_limit)
        else:
            down_sampling_time, down_sampling_depth = time_length, depth_length

        NcfCacheManager.eliminate_cache()
        ncf_content = []
        for time_index in NcfUtils.get_down_sampling_range(time_length, down_sampling_time):
            for depth_index in NcfUtils.get_down_sampling_range(depth_length, down_sampling_depth):
                tiff_info = self.generate_tiff(
                    label=label,
                    longitude_start=longitude_start, longitude_end=longitude_end,
                    latitude_start=latitude_start, latitude_end=latitude_end,
                    time_index=time_index if self.dimension_fields.get('time').exists else None,
                    depth_index=depth_index if self.dimension_fields.get('depth').exists else None,
                    res_limit=res_limit
                )
                ncf_content.append(tiff_info)
        return ncf_content

    def generate_thumbnail_for_label(self, label):
        pass

    def save_visfile_and_rawfile_to_dataset(self, dataset_uuid) -> (str, str):
        """
        为指定 dataset 生成 visfile 和 rawfile
        :param dataset_uuid: 指定 dataset 的 uuid
        :return: (rawfile.uuid, visfile.uuid)
        """
        # remain to be reconstructed...
        dataset = Dataset.objects.get(uuid=dataset_uuid)
        fobj = open(self.filepath, 'rb')
        meta = {}
        dimensions = []
        variables = []
        core_ncf = NcfCoreClass(self.filepath)

        for ds_dim in self.dimensions.keys():
            # 某些字段需要特殊处理，如 'level'
            if not (ds_dim in self.variables.keys()):
                continue

            dimension_type = None
            for dim in self.dimension_fields:
                if ds_dim in NcfUtils.DIMENSION_MATCH[dim]:
                    dimension_type = dim
            dim_dict = {
                'dimension_name': ds_dim,
                'dimension_length': self.dimensions[ds_dim].size,
                'dimension_type': dimension_type,
                'dimension_values': np.asarray(self.dataset[ds_dim][:], dtype=np.float32).tolist(),
                # 'dimension_units': self.dimensions[ds_dim].units,
            }
            dimensions.append(dim_dict)

        for variable in self.variables.keys():
            if variable in self.dataset.dimensions.keys(): continue
            var_dict = {}
            var_dict['variable_name'] = variable
            if hasattr(self.dataset[variable], 'units'):
                var_dict['variable_units'] = self.dataset[variable].units
            else:
                var_dict['variable_units'] = ''
            if hasattr(self.dataset[variable], 'long_name'):
                var_dict['variable_longname'] = self.dataset[variable].long_name
            else:
                var_dict['variable_longname'] = ''
            var_dict['variable_dimensions'] = []
            for var_dim in self.dataset[variable].dimensions:
                dimension_type = None
                for dim in self.dimension_fields:
                    if var_dim in NcfUtils.DIMENSION_MATCH[dim]:
                        dimension_type = dim
                var_dict['variable_dimensions'].append(dimension_type)
            preview_info = core_ncf.gen_preview(variable, uuid.uuid4().hex[:20])
            url = preview_info['filepath'].replace(settings.MEDIA_ROOT, 'media')
            preview_info['file'] = url
            del preview_info['filepath']
            var_dict['preview_info'] = preview_info
            variables.append(var_dict)

        meta['dimensions'] = dimensions
        meta['variables'] = variables
        visfile = VisFile(dataset=dataset,
                          format=VisFile.FileFormat.NCF,
                          file=File(fobj, name=self.filename),
                          file_name=os.path.basename(self.filepath),
                          file_size=os.path.getsize(self.filepath),
                          meta_data=meta, )

        rawfile = RawFile(dataset=dataset,
                          file_name=os.path.basename(self.filepath),
                          file_size=os.path.getsize(self.filepath),
                          file=None,
                          file_same_as_vis=True,
                          visfile=visfile, )

        visfile.save()
        rawfile.save()
        return rawfile.uuid, visfile.uuid


class NcfCoreClass(SKLECBaseCore):

    # TARGET_VIS_LENGTH = 2000

    def __init__(self, file_path):
        self.file_path = file_path
        self.file = netCDF4.Dataset(file_path)  # type: ignore
        self.name = os.path.basename(file_path)
        self.channels = list(self.file.variables.keys())
        self.string_for_datetime = ['datetime', 'time']
        self.string_for_depth = ['depth', 'Depth']
        self.string_for_longitude = ['lon', 'Lon', 'longitude', 'Longitude']
        self.string_for_latitude = ['lat', 'Lat', 'latitude', 'Latitude']
        self.dimension_list = ['datetime', 'depth', 'longitude', 'latitude']
        self.base_timestamp = time.mktime(time.strptime('1990-01-01', '%Y-%m-%d'))
        self.datetime_dim, self.depth_dim, self.longitude_dim, self.latitude_dim = -1, -1, -1, -1
        self.datetime, self.depth, self.longitude, self.latitude = None, None, None, None
        for i, dim in enumerate(self.file.dimensions):
            if dim in self.string_for_datetime:
                self.datetime_dim = i
                self.datetime = self.file[dim]
            if dim in self.string_for_depth:
                self.depth_dim = i
                self.depth = self.file[dim]
            if dim in self.string_for_longitude:
                self.longitude_dim = i
                self.longitude = self.file[dim]
            if dim in self.string_for_latitude:
                self.latitude_dim = i
                self.latitude = self.file[dim]

        # self.processed_data = None
        # self.dimensions = self.file.dimensions
        # self.variables = self.file.variables
        # Channel_label: Channel_name
        # self.channel_name = {'timestamp': 'Time'}
        # for channel in self.channels:
        #     if channel in self.file.channels:
        #         self.channel_name[channel] = self.file.channels[channel].name

        self.sample_cache = {}
        # print(self)

    def get_channels(self):
        return self.channels

    def _find_in_cache_folder(self, file_name):
        for root, dirs, files in os.walk(CACHE_FOLDER_DIR):
            for file in files:
                if (not file.endswith('trans.tiff')):
                    continue
                if file.startswith(file_name):
                    # 重新设置访问时间
                    os.utime(os.path.join(root, file), times=None)
                    return file

        return None


    def gen_preview(self, channel_label, uuid):
        params = {}
        params['res_limit'] = 99999999
        params['uuid'] = uuid
        label = channel_label
        channel_dimensions = self.file[label].dimensions
        data = np.array(self.file.variables[label]).astype(np.float64)
        datetime_field, depth_field, longitude_field, latitude_field = '', '', '', ''
        datetime_idx, depth_idx, longitude_idx, latitude_idx = -1, -1, -1, -1
        i = 0
        # 找出四个维度对应的index
        for dim in channel_dimensions:
            # print('a', dim)
            if dim in self.string_for_datetime:
                datetime_field = dim
                datetime_idx = i
            elif dim in self.string_for_depth:
                depth_field = dim
                depth_idx = i
            elif dim in self.string_for_longitude:
                longitude_field = dim
                longitude_idx = i
            elif dim in self.string_for_latitude:
                latitude_field = dim
                latitude_idx = i
            i += 1
        params['longitude_start'] = 0
        params['longitude_end'] = data.shape[longitude_idx]
        params['latitude_start'] = 0
        params['latitude_end'] = data.shape[latitude_idx]
        params['datetime_start'] = params['datetime_end'] = 0
        params['depth_start'] = params['depth_end'] = 0
        # print(params)
        # 不存在datetime or depth 则进行升维操作
        if datetime_idx == -1:
            datetime_idx = len(data.shape)
            data = np.expand_dims(data, axis=len(data.shape))
            params['datetime_start'] = params['datetime_end'] = 0
        if depth_idx == -1:
            depth_idx = len(data.shape)
            data = np.expand_dims(data, axis=len(data.shape))
            params['depth_start'] = params['depth_end'] = 0

        # 维度变换 调整顺序为[datetime,depth,latitude,longitude]
        transpose_list = [datetime_idx, depth_idx, latitude_idx, longitude_idx]
        # print(transpose_list)
        data = np.transpose(data, transpose_list)
        # 计算偏置和系数
        # add_offset = self.file.variables[label].add_offset
        # scale_factor = self.file.variables[label].scale_factor
        # data = data * scale_factor + add_offset
        if hasattr(self.file.variables[label], '_FillValue'):
            fill_value = self.file.variables[label]._FillValue
        else:
            fill_value = -10000
        Lon = self.file.variables[longitude_field][params['longitude_start']: params['longitude_end'] + 1]
        Lat = self.file.variables[latitude_field][params['latitude_start']: params['latitude_end'] + 1]

        # 影像的左上角和右下角坐标
        LonMin, LatMax, LonMax, LatMin = [
            Lon.min(), Lat.max(), Lon.max(), Lat.min()]

        # 分辨率计算
        N_Lat = len(Lat)
        N_Lon = len(Lon)
        Lon_Res = (LonMax - LonMin) / (float(N_Lon) - 1)
        Lat_Res = (LatMax - LatMin) / (float(N_Lat) - 1)

        tiff_meta_list = []
        total_datetime = params['datetime_end'] - params['datetime_start'] + 1
        total_depth = params['depth_end'] - params['depth_start'] + 1
        total_filenum = total_datetime * total_depth
        # 计算降采样后datetime和depth分别多少维
        # params['filenum_limit'] = 10
        params['filenum_limit'] = 1
        if params['filenum_limit'] > total_filenum:
            datetime_num = total_datetime
            depth_num = total_depth
            datetime_step = depth_step = 1
        else:
            ratio = math.sqrt(total_filenum / params['filenum_limit'])
            datetime_num = max(1, int(total_datetime / ratio))
            datetime_num = min(datetime_num, params['filenum_limit'])
            depth_num = max(1, params['filenum_limit'] // datetime_num)
            datetime_step = total_datetime / datetime_num
            depth_step = total_depth / depth_num

        for datetime_idx in range(datetime_num):
            datetime = params['datetime_start'] + int(datetime_idx * datetime_step)
            # in range(params['datetime_start'], params['datetime_end'] + 1, step_date):
            for depth_idx in range(depth_num):
                # in range(params['depth_start'], params['depth_end'] + 1, step_depth):
                depth = params['depth_start'] + int(depth_idx * depth_step)
                params_str = "preview_{}_{}".format(
                    params['uuid'],
                    label)
                full_name = self._find_in_cache_folder(params_str)
                split_data = data[datetime,
                             depth,
                             params['latitude_start']: params['latitude_end'] + 1,
                             params['longitude_start']: params['longitude_end'] + 1,
                             ]
                tmp_data = split_data.reshape(-1)
                fill_pos = np.where(tmp_data == fill_value)
                # fill_pos = np.where(tmp_data= fill_value)
                processed_data = np.delete(tmp_data, fill_pos)
                if len(processed_data) > 0:
                    min_value = processed_data.min()
                    max_value = processed_data.max()
                else:
                    min_value = 0.0
                    max_value = 0.0

                out_tif_name = params_str + \
                               "_mn={:.6f}_mx={:.6f}.tiff".format(
                                   min_value, max_value)
                tmp_tif_path = os.path.join(PREVIEW_FOLDER_DIR, out_tif_name)
                warp_tif_path = tmp_tif_path[:-5] + '_warped.tiff'
                translate_tif_path = tmp_tif_path[:-5] + '_trans.tiff'
                translate_tif_name = out_tif_name[:-5] + '_trans.tiff'

                split_data[np.where(split_data == fill_value)] = 9.9e36
                # 创建 .tif 文件
                # 要在切片之后再翻转
                # split_data = np.flip(split_data, axis=0)

                driver = gdal.GetDriverByName('GTiff')

                tmp_tif_path = os.path.join(PREVIEW_FOLDER_DIR, out_tif_name)
                out_tif = driver.Create(
                    tmp_tif_path, N_Lon, N_Lat, 1, gdal.GDT_Float32)
                # 设置影像的显示范围 这样写不用翻转即可
                geotransform = (LonMin, Lon_Res, 0, LatMin, 0, Lat_Res)
                out_tif.SetGeoTransform(geotransform)
                out_tif.GetRasterBand(1).WriteArray(
                    split_data)
                out_tif.FlushCache()  # 将数据写入硬盘
                out_tif = None  # 注意必须关闭tif文件

                # 获取地理坐标系统信息，用于选取需要的地理坐标系统
                srs = osr.SpatialReference()
                # 定义输出的坐标系为"WGS 84"，AUTHORITY["EPSG","4326"]
                srs.ImportFromEPSG(4326)

                warp_options = gdal.WarpOptions(format='Gtiff',
                                                srcSRS=srs.ExportToWkt(),
                                                # srcSRS='EPSG:4326'
                                                )
                gdal.Warp(warp_tif_path, tmp_tif_path,
                          format='Gtiff', options=warp_options)
                total_width = params['longitude_end'] - params['longitude_start'] + 1
                total_height = params['latitude_end'] - params['latitude_start'] + 1
                total_res = total_width * total_height

                if params['res_limit'] > total_res:
                    out_width = total_width
                    out_height = total_height
                else:
                    ratio = math.sqrt(total_res / params['res_limit'])
                    out_width = max(1, int(total_width / ratio))
                    out_width = min(out_width, params['res_limit'])
                    out_height = max(1, params['res_limit'] // out_width)
                translate_options = gdal.TranslateOptions(format='GTiff',
                                                          creationOptions=[
                                                              'TILED=YES', 'COMPRESS=LZW'],
                                                          width=out_width,
                                                          height=out_height,
                                                          )
                gdal.Translate(translate_tif_path, warp_tif_path,
                               options=translate_options)
                tiff_meta = {
                    'filepath': translate_tif_path,
                    'file_size': os.path.getsize(translate_tif_path),
                    'file_name': translate_tif_name,
                    'datetime': datetime,
                    'depth': depth,
                    'longitude_start': params['longitude_start'],
                    'longitude_end': params['longitude_end'],
                    'latitude_start': params['latitude_start'],
                    'latitude_end': params['latitude_end'],
                    'label': label,
                    'min_value': min_value,
                    'max_value': max_value
                }
            tiff_meta_list.append(tiff_meta)
        return tiff_meta_list[0]

    def close(self):
        self.file.close()


class NcfFileUploadClass():
    def __init__(self, params, file_content, file_name):
        self.params = params
        self.file_content = file_content
        self.file_name = file_name

        self.dataset = None
        self.save_path = None
        self.nc = None
        self.string_for_datetime = ['datetime', 'time']
        self.string_for_longitude = ['lon', 'Lon', 'longitude', 'Longitude']
        self.string_for_latitude = ['lat', 'Lat', 'latitude', 'Latitude']
        self.string_for_depth = ['depth', 'Depth']

    def _save_vis_and_raw(self):
        fobj = open(self.save_path, 'rb')
        nc = self.nc

        meta = {}
        dimensions = []
        variables = []
        core_ncf = NcfCoreClass(self.save_path)
        for dim in nc.dimensions.keys():
            # 'level' 字段需要特殊处理
            if not (dim in nc.variables.keys()):
                continue
            dim_dict = {}
            dim_dict['dimension_name'] = dim
            dim_dict['dimension_length'] = nc.dimensions[dim].size
            dimension_type = ''
            if (dim in self.string_for_datetime):
                dimension_type = 'datetime'
            elif (dim in self.string_for_longitude):
                dimension_type = 'longitude'
            elif (dim in self.string_for_latitude):
                dimension_type = 'latitude'
            elif (dim in self.string_for_depth):
                dimension_type = 'depth'
            dim_dict['dimension_type'] = dimension_type
            dim_dict['dimension_values'] = np.asarray(nc[dim][:], dtype=np.float32).tolist()
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
                if (dim in self.string_for_datetime):
                    dimension_type = 'datetime'
                elif (dim in self.string_for_longitude):
                    dimension_type = 'longitude'
                elif (dim in self.string_for_latitude):
                    dimension_type = 'latitude'
                elif (dim in self.string_for_depth):
                    dimension_type = 'depth'
                var_dict['variable_dimensions'].append(dimension_type)
            preview_info = core_ncf.gen_preview(variable, uuid.uuid4().hex[:20])
            url = preview_info['filepath'].replace(settings.MEDIA_ROOT, 'media')
            preview_info['file'] = url
            del preview_info['filepath']
            var_dict['preview_info'] = preview_info
            print(preview_info)
            variables.append(var_dict)

        meta['dimensions'] = dimensions
        meta['variables'] = variables
        visfile = VisFile(dataset=self.dataset,
                          format=VisFile.FileFormat.NCF,
                          file=File(fobj, name=self.file_name),
                          file_name=os.path.basename(self.save_path),
                          file_size=os.path.getsize(self.save_path) // 1024,
                          meta_data=meta,
                          # default_sample_count=min(rsk.npsamples().shape[0], 100000),
                          )
        visfile.save()

        rawfile = RawFile(dataset=self.dataset,
                          file_name=os.path.basename(self.save_path),
                          file_size=os.path.getsize(self.save_path) // 1024,
                          file=None,
                          file_same_as_vis=True,
                          visfile=visfile, )
        rawfile.save()

        channels = []
        for c in nc.variables.keys():
            channel = nc[c]
            channel_meta = {}
            datachannel = DataChannel(visfile=visfile,
                                      name=channel.long_name if hasattr(channel, 'long_name') else '',
                                      label=c,
                                      unit=channel.units if hasattr(channel, 'units') else '',
                                      # datetime_start=startdate[0],
                                      # datetime_end=enddate[0],
                                      shape=str(channel.shape),
                                      meta_data=channel_meta
                                      )
            channels.append(datachannel)
            datachannel.save()

    def _check_dims(self):
        has_lat = 0
        has_lon = 0
        for dim in self.nc.dimensions.keys():
            # 'level' 字段需要特殊处理
            if not (dim in self.nc.variables.keys()):
                continue

            elif (dim in self.string_for_longitude):
                has_lon = 1
            elif (dim in self.string_for_latitude):
                has_lat = 1
        return (has_lat and has_lon)

    def create(self, ):
        self.file_same_as_vis = params['file_same_as_vis']
        path = os.path.join(settings.MEDIA_ROOT, 'datasets', 'uploads', self.file_name)
        with open(path, 'wb') as f:
            f.write(self.file_content)
            f.close()
        self.save_path = path
        self.nc = netCDF4.Dataset(path)

        if (self.file_same_as_vis):

            if not self._check_dims():
                return 'fail'
            self.dataset = Dataset.objects.get(uuid=params['uuid'])
            self._save_vis_and_raw()
            return 'success'
        else:
            rawfile = RawFile(dataset=self.dataset,
                              file_name=os.path.basename(self.save_path),
                              file_size=os.path.getsize(self.save_path) // 1024,
                              file=None,
                              file_same_as_vis=True, )
            rawfile.save()
            return 'success'
