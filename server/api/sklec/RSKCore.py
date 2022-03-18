import os.path
import numpy
import pyrsktools
from api.sklec.SKLECBaseCore import SKLECBaseCore
from api.utils import downsample1d


class RSKCoreException:
    pass

class RSKCore(SKLECBaseCore):

    TARGET_VIS_LENGTH = 2000

    def __init__(self, file_path):
        self.file = pyrsktools.open(file_path)
        self.name = os.path.basename(file_path)
        self.channels = self.file.sample_fields
        # Channel_label: Channel_name
        self.channel_name = {'timestamp': 'Time'}
        for channel in self.channels:
            if channel in self.file.channels:
                self.channel_name[channel] = self.file.channels[channel].name

        self.sample_cache = {}
        print(self)

    def __str__(self):
        return f'RSKCore: {self.name}' + \
                f'\n\tChannels: {self.channels}' + \
                f'\n\tChannel_name: {self.channel_name}'

    def get_channels(self):
        return self.channels


    def get_channel_data(self, channel, start_time, end_time, **kwargs):
        print(f'RSKCore.get_channel_data: {channel} {start_time} {end_time}')
        if start_time and end_time:
            total_samples = list(self.file.samples(start_time, end_time))
        else:
            total_samples = list(self.file.samples())
        if self.get_channels().count(channel) < 1:
            raise RSKCoreException(f'Can not find channel in rsk file {self.name}')
        channel_index = self.get_channels().index(channel)
        channel_sample = [sample[channel_index] for sample in total_samples]
        downsampled_channel_sample = downsample1d(channel_sample, self.TARGET_VIS_LENGTH)
        return downsampled_channel_sample

    def get_all_channel_data(self, start_time, end_time, **kwargs):
        if start_time and end_time:
            total_samples = list(self.file.samples(start_time, end_time))
        else:
            total_samples = list(self.file.samples())
        downsampled_samples = downsample1d(total_samples, self.TARGET_VIS_LENGTH)
        res = {'Time': []}
        channel_label_to_output_name = {'timestamp': 'Time'}
        for channel in self.channels:
            channel_label_to_output_name[channel] = f'{self.channel_name[channel]} ({channel})'
            res[channel_label_to_output_name[channel]] = []
        for sample in downsampled_samples:
            for i, item in enumerate(sample):
                if i == 0:
                    res['Time'].append(item)
                else:
                    res[channel_label_to_output_name[self.channels[i]]].append(item)
        return res


    def close(self):
        self.file.close()