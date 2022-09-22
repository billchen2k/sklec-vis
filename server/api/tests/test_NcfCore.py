import os

from netCDF4 import Dataset
from django.test import TestCase
from rest_framework.test import APIRequestFactory
from api.sklec.NcfCore import NcfCore
from sklecvis import settings
from api.models import *
# Create your tests here.

DATASETS_FOLDER = os.path.join(settings.MEDIA_ROOT, 'tests')

class NCFTest(TestCase):
    TEST_NCFDATASETS_VALID = ['test_4dim.nc', 'test_global.201801.nc']

    def create_siteuser(self):
        user = User()
        user.save()
        siteUser = SiteUser(user = user)
        siteUser.save()
        return siteUser

    def create_dataset(self):
        siteUser = self.create_siteuser()
        dataset = Dataset(created_by = siteUser)
        dataset.save()
        return dataset

    def test_example(self):
        self.assertEqual(1 + 1, 2)

    def test_init_valid(self):
        ncf_dataset = self.TEST_NCFDATASETS_VALID[0]
        filepath = os.path.join(DATASETS_FOLDER, ncf_dataset)
        core = NcfCore(filepath)
        self.assertEqual(core.filepath, filepath)
        self.assertEqual(core.filename, ncf_dataset)
        self.assertTrue(core.check_latlng())

    def test_save_visfile_and_rawfile_to_dataset(self):
        ncf_dataset = self.TEST_NCFDATASETS_VALID[0]
        filepath = os.path.join(DATASETS_FOLDER, ncf_dataset)
        dataset = self.create_dataset()
        core = NcfCore(filepath)
        rawfile_uuid, visfile_uuid = core.save_visfile_and_rawfile_to_dataset(dataset.uuid)
        self.assertNotEqual(rawfile_uuid, None)
        self.assertNotEqual(visfile_uuid, None)

    def test_get_2d_area_data(self):
        ncf_dataset = self.TEST_NCFDATASETS_VALID[0]
        filepath = os.path.join(DATASETS_FOLDER, ncf_dataset)
        dataset = self.create_dataset()
        core = NcfCore(filepath)
        data = core.get_2d_area_data(label='hs', longitude_start=100, longitude_end=200,
                                     latitude_start=100, latitude_end=200, time_index=0)
        self.assertIsNotNone(data)

    def test_generate_split_tiff(self):
        ncf_dataset = self.TEST_NCFDATASETS_VALID[0]
        filepath = os.path.join(DATASETS_FOLDER, ncf_dataset)
        core = NcfCore(filepath)
        tiff_info = core.generate_tiff(label='hs', longitude_start=100, longitude_end=200,
                                       latitude_start=100, latitude_end=200, time_index=0)
        self.assertNotEqual(tiff_info, None)
        self.assertTrue(tiff_info.get('file_size') > 0)

    def test_generate_ncf_content(self):
        ncf_dataset = self.TEST_NCFDATASETS_VALID[0]
        filepath = os.path.join(DATASETS_FOLDER, ncf_dataset)
        core = NcfCore(filepath)
        core.generate_ncf_content(label='hs')
        core.generate_ncf_content(label='hs', filenum_limit = 5)
        core.generate_ncf_content(label='hs', res_limit=100)