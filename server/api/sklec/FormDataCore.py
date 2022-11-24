import os
import math
import numpy as np
import netCDF4
import pandas
from api.sklec.SKLECBaseCore import SKLECBaseCore
from django.core.files import File
from django.core.files.storage import default_storage
from osgeo import gdal, osr
from sklecvis import settings
import subprocess
import re
import uuid
import time
import datetime
import pandas as pd
from collections import defaultdict, namedtuple
from api.models import *

ROOT_DIR = os.path.relpath(os.path.join(os.path.dirname(__file__), '..'))
CACHE_FOLDER_DIR = os.path.join(
    settings.MEDIA_ROOT, 'cache_files', 'nc_to_tiff')

PREVIEW_FOLDER_DIR = os.path.join(
    settings.MEDIA_ROOT, 'previews', 'nc_to_tiff'
)


class FormDataUtils:
    @classmethod
    def split_name_and_unit(cls, total_name):
        lbrace_index = total_name.find('(')
        rbrace_index = total_name.find(')')
        if lbrace_index == -1 or rbrace_index == -1:
            return total_name, None
        return total_name[:lbrace_index], total_name[lbrace_index+1: rbrace_index]


class FormDataCore(SKLECBaseCore):

    def __init__(self):
        pass

    def create_table_meta(self, table_meta_name=None, column_list=None):
        table_meta = FormDataTableMeta(
            type='default',
            name=table_meta_name,
        )
        table_meta.save()
        for index, column in enumerate(column_list):
            name, unit = FormDataUtils.split_name_and_unit(column)
            field_meta = FormDataFieldMeta(
                table_meta=table_meta,
                name=name,
                attribute_type='default',
                unit=unit,
                index=index,
            )
            field_meta.save()

        return table_meta.uuid

    def create_cells(self, cell_values, table_uuid):
        row_num = len(cell_values)
        if row_num == 0:
            raise Exception('Row number is 0.')
        col_num = len(cell_values[0])
        table = FormDataTable.objects.get(uuid=table_uuid)
        table_meta = table.table_meta
        field_metas = FormDataFieldMeta.objects.filter(table_meta=table_meta).order_by('index')
        for row_index in range(row_num):
            for col_index, field_meta in zip(range(col_num), field_metas):
                cell = FormDataCell(
                    table=table,
                    field_meta=field_meta,
                    index_row=row_index,
                    value_default=str(cell_values[row_index][col_index]),
                )
                cell.save()

    def generate_table_from_csv(self, csv_file_path=None, dataset_uuid=None, table_meta_uuid=None):
        df = pandas.read_csv(csv_file_path, encoding='GBK')
        table_name = os.path.basename(csv_file_path)
        table_name = table_name[: table_name.find('.')]
        if table_meta_uuid is None:
            table_meta_uuid = self.create_table_meta(table_name + '_meta', df.columns.tolist())
        table = FormDataTable(
            dataset=Dataset.objects.get(uuid=dataset_uuid),
            table_meta=FormDataTableMeta.objects.get(uuid=table_meta_uuid),
            name=table_name,
        )
        table.save()
        self.create_cells(df.values.tolist(), table.uuid)
        return table.uuid

