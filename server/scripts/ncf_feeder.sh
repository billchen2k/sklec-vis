export PYTHONPATH=../.
export DB_HOST="localhost"
export DB_PORT="5432"
export DB_USERNAME="postgres"
export DB_PASSWORD="4dmnpoH9TvA3KzQW"
export DB_NAME="sklecvis"
python ./ncf_feeder.py --filepath "$1" -d "$2"