import {DatasetType} from '@/types';

const consts = {
  EVENT: {
    COORDINATE_SELECTED: 'event_coordinate_selected',
    TRIGGER_LOGIN_DIALOG: 'event_trigger_login_dialog',
    DATASET_SELECTED_IN_LIST: 'event_dataset_selected_in_list',
    MAP_FLY_TO: 'event_map_fly_to',
  },
  datasetTypeFullNames: {
    'NCF': 'NetCDF Dataset',
    'RBR': 'Ruskin bouy data',
    'RT': 'Raster file dataset (tiff)',
    'TABLE': 'Simple Tabular datasets (csv, xlsx, etc.)',
    'GNR': 'Other types or general dataset',
  },
};

export default consts;
