#!/bin/bash
function usage() {
  echo "Usage: ./sklecvis-cli.sh [--ncf] [FILEPATH] [DATASET_UUID]"
}

if [ "$1" = "--ncf" ]; then
  docker exec -it $(logname)-server python ./scripts/ncf_feeder.py -f "$2" -d "$3"
else
  usage && exit 1
fi