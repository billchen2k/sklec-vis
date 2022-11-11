from rest_framework import serializers
from rest_framework.reverse import reverse
from rest_framework import validators
from api.models import *

class SimpleDatasetTagSerializer(serializers.ModelSerializer):

    parent = serializers.SerializerMethodField()
    dataset_count = serializers.SerializerMethodField()

    def get_parent(self, obj):
        if obj.parent:
            return obj.parent.uuid
        else:
            return None

    def get_dataset_count(self, obj):
        return obj.dataset_set.count()

    class Meta:
        model = DatasetTag
        exclude = ['id']
        depth = 0

class NestedDatasetTagSerializer(serializers.ModelSerializer):

    parent = serializers.SerializerMethodField()

    def get_parent(self, obj):
        if obj.parent:
            return NestedDatasetTagSerializer(obj.parent).data
        else:
            return None
    class Meta:
        model = DatasetTag
        exclude = ['id', 'description']
        depth = 10


class DatasetSerializer(serializers.ModelSerializer):
    """
    Serializer used in dataset list.
    """

    detail = serializers.SerializerMethodField()
    tags = serializers.ListSerializer(child=NestedDatasetTagSerializer())

    def get_detail(self, dataset):
        request = self.context['request']
        return request.build_absolute_uri(
            reverse('dataset-detail', args=[dataset.uuid], request=request)
        )

    class Meta:
        model = Dataset
        exclude = ['id']

class DatasetCreateSerializer(serializers.ModelSerializer):
    """
        Serializer used in dataset list.
        """

    class Meta:
        model = Dataset
        exclude = ['id', 'created_by', 'tags']

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

class VisfileUpdateSerializer(serializers.ModelSerializer):
    file_name = serializers.CharField(max_length=200, required=False)

    class Meta:
        model = VisFile
        fields = ['file_name', 'is_georeferenced', 'longitude1', 'latitude1', 'longitude2', 'latitude2', 'datetime_start', 'datetime_end']

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

class RawfileUpdateSerializer(serializers.ModelSerializer):
    file_name = serializers.CharField(max_length=200, required=False)
    # file_same_as_vis = serializers.BooleanField(required=False, default=True)
    class Meta:
        model = RawFile
        fields = ['file_name', 'folder_hierarchy']


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
    tags = serializers.ListSerializer(child=SimpleDatasetTagSerializer())

    class Meta:
        model = Dataset
        fields = '__all__'

class DatasetUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dataset
        fields = '__all__'

class DatasetDestroySerializer(serializers.ModelSerializer):
    class Meta:
        model = Dataset
        fields = '__all__'

class ViewTiffFileSerializer(serializers.ModelSerializer):

    class Meta:
        model = ViewTiffFile
        exclude = ['uuid']

class RawFileUploadSerializer(serializers.ModelSerializer):

    uuid = serializers.CharField(max_length=256, required=True, allow_blank=True)
    file_same_as_vis = serializers.BooleanField(default=True, allow_null=True)

    class Meta:
        model = RawFile
        exclude = ['dataset', 'visfile', 'file_name', 'file_size']

class DatasetTagsAddSerializer(serializers.Serializer):

    uuid_tag = serializers.CharField(max_length=256, required=True, allow_blank=True)

class DatasetTagCreateSerializer(serializers.ModelSerializer):
    parent = serializers.CharField(max_length=256, required=False, allow_null=True, default=None,
                                   help_text='传入 parent 的 UUID，默认为 null。\n'
                                             '对于 post 接口，留空或传 null 都将 parent 置为 null。\n'
                                             '对于 patch 接口，若留空则不修改 parent，若传 null 则将 parent 修改为 null。\n')

    class Meta:
        model = DatasetTag
        exclude = ['id']

    # 构造写入，将 parent 由 uuid 转化为 object
    def to_internal_value(self, data: dict):
        if ('parent' in data) and (data['parent'] is not None):
            parent_uuid = data['parent']
            if not DatasetTag.objects.filter(uuid = parent_uuid).exists():
                raise serializers.ValidationError({
                    'parent': f'Parent uuid {parent_uuid} does not exists.'
                })
            data['parent'] = DatasetTag.objects.get(uuid = parent_uuid)
        return data


