# if has --start argument
#   start develop server

# cd client && yarn build && cd .. && docker-compose -f docker-compose.prod.yml up --build

if [ "$1" = "--start" ]; then
  echo "Starting production..."
#  python -m pipreqs.pipreqs ./server --force
  cd client && /usr/local/bin/yarn install && /usr/local/bin/yarn build && cd ..
  docker-compose -f docker-compose.prod.yml build --memory='3g'
  docker-compose -f docker-compose.prod.yml up -d
elif [ "$1" = "--stop" ]; then
  echo "Stopping production...."
  docker-compose -f docker-compose.prod.yml down
  # kill $(ps aux | grep 'node ./bin/develop.js' | awk '{print $2}')
elif [ "$1" = "--init" ]; then
  echo "Initializing production..."
  # Collect python requirements.
  python -m pipreqs.pipreqs ./server --force
  docker-compose -f docker-compose.dev.yml build
  docker-compose -f docker-compose.dev.yml up
  docker exec -it sklecvis-server python manage.py migrate
  docker exec -it sklecvis-server python manage.py collectstatic --noinput
else
  echo "Usage: ./production.sh [--start|--stop|--init]."
  echo "   Production port: 8061 (fixed)"
fi