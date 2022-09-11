import os
import pyrsktools
import django
from django.core.files import File
import netCDF4
import numpy as np
import argparse

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sklecvis.settings')
django.setup()

from api.sklec.NcfCore import NcfFileUploadClass
from api.models import *
BASE_DIR = os.path.join(os.path.dirname(__file__), '..')

def init_argparse():
    parser = argparse.ArgumentParser()
    parser.add_argument('--filepath', default='/app/media/tmp/scsv2.1.202209.nc', type=str)
    parser.add_argument('--filename', '-f', default = 'global.201801.nc',)
    parser.add_argument('--dataset', '-d', default = 'd4b18e50e',)
    parser.add_argument('--username', '-u', default = 'test_lyf1')
    args = parser.parse_args()
    return args

args = init_argparse()

# NCF_DIR_PATH = os.path.join(BASE_DIR, 'media/datasets/ncf')
# print(os.path.join(NCF_DIR_PATH, args.filename))
# file = open(os.path.join(NCF_DIR_PATH, args.filepath))
ds = netCDF4.Dataset(args.filepath)
print(ds)
print(args.filepath)

file = open(args.filepath, 'rb')
content = file.read()
name = os.path.split(os.path.splitext(file.name)[0])[-1]
# print(content)
file.close()
# print(file.read().encode('utf-8'))
params = {}
params['file_same_as_vis'] = True
params['uuid'] = args.dataset
params['name'] = name
params['content'] = content
core = NcfFileUploadClass()
res = core.create_by_script(params)

print(res)