class DatasetPatchSerializer(serializers.ModelSerializer):

    class Meta:
        model = DatasetTag
        exclude = ['id']


class FormDataCellSerializer(serializers.ModelSerializer):
    table = serializers.CharField(max_length=30, allow_null=False, allow_blank=True, write_only=True)
    field_meta = serializers.CharField(max_length=30, allow_null=False, allow_blank=True, write_only=True)
    index_row = serializers.IntegerField(allow_null=False, default=0)

    class Meta:
        model = FormDataCell
        exclude = ['id']
        depth = 1

    # 构造写入，将 table & field_type 由 uuid 转化为 object
    def to_internal_value(self, data: dict):
        if ('table' in data) and (data['table'] is not None):
            table_uuid = data['table']
            if not FormDataTable.objects.filter(uuid=table_uuid).exists():
                raise serializers.ValidationError({
                    'table': f'Table uuid {table_uuid} does not exists.'
                })
            data['table'] = FormDataTable.objects.get(uuid=table_uuid)
        if ('field_meta' in data) and (data['field_meta'] is not None):
            field_meta_uuid = data['field_meta']
            if not FormDataFieldMeta.objects.filter(uuid=field_meta_uuid).exists():
                raise serializers.ValidationError({
                    'field_meta': f'Field_meta uuid {field_meta_uuid} does not exists.'
                })
            data['field_meta'] = FormDataFieldMeta.objects.get(uuid=field_meta_uuid)
        return data


class FormDataTableSerializer(serializers.ModelSerializer):
    dataset = serializers.CharField(max_length=30, allow_null=False, allow_blank=True, write_only=True)
    table_meta = serializers.CharField(max_length=30, allow_null=False, allow_blank=True, write_only=True)
    field_values = FormDataCellSerializer(many=True, read_only=True)

    class Meta:
        model = FormDataTable
        exclude = ['id']
        depth = 1

    # 构造写入，将 dataset & table_meta 由 uuid 转化为 object
    def to_internal_value(self, data: dict):
        if ('dataset' in data) and (data['dataset'] is not None):
            dataset_uuid = data['dataset']
            if not Dataset.objects.filter(uuid=dataset_uuid).exists():
                raise serializers.ValidationError({
                    'dataset': f'Dataset uuid {dataset_uuid} does not exists.'
                })
            data['dataset'] = Dataset.objects.get(uuid=dataset_uuid)
        if ('table_meta' in data) and (data['table_meta'] is not None):
            table_meta_uuid = data['table_meta']
            if not FormDataTableMeta.objects.filter(uuid=table_meta_uuid).exists():
                raise serializers.ValidationError({
                    'table_meta': f'Table_meta uuid {table_meta_uuid} does not exists.'
                })
            data['table_meta'] = FormDataTableMeta.objects.get(uuid=table_meta_uuid)
        return data


class FormDataFieldMetaSerializer(serializers.ModelSerializer):
    table_meta = serializers.CharField(max_length=30, allow_null=False, allow_blank=True, write_only=True)
    index = serializers.IntegerField(allow_null=False, default=0)

    class Meta:
        model = FormDataFieldMeta
        exclude = ['id']
        depth = 1

    # 构造写入，将 table_type 由 uuid 转化为 object
    def to_internal_value(self, data: dict):
        if ('table_meta' in data) and (data['table_meta'] is not None):
            table_meta_uuid = data['table_meta']
            if not FormDataTableMeta.objects.filter(uuid=table_meta_uuid).exists():
                raise serializers.ValidationError({
                    'table_meta': f'Table_meta uuid {table_meta_uuid} does not exists.'
                })
            data['table_meta'] = FormDataTableMeta.objects.get(uuid=table_meta_uuid)
        return data

    def to_representation(self, obj):
        representation = super().to_representation(obj)
        if ('table_meta' in representation) and (representation['table_meta'] is not None):
            representation['table_meta'] = obj.table_meta.uuid
        return representation


class FormDataFieldMetaBatchSerializer(serializers.Serializer):
    field_metas = FormDataFieldMetaSerializer(many=True)


class FormDataTableMetaSerializer(serializers.ModelSerializer):
    field_metas = FormDataFieldMetaSerializer(many=True, read_only=True)

    class Meta:
        model = FormDataTableMeta
        fields = '__all__'
        depth = 1


