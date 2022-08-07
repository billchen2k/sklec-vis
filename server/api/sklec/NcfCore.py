import os
import math
import numpy as np
import netCDF4
from api.sklec.SKLECBaseCore import SKLECBaseCore
from django.core.files import File
from osgeo import gdal, osr
from sklecvis import settings
import subprocess
import re
import uuid
from collections import defaultdict
from api.models import *
ROOT_DIR = os.path.relpath(os.path.join(os.path.dirname(__file__), '..'))
CACHE_FOLDER_DIR = os.path.join(
    settings.MEDIA_ROOT, 'cache_files', 'nc_to_tiff')

PREVIEW_FOLDER_DIR = os.path.join(
    settings.MEDIA_ROOT, 'previews', 'nc_to_tiff'
)

class NcfCoreException:
    pass

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

    # def get_all_channel_data(self, **kwargs):
    #     res = {}
    #     # res = {'Time': []}
    #     # channel_label_to_output_name = {'timestamp': 'Time'}
    #     for channel in self.channels:
    #         # channel_label_to_output_name[channel] = f'{self.channel_name[channel]} ({channel})'
    #         # res[channel_label_to_output_name[channel]] = []
    #         channel_data = self.file[channel][:]
    #         np_1d_data = np.asarray(channel_data).tolist()
    #         res[channel] = np_1d_data
    #     return res

    '''

    '''

    def _exec_gdal_inplace(self, cmd: str, file: str):
        full_cmd = f'{cmd.strip()} {file} {file}.tmp.tiff'
        print(f'Running {full_cmd}')
        subprocess.run(full_cmd, shell=True)
        os.remove(file)
        os.rename(f'{file}.tmp.tiff', file)

    def _get_min_max_value_from_full_name(self, full_name):
        idx_mn = int(full_name.find('_mn'))
        idx_mx = full_name.find('_mx')
        idx_trans = full_name.find('_trans')
        partial_str = full_name[idx_mn: idx_trans]

        x = re.findall(r'(-?\d+\.\d+)', partial_str)
        return float(x[0]), float(x[1])

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

    def _get_doc_real_size(self, p_doc):
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
        status.sort(key=lambda x: x['file_atime'])
        return size, status

    def _del_files(self, dir_path):
        # os.walk会得到dir_path下各个后代文件夹和其中的文件的三元组列表，顺序自内而外排列，
        for root, dirs, files in os.walk(dir_path, topdown=False):
            # 第一步：删除文件
            for name in files:
                os.remove(os.path.join(root, name))  # 删除文件
            # 第二步：删除空文件夹
            for name in dirs:
                os.rmdir(os.path.join(root, name))  # 删除一个空目录

    def _preprocess_data(self, label):
        channel_dimensions = self.file[label].dimensions
        data = self.file.variables[label]
        # data = np.asarray(self.file.variables[label]).astype(np.float64)
        datetime_field, depth_field, longitude_field, latitude_field = '', '', '', ''
        datetime_idx, depth_idx, longitude_idx, latitude_idx = -1, -1, -1, -1
        # 找出四个维度对应的index
        for i, dim in enumerate(channel_dimensions):
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
        # 不存在datetime or depth 则进行升维操作
        if datetime_idx == -1:
            datetime_idx = len(data.shape)
            data = np.expand_dims(data, axis=len(data.shape))
        if depth_idx == -1:
            depth_idx = len(data.shape)
            data = np.expand_dims(data, axis=len(data.shape))
        #
        # # 维度变换 调整顺序为[datetime,depth,latitude,longitude]
        transpose_list = [datetime_idx, depth_idx, latitude_idx, longitude_idx]
        data = np.transpose(data, transpose_list)
        return data
    def _get_idx_from_list(self, value, lst):
        mn = min(lst)
        mx = max(lst)
        if (value < mn or value > mx):
            return -1
        for i, v in enumerate(lst):
            if value < v:
                return i

    def get_vq_datastream(self, params):
        lat_value = float(params['lat'])
        lng_value = float(params['lng'])
        dpt_value = float(params['dpt'])
        lat = self._get_idx_from_list(lat_value, self.latitude[:].tolist())
        lng = self._get_idx_from_list(lng_value, self.longitude[:].tolist())
        if lat == -1:
            raise Exception('lat error(out of range).')
        if lng == -1:
            raise Exception('lng error(out of range).')
        if self.depth is not None:
            dpt = self._get_idx_from_list(dpt_value, self.depth[:].tolist())
        else:
            dpt = 0
        label = params['label']
        ret = {}

        channel_dimensions = self.file[label].dimensions
        variable: netCDF4.Variable = self.file.variables[label]

        datetime_field, depth_field, longitude_field, latitude_field = '', '', '', ''
        datetime_idx, depth_idx, longitude_idx, latitude_idx = -1, -1, -1, -1
        for i, dim in enumerate(channel_dimensions):
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

        if (datetime_idx == -1):
            raise Exception('Time dimension does not exist.')
        if (latitude_idx == -1):
            raise Exception('Latitude dimension does not exist.')
        if (longitude_idx == -1):
            raise Exception('Longitude dimension does not exist.')

        ret['date_data'] = np.array(self.file[datetime_field][:]).astype(np.float64).tolist()

        idx_params = [0] * 4
        for i in range(3):
            if (latitude_idx == i):
                idx_params[i] = lat
            if (longitude_idx == i):
                idx_params[i] = lng
            if (depth_idx == i):
                idx_params[i] = dpt
            if (datetime_idx == i):
                idx_params[i] = Ellipsis

        if (len(channel_dimensions) == 3):
            stream_data = variable[idx_params[0], idx_params[1], idx_params[2]]
        elif (len(channel_dimensions) == 4):
            stream_data = variable[idx_params[0], idx_params[1], idx_params[2], idx_params[3]]
        else:
            raise 'Length of channel dimensions must be [3, 4].'

        if hasattr(self.file.variables[label], '_FillValue'):
            fill_value = self.file.variables[label]._FillValue
        else:
            fill_value = -10000

        stream_data = np.asarray(stream_data).astype(np.float32)

        stream_data[np.where(stream_data == fill_value)] = 0
        ret['stream_data'] = stream_data.tolist()

        ret['lat_idx'] = lat
        ret['lng_idx'] = lng
        # ret['dim_lat'] = self.latitude[:].tolist()
        # ret['dim_lng'] = self.longitude[:].tolist()
        return ret

    def get_channel_data_split(self, params):
        # doc_size = get_doc_real_size(CACHE_FOLDER_DIR)
        # # 文件夹超过100MB 清空
        # if doc_size / 1024 / 1024 > 100:
        #     del_files(CACHE_FOLDER_DIR)

        # 缓存文件夹超过5GB，则根据最后访问时间按LRU规则淘汰，直到文件夹大小小于5GB
        doc_size, status = self._get_doc_real_size(CACHE_FOLDER_DIR)
        doc_counter = 0
        while (doc_size / 1024 / 1024 / 1024 > 5 and doc_counter < len(status)):
            oldest_status = status[doc_counter]
            try:
                os.remove(os.path.join(CACHE_FOLDER_DIR,
                          oldest_status['file_name']))
                doc_size -= oldest_status['file_size']
            except Exception as e:
                print("except:", e)
            doc_counter += 1

        label = params['channel_label']
        channel_dimensions = self.file[label].dimensions
        data = np.array(self.file.variables[label]).astype(np.float64)
        datetime_field, depth_field, longitude_field, latitude_field = '', '', '', ''
        datetime_idx, depth_idx, longitude_idx, latitude_idx = -1, -1, -1, -1
        i = 0
        # 找出四个维度对应的index
        for dim in channel_dimensions:
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
        Lon_Res = (LonMax - LonMin) / (float(N_Lon)-1)
        Lat_Res = (LatMax - LatMin) / (float(N_Lat)-1)

        tiff_meta_list = []
        total_datetime = params['datetime_end'] - params['datetime_start'] + 1
        total_depth = params['depth_end'] - params['depth_start'] + 1
        total_filenum = total_datetime * total_depth
        # 计算降采样后datetime和depth分别多少维
        # params['filenum_limit'] = 10
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
                params_str = "{}_dt={}_dp={}_lon={}_{}_lat={}_{}_lb={}".format(
                    params['uuid'],
                    datetime,
                    depth,
                    params['longitude_start'], params['longitude_end'],
                    params['latitude_start'], params['latitude_end'],
                    label)
                full_name = self._find_in_cache_folder(params_str)
                if 0 and (full_name is not None):
                    full_path = os.path.join(CACHE_FOLDER_DIR, full_name)
                    min_value, max_value = self._get_min_max_value_from_full_name(
                        full_name)
                    tiff_meta = {
                        'filepath': full_path,
                        'file_size': os.path.getsize(full_path),
                        'file_name': full_name,
                        'datetime': datetime,
                        'datetime_start': datetime,
                        'depth': depth,
                        'longitude_start': params['longitude_start'],
                        'longitude_end': params['longitude_end'],
                        'latitude_start': params['latitude_start'],
                        'latitude_end': params['latitude_end'],
                        'label': label,
                        'min_value': min_value,
                        'max_value': max_value
                    }
                else:
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
                    tmp_tif_path = os.path.join(CACHE_FOLDER_DIR, out_tif_name)
                    warp_tif_path = tmp_tif_path[:-5]+'_warped.tiff'
                    translate_tif_path = tmp_tif_path[:-5] + '_trans.tiff'
                    translate_tif_name = out_tif_name[:-5] + '_trans.tiff'

                    split_data[np.where(split_data == fill_value)] = 9.9e36
                    # 创建 .tif 文件
                    # 要在切片之后再翻转
                    # split_data = np.flip(split_data, axis=0)

                    driver = gdal.GetDriverByName('GTiff')

                    tmp_tif_path = os.path.join(CACHE_FOLDER_DIR, out_tif_name)
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

                    # params['res_limit'] = 200
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
                    # self._exec_gdal_inplace(f'gdalwarp -t_srs EPSG:4326', out_tif_path)
                    # self._exec_gdal_inplace(f'gdal_translate -co TILED=YES -co COMPRESS=LZW', out_tif_path)
                    # self._exec_gdal_inplace(
                    #     f'gdal_translate -co TILED=YES -co COMPRESS=LZW', out_tif_path)
                    tiff_meta = {
                        'filepath': translate_tif_path,
                        'file_size': os.path.getsize(translate_tif_path),
                        'file_name': translate_tif_name,
                        'datetime': datetime,
                        'datetime_start': datetime,
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
        return tiff_meta_list

    def get_channel_data_array(self, params):
        # doc_size = get_doc_real_size(CACHE_FOLDER_DIR)
        # # 文件夹超过100MB 清空
        # if doc_size / 1024 / 1024 > 100:
        #     del_files(CACHE_FOLDER_DIR)

        # 缓存文件夹超过5GB，则根据最后访问时间按LRU规则淘汰，直到文件夹大小小于5GB
        doc_size, status = self._get_doc_real_size(CACHE_FOLDER_DIR)
        doc_counter = 0
        while (doc_size / 1024 / 1024 / 1024 > 5 and doc_counter < len(status)):
            oldest_status = status[doc_counter]
            try:
                os.remove(os.path.join(CACHE_FOLDER_DIR,
                          oldest_status['file_name']))
                doc_size -= oldest_status['file_size']
            except Exception as e:
                print("except:", e)
            doc_counter += 1

        label = params['channel_label']
        channel_dimensions = self.file[label].dimensions
        data = np.array(self.file.variables[label]).astype(np.float64)
        datetime_field, depth_field, longitude_field, latitude_field = '', '', '', ''
        datetime_idx, depth_idx, longitude_idx, latitude_idx = -1, -1, -1, -1
        i = 0
        # 找出四个维度对应的index
        for dim in channel_dimensions:
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
        data = np.transpose(data, transpose_list)
        # 反转一下 否则图是反的
        # data = np.flip(data, axis=2)
        # data = np.flip(data, axis = 3)

        # 计算偏置和系数
        # add_offset = self.file.variables[label].add_offset
        # scale_factor = self.file.variables[label].scale_factor
        # data = data * scale_factor + add_offset
        fill_value = self.file.variables[label]._FillValue

        Lon = self.file.variables[longitude_field][params['longitude_start']: params['longitude_end'] + 1]
        Lat = self.file.variables[latitude_field][params['latitude_start']: params['latitude_end'] + 1]

        # 影像的左上角和右下角坐标
        LonMin, LatMax, LonMax, LatMin = [
            Lon.min(), Lat.max(), Lon.max(), Lat.min()]

        # 分辨率计算
        N_Lat = len(Lat)
        N_Lon = len(Lon)
        Lon_Res = (LonMax - LonMin) / (float(N_Lon)-1)
        Lat_Res = (LatMax - LatMin) / (float(N_Lat)-1)

        data_list = []
        for datetime in range(params['datetime_start'], params['datetime_end'] + 1):
            for depth in range(params['depth_start'], params['depth_end'] + 1):
                params_str = "{}_dt={}_dp={}_lon={}_{}_lat={}_{}_lb={}".format(
                    params['uuid'],
                    datetime,
                    depth,
                    params['longitude_start'], params['longitude_end'],
                    params['latitude_start'], params['latitude_end'],
                    label)
                print('222')
                split_data = data[datetime,
                                  depth,
                                  params['latitude_start']: params['latitude_end'] + 1,
                                  params['longitude_start']: params['longitude_end'] + 1,
                                  ]
                tmp_data = split_data.reshape(-1)
                fill_pos = np.where(tmp_data == fill_value)
                processed_data = np.delete(tmp_data, fill_pos)
                if len(processed_data) > 0:
                    min_value = processed_data.min()
                    max_value = processed_data.max()
                else:
                    min_value = 0.0
                    max_value = 0.0

                split_data[np.where(split_data == fill_value)] = np.NaN
                # split_data = split_data.squeeze()
                # print(split_data.shape)
                # 创建 .tif 文件
                # 要在切片之后再翻转
                split_data = np.flip(split_data, axis=0)
                split_data = np.around(split_data, params['scalar_format'])
                print(split_data)
                array_meta = {
                    'file_data': split_data.tolist(),
                    'datetime': datetime,
                    'depth': depth,
                    'longitude_start': params['longitude_start'],
                    'longitude_end': params['longitude_end'],
                    'latitude_start': params['latitude_start'],
                    'latitude_end': params['latitude_end'],
                    'label': label
                }
                data_list.append(array_meta)
        return data_list

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
        Lon_Res = (LonMax - LonMin) / (float(N_Lon)-1)
        Lat_Res = (LatMax - LatMin) / (float(N_Lat)-1)

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
                warp_tif_path = tmp_tif_path[:-5]+'_warped.tiff'
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
    def __init__(self, file):
        self.file = file
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
                          file=File(fobj, name=self.file.name),
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

    def create(self, params):
        self.file_same_as_vis = params['file_same_as_vis']
        path = os.path.join(settings.MEDIA_ROOT, 'datasets', 'uploads', self.file.name)
        with open(path, 'wb') as f:
            f.write(self.file.read())
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
                              file_same_as_vis=True,)
            rawfile.save()
            return 'success'