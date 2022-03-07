from PIL import Image
from PIL.TiffTags import TAGS
import os
import sys

# Root dir is server
ROOT_DIR = os.path.relpath(os.path.join(os.path.dirname(__file__), '..', '..'))

class GeoTiffCore:

    def __init__(self, file_path, output_dir, type: str = 'gdl'):
        self.file = file_path
        self.output_dir = output_dir
        self.image = None
        self.meta_tags = None
        self.size = None

        self.file = self.file if self.file.startswith('/') else os.path.join(ROOT_DIR, self.file)
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
        pass

    def _compress(self):
        pass

    def _save(self):
        pass

    def save(self):
        pass

    def compress_and_save(self):
        pass

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print('Usage: python3 GeoTiffCore.py <file_path> <output_dir>.')

    g = GeoTiffCore(sys.argv[1], sys.argv[2])