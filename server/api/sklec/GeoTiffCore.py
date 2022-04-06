import subprocess
from typing import List, Tuple
import numpy as np
from PIL import Image
from PIL.TiffTags import TAGS
import os
import sys
import argparse
import tqdm
from osgeo import gdal

# Root dir is server
from api.sklec.utils import readable_size

ROOT_DIR = os.path.relpath(os.path.join(os.path.dirname(__file__), '..', '..'))

class GeoTiffCoreException(BaseException):
    pass

class GeoTiffCore:
    """
    todo: Rewrite compress functions with osgeo.gdal. (Rather than using gdal cli.)
    """

    COMPRESS_ALGO = 'lzw'
    OUTPUT_NAN_VALUE = 0

    # COMPRESS_ALGO = 'lzma'

    def __init__(self, file_path, output_dir=None):
        self.file = file_path
        self.output_dir = output_dir
        self.image = None
        self.meta_tags = None
        self.size = None

        if self.file.startswith('/') or self.file.startswith('..'):
            self.file = self.file
        else:
            self.file = os.path.join(ROOT_DIR, self.file)
        if not os.path.exists(self.file):
            raise FileNotFoundError(f'File {self.file} not found')

        if self.output_dir:
            self.output_dir = self.output_dir if self.output_dir.startswith('/') else os.path.join(ROOT_DIR,
                                                                                                   self.output_dir)
        self._load_file()

    def __str__(self):
        return f'<SklecVis: GeoTiffCore> {self.file}'

    def _load_file(self):
        self.image = Image.open(self.file)
        self.size = os.stat(self.file).st_size
        self.size_readable = readable_size(self.size)
        self.meta_tags = {TAGS[key]: self.image.tag[key] for key in self.image.tag_v2}
        driver = gdal.GetDriverByName('GTiff')
        self.dataset: gdal.Dataset = gdal.Open(self.file)
        self.raster_size = [self.dataset.RasterXSize, self.dataset.RasterYSize]

    def _exec_cmds(self, cmds: List[str]):
        for cmd in cmds:
            # stdout = subprocess.run(cmd, shell=True)
            stdout = subprocess.run(cmd, shell=True, stdout=subprocess.PIPE)
            if stdout.returncode != 0:
                raise Exception(f'Error while handling {self.file}: {stdout.stdout.decode("utf-8")}')

    def downsample_only_save(self, max_width: int = 1000, output_name: str = None, append_name: str = None):
        if not os.path.exists(self.output_dir):
            os.mkdir(self.output_dir)
        output_file = os.path.basename(self.file)
        if append_name:
            output_file = os.path.splitext(output_file)[0] + append_name + os.path.splitext(output_file)[1]
        elif output_name:
            output_file = output_name
        hwratio = self.image.height / self.image.width
        method = 'med'
        out_width = max_width
        out_height = max_width * hwratio
        cmds = [
            f'gdalwarp -overwrite -ts {out_width} {out_height} -r {method} {self.file} {self.output_dir}/{output_file}',
        ]
        self._exec_cmds(cmds)

    def downsample_compress_save(self, max_width: int = 1000, output_name: str = None, append_name: str = None):
        print(f'Handling {self.file}, max_width: {max_width}')
        if not os.path.exists(self.output_dir):
            os.mkdir(self.output_dir)
        output_file = os.path.basename(self.file)
        if append_name:
            output_file = os.path.splitext(output_file)[0] + append_name + os.path.splitext(output_file)[1]
        elif output_name:
            output_file = output_name
        hwratio = self.image.height / self.image.width
        method = 'med'
        out_width = max_width
        out_height = max_width * hwratio
        # Use gdalwarp to comporess the image

        cmds = [
            f'gdalwarp -overwrite -ts {out_width} {out_height} -r {method} {self.file} {self.output_dir}/.downsampletmp_{output_file}',
            f'gdal_translate {self.output_dir}/.downsampletmp_{output_file} {self.output_dir}/{output_file} -co TILED=YES -co COPY_SRC_OVERVIEWS=YES -co COMPRESS={self.COMPRESS_ALGO}',
            f'rm {self.output_dir}/.downsampletmp_{output_file}'
        ]
        self._exec_cmds(cmds)

    def compress_only_save(self, output_name: str = None, append_name: str = None):
        self.downsample_compress_save(max_width=self.image.width, output_name=output_name, append_name=append_name)

    def _get_area_value(self, row, col, radius) -> float:
        """
        Get the value **AROUND** the pixel at the given row and column, according to the radius.
        :param row: row number
        :param col: column number
        :return: value of the pixel
        """
        if not self.dataset_band:
            self.dataset_band = self.dataset.GetRasterBand(1)
        col = col - radius + 1
        row = row - radius + 1
        size = 2 * radius - 1
        colnum, rownum = self.raster_size
        col = max(0, min(col, colnum - size - 1))
        row = max(0, min(row, rownum - size - 1))
        samples = self.dataset_band.ReadAsArray(col, row, size, size)
        return np.mean(samples)

    def get_value_by_coordinates(self, lat_lngs: List[Tuple], radius: int = 1):
        """
        Retrieve single pixel value by coordinates. Reference:
            https://gis.stackexchange.com/questions/221292/retrieve-pixel-value-with-geographic-coordinate-as-input-with-gdal
        :param lat_lngs: A list of coordinates. [(Latitude, Longitude), (Latitude, Longitude), ...]
        :param radius: Sample radius. Defult is 1.
        :return:
        """
        if radius <= 0:
            raise GeoTiffCoreException('Fail to get value by coordinates: Radius should be larger then 0.')
        colnum = self.raster_size[0]
        rownum = self.raster_size[1]
        band = self.dataset.GetRasterBand(1)
        self.dataset_band = band

        # GetTransform will return a tuple like this: (117.0, 0.0026435045317220545, 0.0, 36.0, 0.0, -0.0026435952895938475)
        # More details at gdal docs: https://gdal.org/tutorials/geotransforms_tut.html
        transform = self.dataset.GetGeoTransform()
        # print(transform)
        data = band.ReadAsArray(0, 0, colnum, rownum)
        xOrigin = transform[0]
        yOrigin = transform[3]
        pixelWidth = transform[1]
        pixelHeight = -transform[5]
        result = []
        for point in lat_lngs:
            target_lat, target_lng = point
            if target_lng < xOrigin or target_lng > xOrigin + pixelWidth * colnum or \
                    target_lat > yOrigin or target_lat < yOrigin - pixelHeight * rownum:
                result.append(self.OUTPUT_NAN_VALUE)
                continue
            col = int((point[1] - xOrigin) / pixelWidth)
            row = int((yOrigin - point[0]) / pixelHeight)
            val = self._get_area_value(row, col, radius)
            # print(f'{self.file} ({col}, {row}): {val}')
            if np.isnan(val):
                result.append(self.OUTPUT_NAN_VALUE)
            else:
                result.append(val.item())
        return result

    def get_percentile_values(self, percentiles: List[float]):
        """
        Get the percentiles of values. Used for color mapping in the frontend. todo.
        :param percentiles:
        :return:
        """
        pass


def main():
    """
    Cli tools for compressing TIFF files. Won't be used in production.
    :return:
    """
    parser = argparse.ArgumentParser(description='Compress GeoTiff files')
    parser.add_argument('-i', '--input', required=True,
                        help='Input directory', )
    parser.add_argument('-o', '--output', required=True,
                        help='Output directory', )
    parser.add_argument('-p', '--postfix', type=str, default='', required=False,
                        help='Append postfix to the files')
    parser.add_argument('-m', '--max-width', type=int, required=False,
                        help='Max width of the output tiff images. If not specified, the original image will be used.')

    if len(sys.argv) == 1:
        parser.print_help()

    args = parser.parse_args()

    file_list = os.listdir(os.path.join(ROOT_DIR, args.input))
    for file in tqdm.tqdm(file_list):
        if file.endswith('.tif') or file.endswith('.tiff'):
            gt = GeoTiffCore(os.path.join(ROOT_DIR, args.input, file), args.output)
            pass
            # if args.max_width:
            #     gt.downsample_compress_save(args.max_width, append_name=args.postfix)
            # else:
            #     gt.compress_only_save(append_name=args.postfix)


if __name__ == '__main__':
    main()
