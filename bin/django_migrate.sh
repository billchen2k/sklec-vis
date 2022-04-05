#!/bin/zsh

echo 'Migrating Django...'
docker exec -it sklecvis-server python manage.py makemigrations
docker exec -it sklecvis-server python manage.py migrate