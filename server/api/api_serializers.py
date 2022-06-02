"""
@author: Bill Chen
@file: request_serializers.py
@created: 2022/3/18 23:32
"""
from abc import abstractmethod

from rest_framework import serializers
from rest_framework.validators import UniqueValidator


class ResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField(required=False, default=True)
    message = serializers.CharField(required=False)

class ErrorResponseSerializer(ResponseSerializer):
    success = serializers.BooleanField(required=False, default=False)
    error = serializers.DictField(required=False)

class SuccessResponseSerializer(ResponseSerializer):

    class DataSerializer(serializers.Serializer):
        pass

    data = DataSerializer()

class GetVisContentRequestSerializer(serializers.Serializer):

    datetime_start = serializers.DateTimeField(required=False, help_text='开始时间。')
    datetime_end = serializers.DateTimeField(required=False, help_text='结束时间。')
    channels = serializers.ListField(child=serializers.CharField(), required=False, help_text='要获取的数据通道。如果指定了 all_channel，请留空。')
    all_channels = serializers.BooleanField(required=False, help_text='是否获取所有通道。如果为 true，则 channels 字段将被忽略。', default=False)
    target_samples = serializers.IntegerField(required=False, help_text='要获取的样本数。默认为 1000，不一定精确。')
    smooth_algorithm = serializers.CharField(required=False, help_text='平滑算法。默认为 None。')

    def validate_target_samples(self, value):
        if value and (int(value) < 500 or int(value) > 10000):
            raise serializers.ValidationError("Target samples must be between 500 and 10000")
        return value


class GetVisContentResponseSerializer(SuccessResponseSerializer):

    class DataSerializer(serializers.Serializer):
        vis_data = serializers.DictField(required=False)
        channels = serializers.ListField(child=serializers.CharField(), required=False)
        channels_labels = serializers.ListField(child=serializers.CharField(), required=False)
        sample_count = serializers.IntegerField(required=False)
        datetime_start = serializers.DateTimeField(required=False)
        datetime_end = serializers.DateTimeField(required=False)
        file_name = serializers.CharField(required=False)
        file_size = serializers.IntegerField(required=False)
        first_dimension_name = serializers.CharField(required=False)

        class Meta:
            ref_name = 'VisContentResponseData'

    data = DataSerializer()


class PostVQDataStreamRequestSerializer(serializers.Serializer):

    class LatLngItemSerializer(serializers.Serializer):
        lat = serializers.FloatField(required=False)
        lng = serializers.FloatField(required=False)

    lat_lngs = serializers.ListField(child=LatLngItemSerializer(), required=True, help_text='采样点的经纬度列表。')
    radius = serializers.FloatField(required=False, default=1, help_text='采样半径。应为大于等于 1，小于等于 100 的整数。默认为 1。')
    visfile_uuid = serializers.ListField(child=serializers.CharField(), required=False,
                                     help_text='要获取的 Vis Content。目前必须为 TiFF 格式且对应的数据集类型为 RT。')
    dataset_uuid = serializers.CharField(required=False,
                                         help_text='数据集 UUID。如果指定了 vis_uuid，则该字段将被忽略。' +
                                                   '如果没有指定 vis_uuid，则必须指定该字段，且数据的获取范围为该数据集下的全部数据。')

    def validate_radius(self, value):
        if (int(value) < 1 or int(value) > 100):
            raise serializers.ValidationError("Radius must be between 1 and 100")
        return int(value)


class PostVQDataStreamResponseSerializer(SuccessResponseSerializer):

    class DataSerializer(serializers.Serializer):
        date_data = serializers.ListField(child=serializers.DateTimeField(), required=False)
        stream_data = serializers.ListField(child=serializers.ListField(child=serializers.FloatField()), required=False)
        lat_lngs =  serializers.ListField(child=PostVQDataStreamRequestSerializer.LatLngItemSerializer(), required=False)

        class Meta:
            ref_name = 'VQDataStreamResponseData'

    data = DataSerializer()

class GetNcfContentRequestSerializer(serializers.Serializer):

    # class IntegerListField(serializers.ListField):
    #     child = serializers.CharField()
    datetime_start = serializers.IntegerField(required=False, default=-1, help_text="时间起点下标，-1表示无限制")
    datetime_end = serializers.IntegerField(required=False, default=-1, help_text="时间终点下标，-1表示无限制")
    # datetime = IntegerListField(required=False, help_text="长度为2的列表，表示时间两端的下标，用-1表示某端无限制，可留空")
    longitude_start = serializers.IntegerField(required=False, default=-1, help_text="经度起点下标，-1表示无限制")
    longitude_end = serializers.IntegerField(required=False, default=-1, help_text="经度终点下标，-1表示无限制")

    latitude_start = serializers.IntegerField(required=False, default=-1, help_text="纬度起点下标，-1表示无限制")
    latitude_end = serializers.IntegerField(required=False, default=-1, help_text="纬度终点下标，-1表示无限制")

    depth_start = serializers.IntegerField(required=False, default=-1, help_text="深度起点下标，-1表示无限制")
    depth_end = serializers.IntegerField(required=False, default=-1, help_text="深度终点下标，-1表示无限制")

    filesize_limit = serializers.IntegerField(required=False, help_text="生成的每个 tiff 文件大小限制。")
    filenum_limit = serializers.IntegerField(required=False, help_text="生成 tiff 文件的数量限制。")
    return_type = serializers.CharField(required=False, help_text="留空则默认为tiff。")
    channel_label = serializers.CharField(help_text="表示所请求的channel，应与dataset.variables.variable_name一致")
    scalar_format = serializers.CharField(required=False, help_text="array标量数据的format规则")


class GetNcfContentResponseSerializer(SuccessResponseSerializer):

    class DataSerializer(serializers.Serializer):
        files = serializers.ListField(required=True)

        class Meta:
            ref_name = 'NcfContentResponseData'

    data = DataSerializer()