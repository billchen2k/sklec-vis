from rest_framework import serializers
from rest_framework.reverse import reverse
from rest_framework import validators
from api.models import *

class DatasetSerializer(serializers.ModelSerializer):

    detail = serializers.SerializerMethodField()

    def get_detail(self, dataset):
        request = self.context['request']
        return request.build_absolute_uri(
            reverse('dataset-detail', args=[dataset.uuid], request=request)
        )

    class Meta:
        model = Dataset
        exclude = ['id']


class DataChannelOfVisFileSerializer(serializers.ModelSerializer):

    class Meta:
        model = DataChannel
        exclude = ['id', 'visfile']

class VisFileSerializer(serializers.ModelSerializer):

    data_channels = DataChannelOfVisFileSerializer(many=True, read_only=True)
    file = serializers.SerializerMethodField()

    def get_file(self, visfile):
        request = self.context['request']
        hidden_formats = [VisFile.FileFormat.RSK]
        if visfile.format in hidden_formats:
            return None
        return request.build_absolute_uri(
            visfile.file.url
        )

    class Meta:
        model = VisFile
        exclude = ['id', 'dataset']

class RawFileOfDatasetSerializer(serializers.ModelSerializer):

    file = serializers.SerializerMethodField()

    def get_file(self, rawfile):
        request = self.context['request']
        if rawfile.file_same_as_vis:
            return request.build_absolute_uri(
                VisFile.objects.get(id=rawfile.visfile_id).file.url
            )
        else:
            return request.build_absolute_uri(
                rawfile.file.url
            )


    class Meta:
        model = RawFile
        exclude = ['id', 'dataset', 'visfile']

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for system user model
    """

    class Meta:
        model = User
        exclude = ['id', 'password', 'is_superuser', 'is_staff', 'is_active', 'groups', 'user_permissions']

class SiteUserSerializer(serializers.ModelSerializer):

    user = UserSerializer(read_only=True)

    class Meta:
        model = SiteUser
        exclude = ['id']

    def to_representation(self, obj):
        """Move fields from profile to user representation."""
        representation = super().to_representation(obj)
        user_representation = representation.pop('user')
        for key in user_representation:
            representation[key] = user_representation[key]

        return representation

    def to_internal_value(self, data):
        """Move fields related to profile to their own profile dictionary."""
        user_internal = {}
        for key in UserSerializer.Meta.fields:
            if key in data:
                user_internal[key] = data.pop(key)

        internal = super().to_internal_value(data)
        internal['profile'] = user_internal
        return internal

    def update(self, instance, validated_data):
        """Update user and profile. Assumes there is a profile for every user."""
        user_data = validated_data.pop('user')
        super().update(instance, validated_data)

        user = instance.user
        for attr, value in user_data.items():
            setattr(user, attr, value)
        user.save()

        return instance


class DatasetDetailSerializer(serializers.ModelSerializer):

    vis_files = VisFileSerializer(many=True, read_only=True)
    raw_files = RawFileOfDatasetSerializer(many=True, read_only=True)
    created_by = SiteUserSerializer(read_only=True)

    class Meta:
        model = Dataset
        fields = '__all__'

