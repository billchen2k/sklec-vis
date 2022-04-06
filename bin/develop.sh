if [ "$1" = "--start" ]; then
  echo "Starting develop..."
  # Collect python requirements.
#  python -m pipreqs.pipreqs ./server --force
  docker-compose -f docker-compose.dev.yml build
  docker-compose -f docker-compose.dev.yml up
  docker exec -it sklecvis-server python manage.py makemigrations
  docker exec -it sklecvis-server python manage.py migrate
  docker exec -it sklecvis-server python manage.py collectstatic --noinput
elif [ "$1" = "--stop" ]; then
  echo "Stopping develop...."
  docker-compose -f docker-compose.dev.yml down
  kill $(ps aux | grep 'node ./bin/develop.js' | awk '{print $2}')
elif [ "$1" = "--migrate" ]; then
  echo "Migrating develop...."
  docker exec -it sklecvis-server python manage.py makemigrations
  docker exec -it sklecvis-server python manage.py migrate
  docker exec -it sklecvis-server python manage.py collectstatic --noinput
else
  echo "Usage: ./develop.sh [--start|--stop|--migrate]"
fi