#!/bin/zsh

export DEV_PORT=$2
export CONTAINER_DB=sklecvis-db
export CONTAINER_CLIENT=$(logname)-client
export CONTAINER_SERVER=$(logname)-server
export CONTAINER_NGINX=$(logname)-nginx
export COMPOSE_PROJECT_NAME=sklec-vis-$(logname)
export argc=$#

function usage() {
  echo "Usage: ./develop.sh [--start|--stop|--restart|--migrate] [port]"
}

function start() {
  if [ $argc -ne "2" ]; then
    echo 'Port is needed.'
    usage && exit 1
  fi
  # if port already in use
  if [ -n "$(sudo lsof -i :$DEV_PORT)" ]; then
    echo "Port $DEV_PORT is already in use."
    exit 1
  fi
  echo "Starting develop..."
  # Collect python requirements.
  # python -m pipreqs.pipreqs ./server --force
  docker compose -f docker-compose.dev.yml --env-file .env  build $EXTRA_BUILD_FLAG
    # --build-arg http_proxy=http://172.20.5.126:7890 \
    # --build-arg https_proxy=http://172.20.5.126:7890
  docker compose -f docker-compose.dev.yml --env-file .env up -d
}

function stop() {
  if [ $argc -ne 2 ]; then
    echo 'Port is needed.'
    usage && exit 1
  fi
  echo "Stopping develop...."
  docker compose -f docker-compose.dev.yml down
  kill $(ps aux | grep 'node ./bin/develop.js' | awk '{print $2}')
}

function logs() {
  docker compose -f docker-compose.dev.yml logs -f --tail=100
}

function migrate() {
  echo "Migrating develop...."
  docker exec -it $(logname)-server python manage.py makemigrations
  docker exec -it $(logname)-server python manage.py migrate
  docker exec -it $(logname)-server python manage.py collectstatic --noinput
}

if [ "$(id -u)" != "0" ]; then
  echo "This script must be run as root." 1>&2
  exit 1
fi


if [ "$1" = "--start" ]; then
  export EXTRA_BUILD_FLAG=''
  start
  logs
elif [ "$1" = "--start-no-cache" ]; then
  echo '\033[0;31mStarting without build cache. --no-cache flag will be used during docker compose build\033[0m.'
  export EXTRA_BUILD_FLAG=--no-cache
  start
  logs
elif [ "$1" = "--stop" ]; then
  stop
elif [ "$1" = "--migrate" ]; then
  migrate
elif [ "$1" = "--logs" ]; then
  logs
elif [ "$1" = "--restart" ]; then
  stop
  start
  logs
else
  usage && exit 1
fi