from typing import List
from api.models import *
from api.sklec.GeoTiffCore import GeoTiffCore


class VisualQueryManager:
    query_latlags = []
    data_stream = []
    radius = 1
    stream_generated = False
    _date_series = []

    def __init__(self, visfiles: List[VisFile], lat_lngs: List, **kwargs):
        """
        Visual query manager. Generating geo-spatial query data.
        :param visfiles:
        :param lat_lngs:
        :param kwargs:
        """
        self.visfiles = visfiles
        self.latlngs = lat_lngs
        self.radius = int(kwargs.get('radius', 1) or 1)
        self._date_series = []

    def add_visfile(self, visfile: VisFile):
        self.visfiles.append(visfile)

    def add_latlngs(self, latlng):
        self.latlngs.append(latlng)

    def _get_sample_latlngs(self):
        """
        Get sample latlngs from latlngs.
        :return:
        """
        sample_latlngs = []
        for latlng in self.latlngs:
            sample_latlngs.append(latlng)
        return sample_latlngs

    def gen_data_stream(self):
        """
        Calculate data stream and return. Date data and corresponding variables will be set.
        :return:
        """
        sample_latlngns = self._get_sample_latlngs()
        self.data_stream = [[] for _ in range(len(sample_latlngns))]
        for file in self.visfiles:
            core = GeoTiffCore(file.file.path)
            vals = core.get_value_by_coordinates(sample_latlngns, self.radius)
            for i in range(len(vals)):
                self.data_stream[i].append(vals[i])
        self.stream_generated = True
        return self.data_stream

    @property
    def date_series(self):
        if not self.stream_generated:
            raise Exception('Error generate visual query result: please first call gen_data_stream.')
        for file in self.visfiles:
            self._date_series.append(file.datetime_start.isoformat())
        return self._date_series
