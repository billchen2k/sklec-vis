import os.path
from typing import List
import numpy as np
import pyrsktools
from pyrsktools import RSK
from api.sklec.SKLECBaseCore import SKLECBaseCore
from api.utils import downsample1d
import warnings

class RSKCoreException:
    pass

class RSKCore(SKLECBaseCore):

    TARGET_VIS_LENGTH: int = 2000

    def __init__(self, file_path):
        self.file = RSK(file_path)
        print('Initilizing RSK Core for: ' + file_path)
        self.file.open()
        self.name = os.path.basename(file_path)
        self.channels = self.file.channels
        # Channel_label: Channel_name
        self.channel_name = {'timestamp': 'Time'}
        for channel in self.channels:
            # if channel in self.file.channels:
            self.channel_name[channel.shortName] = channel.longName

        self.sample_cache = {}
        print(self)

    def __str__(self):
        return f'RSKCore: {self.name}' + \
                f'\n\tChannels: {self.channels}' + \
                f'\n\tChannel_name: {self.channel_name}'

    def get_channels(self) -> List[str]:
        """Get channel labels.

        Returns:
            List[str]: A list of channle labels.
        """
        return [c.shortName for c in self.channels]

    def _gen_channel_key(self, channel) -> str:
        """Generate channle key.

        Args:
            channel (pyrsktools.Channel): The pyRSKtools channel object.

        Returns:
            str: A human readable channel key. Example: conductivity (conductivity_00)
        """
        return f'{channel.longName} ({channel.shortName})'


    def get_channel_data(self, channel: str, start_time, end_time, **kwargs):
        """Get a single channel data with channel label or channel long name.
        This methods uses get_all_channel_data and filter fields afterwards. Not recommended.

        Args:
            channel (str): _description_
            start_time (str | datetime.datetime): The start time. Optional, should be a
                python datetime object or an ISO string **without** timezone.
            end_time (str | datetime.datetime): The end time. Optional, shoudl be Optional, should be a
                python datetime object or an ISO string **without** timezone.
        """
        print('WARNING: It is recommended to use get_all_channel_data directly since this method uses it internally and filter the requested field afterwards.')
        all_channels = self.get_all_channel_data(start_time=start_time, end_time=end_time)
        target_index = -1
        target_key = ''
        for index, c in enumerate(self.channels):
            if channel == c.shortName or channel == c.longName:
                break
            target_index = index
            target_key =  self._gen_channel_key(c)
        if target_index == -1:
            print('Can not find target channel. Returning empty dict.')
            return {}
        return {target_key: all_channels[target_key]}

    def get_all_channel_data(self, start_time, end_time, **kwargs):
        """Get all channel data from a RSK file.

        Args:
            start_time (str | datetime.datetime): The start time. Optional, should be a
                python datetime object or an ISO string **without** timezone.
            end_time (str | datetime.datetime): The end time. Optional, shoudl be Optional, should be a
                python datetime object or an ISO string **without** timezone.
        Returns:
            _type_: Return the channle data. Example:
            {
                'conductivity (conductivity_00)': [1, 1, 1, 1...],
                'temperature (temp09)': [1, 1, 1, 1...],
            }
        """
        if start_time and end_time:
            t1 = np.datetime64(start_time)
            t2 = np.datetime64(end_time)
            self.file.readdata(t1, t2)
            total_samples = list(self.file.data)
        else:
            self.file.readdata()
            total_samples = list(self.file.data)
        downsampled_samples = downsample1d(total_samples, self.TARGET_VIS_LENGTH)
        res = {'Time': []}
        channel_label_to_output_name = {'timestamp': 'Time'}
        for channel in self.channels:
            channel_label_to_output_name[channel.shortName] = self._gen_channel_key(channel)
            res[channel_label_to_output_name[channel.shortName]] = []
        for sample in downsampled_samples:
            for i, item in enumerate(sample):
                if i == 0:
                    # item is a np.datetime64 type.
                    res['Time'].append(np.datetime_as_string(item))
                else:
                    res[channel_label_to_output_name[self.channels[i - 1].shortName]].append(item)
        return res


    def close(self):
        self.file.close()