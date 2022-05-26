#!/bin/sh

python manage.py makemigrations
python manage.py migrate
python manage.py collectstatic --noinput
uwsgi --ini uwsgi.ini --py-autoreload 0 --socket :3000 --plugins python3