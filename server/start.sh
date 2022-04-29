#!/bin/sh

python manage.py collectstatic --noinput
uwsgi --ini uwsgi.ini --py-autoreload 1 --socket :3000 --plugins python3