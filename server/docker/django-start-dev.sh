#!/bin/sh

python manage.py makemigrations
python manage.py migrate
python manage.py collectstatic --noinput

pip install ipython # for debugging
uwsgi --ini uwsgi.ini --py-autoreload 1 --socket :3000 --plugins python3