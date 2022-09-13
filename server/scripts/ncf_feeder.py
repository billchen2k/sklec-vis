import os
import pyrsktools
import django
from django.core.files import File
import netCDF4
import numpy as np
import argparse
from sklecvis import settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sklecvis.settings')
django.setup()

from api.sklec.NcfCore import NcfFileUploadClass
from api.sklec.RawFileUploadCore import NcfRawFileUploadCore
from api.models import *
BASE_DIR = os.path.join(os.path.dirname(__file__), '..')

def init_argparse():
    parser = argparse.ArgumentParser()
    parser.add_argument('--filepath', '-f', default='/app/media/tmp/scsv2.1.202209.nc', type=str)
    # parser.add_argument('--filename', '-f', default = 'global.201801.nc',)
    parser.add_argument('--dataset', '-d', default = 'd4b18e50e',)
    parser.add_argument('--username', '-u', default = 'test_lyf1')
    args = parser.parse_args()
    return args

args = init_argparse()

# NCF_DIR_PATH = os.path.join(BASE_DIR, 'media/datasets/ncf')
# print(os.path.join(NCF_DIR_PATH, args.filename))
# file = open(os.path.join(NCF_DIR_PATH, args.filepath))
args.filepath = os.path.join(settings.MEDIA_ROOT, args.filepath)
print(f'Start feed ncf file {args.filepath} to dataset {args.dataset}.')
ds = netCDF4.Dataset(args.filepath)
print('file info: ', ds)
try:
    core = NcfRawFileUploadCore()
    core.save_from_filesystem_filepath(args.filepath)
    rawfile_uuid, visfile_uuid = core.generate_rawfile_and_visfile(args.dataset)
    print(f'succeed. rawfile uuid: {rawfile_uuid}, visfile uuid: {visfile_uuid}.')
except Exception as e:
    print(f'failed. message = {e.args}')

# file = open(args.filepath, 'rb')
# content = file.read()
# name = os.path.split(os.path.splitext(file.name)[0])[-1]
# # print(content)
# file.close()
# # print(file.read().encode('utf-8'))
# params = {}
# params['file_same_as_vis'] = True
# params['uuid'] = args.dataset
# params['name'] = name
# params['content'] = content
# core = NcfFileUploadClass()
# res = core.create_by_script(params)
#
# print(res)