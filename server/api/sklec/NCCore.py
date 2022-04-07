import os.path
import numpy
import netCDF4
from api.sklec.SKLECBaseCore import SKLECBaseCore
from api.utils import downsample1d


class NCCoreException:
    pass

class NCCore(SKLECBaseCore):

    # TARGET_VIS_LENGTH = 2000

    def __init__(self, file_path):
        self.file = netCDF4.Dataset(file_path)
        self.name = os.path.basename(file_path)
        self.channels = list(self.file.variables.keys())
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

    def get_all_channel_data(self, **kwargs):
        res = {}
        # res = {'Time': []}
        # channel_label_to_output_name = {'timestamp': 'Time'}
        for channel in self.channels:
            # channel_label_to_output_name[channel] = f'{self.channel_name[channel]} ({channel})'
            # res[channel_label_to_output_name[channel]] = []
            channel_data = self.file[channel][:]
            np_1d_data = numpy.asarray(channel_data).tolist()
            res[channel] = np_1d_data
        return res


    def close(self):
        self.file.close()