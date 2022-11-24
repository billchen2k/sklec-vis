# This core should run in docker.

import os
import django
from django.core.files import File
import netCDF4
import numpy as np
import argparse

try:
    from sklecvis import settings
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sklecvis.settings')
    django.setup()
except:
    print('This is the sklecvis-cli core. It should be executed inside docker.')
    exit(-1)

from api.sklec.NcfCore import NcfFileUploadClass
from api.sklec.RawFileUploadCore import NcfRawFileUploadCore
from api.models import *
import parsers

class NcfUploader():

    def __init__(self, file_path: str, dataset_uuid: str, dest_name: str, **kwargs) -> None:
        self.override = True
        if 'override' in kwargs:
            self.override = kwargs['override']
        self.file_path = file_path
        self.dataset_uuid = dataset_uuid
        self.dest_name = dest_name
        if not os.path.exists(self.file_path):
            print(f'Fail to upload file: {self.file_path} doesn\'t exists.')
            exit(-1)

    def upload(self):
        print(f'Uploading... {self.file_path}...')
        ds = netCDF4.Dataset(self.file_path)
        print('File info: ', ds)
        try:
            if self.override:
                # 如果已经有同名的 vis file，则先删除。
                ds = Dataset.objects.get(uuid=self.dataset_uuid)
                qs_todel = ds.vis_files.filter(file_name=self.dest_name)
                if len(qs_todel) > 0:
                    print('Duplicate file found with --override flag enabled. Deleting...')
                    qs_todel.delete()
                    print('Successfully deleted.')

            core = NcfRawFileUploadCore()
            core.save_from_filesystem_filepath(self.file_path)
            rawfile_uuid, visfile_uuid = core.generate_rawfile_and_visfile(self.dataset_uuid)
            print(f'Succeed. rawfile uuid: {rawfile_uuid}, visfile uuid: {visfile_uuid}.')

            if self.dest_name:
                visfile: VisFile = VisFile.objects.get(uuid=visfile_uuid)
                visfile.file_name = self.dest_name
                visfile.save()
                print(f'Vis file name updated to {self.dest_name}.')
                rawfile: RawFile = RawFile.objects.get(uuid=rawfile_uuid)
                rawfile.file_name = self.dest_name
                rawfile.save()
                print(f'Raw file name updated to {self.dest_name}.')

        except Exception as e:
            print(f'Failed to upload ncf file: {e.args}')


def main():
    parser = parsers.ncf_uploader_parser()
    args = parser.parse_args()
    uploader = NcfUploader(file_path=args.filepath,
                           dataset_uuid=args.dataset,
                           dest_name=args.destname,
                           override=args.override)
    uploader.upload()


if __name__ == '__main__':
    main()
