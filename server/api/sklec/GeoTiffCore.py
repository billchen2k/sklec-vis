import subprocess
from typing import List

from PIL import Image
from PIL.TiffTags import TAGS
import os
import sys
import argparse
import tqdm

# Root dir is server
ROOT_DIR = os.path.relpath(os.path.join(os.path.dirname(__file__), '..', '..'))

class GeoTiffCore:

    COMPRESS_ALGO = 'lzw'
    # COMPRESS_ALGO = 'lzma'

    def __init__(self, file_path, output_dir):
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

        self.output_dir = self.output_dir if self.output_dir.startswith('/') else os.path.join(ROOT_DIR, self.output_dir)
        self._load_image()

    def __str__(self):
        return f'<SklecVis: GeoTiffCore> {self.file}'

    def _sizeof_fmt(self, num, suffix='B'):
        for unit in ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z']:
            if abs(num) < 1024.0:
                return f'{num:3.1f}{unit}{suffix}'
            num /= 1024.0
        return f'{num:.1f}Yi{suffix}'

    def _load_image(self):
        self.image = Image.open(self.file)
        self.size = os.stat(self.file).st_size
        self.size_readable = self._sizeof_fmt(self.size)
        self.meta_tags = {TAGS[key] : self.image.tag[key] for key in self.image.tag_v2}

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

def main():
    parser = argparse.ArgumentParser(description='Compress GeoTiff files')
    parser.add_argument('-i', '--input', required=True,
                        help='Input directory',)
    parser.add_argument('-o', '--output', required=True,
                        help='Output directory',)
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
            if args.max_width:
                gt.downsample_compress_save(args.max_width, append_name=args.postfix)
            else:
                gt.compress_only_save(append_name=args.postfix)

if __name__ == '__main__':
    main()