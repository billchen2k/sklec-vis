#!/bin/zsh

function usage() {
  echo "Usage: ./develop.sh [--start|--stop|--migrate] [port]"
}

export DEV_PORT=$2
export CONTAINER_DB=sklecvis-db
export CONTAINER_CLIENT=$(logname)-client
export CONTAINER_SERVER=$(logname)-server
export CONTAINER_NGINX=$(logname)-nginx
export COMPOSE_PROJECT_NAME=sklec-vis-$(logname)

if [ "$(id -u)" != "0" ]; then
  echo "This script must be run as root." 1>&2
  exit 1
fi

if [ "$1" = "--start" ]; then
  if [ $# -ne "2" ]; then
     usage && exit 1
  fi
  # if port already in use
  if [ -n "$(sudo lsof -i :$DEV_PORT)" ]; then
    echo "Port $DEV_PORT is already in use."
    exit 1
  fi
  echo "Starting develop..."
  # Collect python requirements.
#  python -m pipreqs.pipreqs ./server --force
  docker-compose -f docker-compose.dev.yml build
  docker-compose -f docker-compose.dev.yml up
  docker exec -it $(logname)-server python manage.py makemigrations
  docker exec -it $(logname)-server python manage.py migrate
  docker exec -it $(logname)-server python manage.py collectstatic --noinput
elif [ "$1" = "--stop" ]; then
  if [ $# -ne 2 ]; then
     usage && exit 1
  fi
  echo "Stopping develop...."
  docker-compose -f docker-compose.dev.yml down
  kill $(ps aux | grep 'node ./bin/develop.js' | awk '{print $2}')
elif [ "$1" = "--migrate" ]; then
  echo "Migrating develop...."
  docker exec -it $(logname)-server python manage.py makemigrations
  docker exec -it $(logname)-server python manage.py migrate
  docker exec -it $(logname)-server python manage.py collectstatic --noinput
elif [ "$1" = "--logs" ]; then
  docker-compose -f docker-compose.dev.yml logs -f --tail=100
else
  usage && exit 1
fi