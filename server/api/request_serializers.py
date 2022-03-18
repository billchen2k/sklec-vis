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

    data = serializers.DictField(child=DataSerializer(), required=False)


class GetVisContentRequestSerializer(serializers.Serializer):



    datetime_start = serializers.DateTimeField(required=False, help_text='开始时间。')
    datetime_end = serializers.DateTimeField(required=False, help_text='结束时间。')
    channels = serializers.ListField(child=serializers.CharField(), required=False, help_text='要获取的数据通道。如果指定了 all_channel，请留空。')
    all_channels = serializers.BooleanField(required=False, help_text='是否获取所有通道。如果为 true，则 channels 字段将被忽略。', default=False)
    target_samples = serializers.IntegerField(required=False, help_text='要获取的样本数。默认为 1000，不一定精确。')

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


    data = serializers.DictField(child=DataSerializer(), required=False)

