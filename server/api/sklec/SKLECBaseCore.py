from abc import abstractmethod


class SKLECBaseCore:
    """
    所有关于数据处理的类的基类。
    """
    def __init__(self):
        pass

    @abstractmethod
    def get_coordinates(self):
        """
        获取坐标。如果为单点数据，则返回一个坐标信息。如果为一个平面数据，则返回一个坐标信息列表。
        :return:
        """
        pass

    @abstractmethod
    def get_channels(self):
        """
        获取通道信息。
        :return:
        """
        pass

    @abstractmethod
    def get_time_range(self):
        """
        获取数据集的时间范围。
        :return:
        """
        pass

    @abstractmethod
    def get_data(self, channel, start_time, end_time, **kwargs):
        """
        获取数据。
        :param channel: 通道名称。
        :param start_time: 开始时间。
        :param end_time: 结束时间。
        :param kwargs:
        :return:
        """
        pass