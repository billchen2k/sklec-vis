import os
import numpy as np
import netCDF4
from api.sklec.SKLECBaseCore import SKLECBaseCore
from osgeo import gdal, osr
from sklecvis import settings
import subprocess

def get_doc_real_size(p_doc):
    size = 0.0
    for root, dirs, files in os.walk(p_doc):
        size += sum([os.path.getsize(os.path.join(root, file))
                    for file in files])
    # size = round(size/1024/1024/1024, 2)
    return size


def del_files(dir_path):
    # os.walk会得到dir_path下各个后代文件夹和其中的文件的三元组列表，顺序自内而外排列，
    for root, dirs, files in os.walk(dir_path, topdown=False):
        # 第一步：删除文件
        for name in files:
            os.remove(os.path.join(root, name))  # 删除文件
        # 第二步：删除空文件夹
        for name in dirs:
            os.rmdir(os.path.join(root, name))  # 删除一个空目录


ROOT_DIR = os.path.relpath(os.path.join(os.path.dirname(__file__), '..'))
CACHE_FOLDER_DIR = os.path.join(
    settings.MEDIA_ROOT, 'cache_files', 'nc_to_tiff')


class NcfCoreException:
    pass


class NcfCoreClass(SKLECBaseCore):

    # TARGET_VIS_LENGTH = 2000

    def __init__(self, file_path):
        self.file_path = file_path
        self.file = netCDF4.Dataset(file_path)
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

    def __str__(self):
        return f'RSKCore: {self.name}' + \
            f'\n\tChannels: {self.channels}' + \
            f'\n\tChannel_name: {self.channel_name}'

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


    def get_channel_data_split(self, params):
        doc_size = get_doc_real_size(CACHE_FOLDER_DIR)
        # 文件夹超过100MB 清空
        if doc_size / 1024 / 1024 > 100:
            del_files(CACHE_FOLDER_DIR)
        label = params['channel_label']
        channel_dimensions = self.file[label].dimensions
        data = np.array(self.file.variables[label])
        datetime_field, depth_field, longitude_field, latitude_field = '', '', '', ''
        datetime_idx, depth_idx, longitude_idx, latitude_idx = -1, -1, -1, -1
        i = 0
        # 找出四个维度对应的index
        for dim in channel_dimensions:
            if dim in self.string_for_datetime:
                # types.append('datetime')
                datetime_field = dim
                datetime_idx = i
            elif dim in self.string_for_depth:
                # types.append('depth')
                depth_field = dim
                depth_idx = i
            elif dim in self.string_for_longitude:
                # types.append('longitude')
                longitude_field = dim
                longitude_idx = i
            elif dim in self.string_for_latitude:
                # types.append('latitude')
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
        # data = np.flip(data)

        # 计算偏置和系数
        add_offset = self.file.variables[label].add_offset
        scale_factor = self.file.variables[label].scale_factor
        data = data * scale_factor + add_offset

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
                split_data = data[datetime,
                                  depth,
                                  params['latitude_start']: params['latitude_end'] + 1,
                                  params['longitude_start']: params['longitude_end'] + 1,
                                  ]
                # split_data = split_data.squeeze()
                # print(split_data.shape)
                # 创建 .tif 文件
                driver = gdal.GetDriverByName('GTiff')
                out_tif_name = "uuid={}_datetime={}_depth={}_longitude={}_{}_latitude={}_{}_label={}.tiff".format(
                    params['uuid'],
                    datetime,
                    depth,
                    params['longitude_start'], params['longitude_end'],
                    params['latitude_start'], params['latitude_end'],
                    label)
                # out_tif_name='1.tiff'
                out_tif_path = os.path.join(CACHE_FOLDER_DIR, out_tif_name)
                out_tif = driver.Create(
                    out_tif_path, N_Lon, N_Lat, 1, gdal.GDT_Float32)
                # print(N_Lon, N_Lat)
                # 设置影像的显示范围
                # -Lat_Res一定要是-的
                geotransform = (LonMax, -Lon_Res, 0, LatMin, 0, Lat_Res)
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
                out_tif.FlushCache()  # 将数据写入硬盘
                out_tif = None  # 注意必须关闭tif文件

                self._exec_gdal_inplace(f'gdalwarp -t_srs EPSG:4326', out_tif_path)
                self._exec_gdal_inplace(f'gdal_translate -co TILED=YES -co COMPRESS=LZW', out_tif_path)
                self._exec_gdal_inplace(
                    f'gdal_translate -co TILED=YES -co COMPRESS=LZW', out_tif_path)

                tiff_meta = {
                    'filepath': out_tif_path,
                    'file_size': os.path.getsize(out_tif_path),
                    'file_name': out_tif_name,
                    'datetime': datetime,
                    'datetime_start': datetime,
                    'depth': depth,
                    'longitude_start': params['longitude_start'],
                    'longitude_end': params['longitude_end'],
                    'latitude_start': params['latitude_start'],
                    'latitude_end': params['latitude_end'],
                    'label': label
                }
                tiff_meta_list.append(tiff_meta)
        return tiff_meta_list

    def close(self):
        self.file.close()
