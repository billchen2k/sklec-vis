import os
import numpy as np
import netCDF4
from api.sklec.SKLECBaseCore import SKLECBaseCore
from osgeo import gdal, osr
from sklecvis import settings
import subprocess
import re

ROOT_DIR = os.path.relpath(os.path.join(os.path.dirname(__file__), '..'))
CACHE_FOLDER_DIR = os.path.join(
    settings.MEDIA_ROOT, 'cache_files', 'nc_to_tiff')

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
        self.string_for_depth = ['depth', 'Depth', 'level', 'Level']
        self.string_for_longitude = ['lon', 'Lon', 'longitude', 'Longitude']
        self.string_for_latitude = ['lat', 'Lat', 'latitude', 'Latitude']
        self.dimension_list = ['datetime', 'depth', 'longitude', 'latitude']
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

        # print(Lon)
        # print(Lat)
        # 影像的左上角和右下角坐标
        LonMin, LatMax, LonMax, LatMin = [
            Lon.min(), Lat.max(), Lon.max(), Lat.min()]

        # 分辨率计算
        N_Lat = len(Lat)
        N_Lon = len(Lon)
        Lon_Res = (LonMax - LonMin) / (float(N_Lon)-1)
        Lat_Res = (LatMax - LatMin) / (float(N_Lat)-1)

        tiff_meta_list = []
        for datetime in range(params['datetime_start'], params['datetime_end'] + 1):
            for depth in range(params['depth_start'], params['depth_end'] + 1):
                params_str = "{}_dt={}_dp={}_lon={}_{}_lat={}_{}_lb={}".format(
                    params['uuid'],
                    datetime,
                    depth,
                    params['longitude_start'], params['longitude_end'],
                    params['latitude_start'], params['latitude_end'],
                    label)
                full_name = self._find_in_cache_folder(params_str)
                if full_name is not None:
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
                    # split_data = split_data.squeeze()
                    # print(split_data.shape)
                    # 创建 .tif 文件
                    # 要在切片之后再翻转
                    split_data = np.flip(split_data, axis=0)

                    driver = gdal.GetDriverByName('GTiff')

                    tmp_tif_path = os.path.join(CACHE_FOLDER_DIR, out_tif_name)
                    out_tif = driver.Create(
                        tmp_tif_path, N_Lon, N_Lat, 1, gdal.GDT_Float32)
                    # print(N_Lon, N_Lat)
                    # 设置影像的显示范围
                    # -Lat_Res一定要是-的
                    # geotransform = (LonMax, Lon_Res, 0, LatMin, 0, -Lat_Res)
                    geotransform = (LonMin, Lon_Res, 0, LatMax, 0, -Lat_Res)
                    out_tif.SetGeoTransform(geotransform)

                    # 获取地理坐标系统信息，用于选取需要的地理坐标系统
                    srs = osr.SpatialReference()
                    # 定义输出的坐标系为"WGS 84"，AUTHORITY["EPSG","4326"]
                    srs.ImportFromEPSG(4326)
                    out_tif.SetProjection(srs.ExportToWkt())  # 给新建图层赋予投影信息

                    # 数据写出
                    # print(split_data.shape)
                    out_tif.GetRasterBand(1).WriteArray(
                        split_data)  # 将数据写入内存，此时没有写入硬盘

                    # out_tif.
                    out_tif.FlushCache()  # 将数据写入硬盘
                    out_tif = None  # 注意必须关闭tif文件

                    # ds = gdal.Open(out_tif_path)

                    warp_options = gdal.WarpOptions(format='Gtiff',
                                                    srcSRS=srs.ExportToWkt(),
                                                    )
                    gdal.Warp(warp_tif_path, tmp_tif_path,
                              format='Gtiff', options=warp_options)

                    translate_options = gdal.TranslateOptions(format='GTiff',
                                                              creationOptions=[
                                                                  'TILED=YES', 'COMPRESS=LZW']
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

        print('****')
        print(Lon)
        print(Lat)
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
                full_name = self._find_in_cache_folder(params_str)
                print(~(params.__contains__('return_type') and params['return_type'] == 'tiff'))
                if full_name is not None and params.__contains__('return_type') and params['return_type'] == 'tiff' :
                    print('111')
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
                    data_list.append(tiff_meta)
                else:
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

                    out_tif_name = params_str + \
                        "_mn={:.6f}_mx={:.6f}.tiff".format(
                            min_value, max_value)
                    tmp_tif_path = os.path.join(CACHE_FOLDER_DIR, out_tif_name)
                    warp_tif_path = tmp_tif_path[:-5]+'_warped.tiff'
                    translate_tif_path = tmp_tif_path[:-5] + '_trans.tiff'
                    translate_tif_name = out_tif_name[:-5] + '_trans.tiff'

                    split_data[np.where(split_data == fill_value)] = 9.9e36
                    # split_data = split_data.squeeze()
                    # print(split_data.shape)
                    # 创建 .tif 文件
                    # 要在切片之后再翻转
                    split_data = np.flip(split_data, axis=0)
                    if params.__contains__('return_type') and params['return_type'] == 'array':
                        print('333')
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
                    # elif params['return_type'] == 'tiff':
                    else:  # Generate TIFF file
                        print('444')
                        driver = gdal.GetDriverByName('GTiff')

                        tmp_tif_path = os.path.join(CACHE_FOLDER_DIR, out_tif_name)
                        out_tif = driver.Create(
                            tmp_tif_path, N_Lon, N_Lat, 1, gdal.GDT_Float32)
                        # print(N_Lon, N_Lat)
                        # 设置影像的显示范围
                        # -Lat_Res一定要是-的
                        # geotransform = (LonMax, Lon_Res, 0, LatMin, 0, -Lat_Res)
                        geotransform = (LonMin, Lon_Res, 0, LatMax, 0, -Lat_Res)
                        out_tif.SetGeoTransform(geotransform)

                        # 获取地理坐标系统信息，用于选取需要的地理坐标系统
                        srs = osr.SpatialReference()
                        # 定义输出的坐标系为"WGS 84"，AUTHORITY["EPSG","4326"]
                        srs.ImportFromEPSG(4326)
                        out_tif.SetProjection(srs.ExportToWkt())  # 给新建图层赋予投影信息

                        # 数据写出
                        # print(split_data.shape)
                        out_tif.GetRasterBand(1).WriteArray(
                            split_data)  # 将数据写入内存，此时没有写入硬盘

                        # out_tif.
                        out_tif.FlushCache()  # 将数据写入硬盘
                        out_tif = None  # 注意必须关闭tif文件

                        # ds = gdal.Open(out_tif_path)

                        warp_options = gdal.WarpOptions(format='Gtiff',
                                                        srcSRS=srs.ExportToWkt(),
                                                        )
                        gdal.Warp(warp_tif_path, tmp_tif_path,
                                  format='Gtiff', options=warp_options)

                        translate_options = gdal.TranslateOptions(format='GTiff',
                                                                  creationOptions=[
                                                                      'TILED=YES', 'COMPRESS=LZW']
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
                        data_list.append(tiff_meta)
        return data_list

    def close(self):
        self.file.close()
