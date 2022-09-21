/* eslint-disable camelcase */
/**
 * RT = Raster files
 * NCF = NetCDF files
 * RBR = RBR files
 * GNR = General Files
 */
export type DatasetType = 'RT' | 'NCF' | 'TABLE' | 'RBR' | 'TABLE' | 'GNR';

export interface IYLableGroupingItem {
  order: number;
  name: string;
  labels: string[];
}

export interface IGroupingResult {
    grouped: IYLableGroupingItem[];
    ungrouped: string[];
};

export type IFileFormat = 'tiff' | 'ncf' | 'rsk' | 'csv' | 'other';
export interface IVisFile {
  data_channels: any[];
  file: string;
  uuid: string;
  file_name: string;
  file_size: number;
  format: IFileFormat;
  default_sample_count: number;
  meta_data: any;
  first_dimension_name: string;
  is_georeferenced: boolean;
  georeferenced_type: string;
  longitude1: number;
  latitude1: number;
  longitude2: number;
  latitude2: number;
  datetime_start: string;
  datetime_end: string;
  display_name?: string;
}

export interface INCFContentFile extends IVisFile {
  min_value:| number;
  max_value:| number;
}

export interface IDataset {
  created_at: string;
  created_by: string | IUser;
  dataset_type: DatasetType;
  datetime_end: Date;
  datetime_start: Date;
  description: string;
  detail: string;
  is_active: boolean;
  is_coordinated: boolean;
  is_deleted: boolean;
  is_public: boolean;
  latitude: number;
  longitude: number;
  name: string;
  tags: IDatasetTag[];
  updated_at: string;
  vis_files?: IVisFile[];
  raw_files?: any[];
  meta_data: any;
  uuid: string;
}

export interface Mark {
  value: number;
  label?: React.ReactNode;
}

export interface IDatasetTag {
  uuid: string;
  name: string;
  full_name: string;
  description: string;
  parent: | string | IDatasetTag;
  fa_icon: string;
  color: string;
  level?: number; // The level of the tag, starting from 0;
}

export interface IDatasetTagForRender extends IDatasetTag {
  level? :number;
}

export interface IUser {
  username: string;
  user_email: string;
  login_time: string;
  _state: string;
  id: number;
  uuid: string;
  display_name: string;
  affiliation: string;
  country: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  is_deleted: boolean;
}
