from abc import abstractmethod
from django.core.files.storage import default_storage
from django.core.files.uploadedfile import UploadedFile
from api.sklec.NcfCore import NcfCore
from api.sklec.FormDataCore import FormDataCore
import os
from sklecvis import settings


class RawFileUploadBaseCore:

    """用于上传 RawFile 的基类，其派生类对应不同的 RawFile 类型，如 nc 文件。"""
    def __init__(self):
        self.rawfile_path = None

    def save_from_uploaded_file(self, file: UploadedFile):
        rawfile_path = default_storage.save(os.path.join('datasets', 'raw', file.name), file)
        self.rawfile_path = os.path.join(settings.MEDIA_ROOT, rawfile_path)

    def save_from_filesystem_filepath(self, filepath):
        with open(filepath, "rb", ) as f:
            content = f.read()
            name = os.path.split(f.name)[-1]
            self.save_from_content(content, name)

    def save_from_content(self, content, name):
        self.rawfile_path = os.path.join(settings.MEDIA_ROOT, 'datasets', 'raw', name)
        with open(self.rawfile_path, "wb", ) as f:
            f.write(content)

    def generate_rawfile_and_visfile(self, dataset_uuid):
        pass


class NcfRawFileUploadCore(RawFileUploadBaseCore):
    def generate_rawfile_and_visfile(self, dataset_uuid):
        core = NcfCore(self.rawfile_path)
        if not core.check_latlng():
            raise Exception('NcfFile does not has dimension latitude or longitude.')
        return core.save_visfile_and_rawfile_to_dataset(dataset_uuid)


class FormDataRawFileUploadCore(RawFileUploadBaseCore):
    pass
    # def generate_table(self, dataset_uuid, table_meta_uuid):
    #     core = FormDataCore()
    #     table_uuid = core.generate_table_from_csv(self.rawfile_path, dataset_uuid, table_meta_uuid)
    #     return table_uuid


class GenericRawFileUploadCore(RawFileUploadBaseCore):
    def generate_rawfile_and_visfile(self, dataset_uuid):
        raise Exception('Unsupported file type. ')