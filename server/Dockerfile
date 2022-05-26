FROM python:3.9
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# These lines will be cached. Do not modify the content or orderings unless necessary.
WORKDIR /app
EXPOSE 3000
RUN apt update
RUN apt install -y gcc musl-dev
RUN apt install -y libjpeg-dev g++ # For Pillow and numpy python3-dev zlib-dev
RUN apt install -y libhdf5-dev libnetcdf-dev gdal-bin libgdal-dev libpq-dev
# Cached line end.

COPY requirements.txt requirements.txt
# No longer needed if proxy is set correctly. Remember to use sudo -E ./bin/develop.sh --start port
# RUN pip config set global.index-url https://pypi.douban.com/simple/
RUN pip install uwsgi numpy==1.22.2
# Gdal must be installed after numpy
RUN pip install -r /app/requirements.txt
# Copy codes in the end is to improve caching
COPY . .