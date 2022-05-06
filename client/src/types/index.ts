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
}

export interface IDataset {
  created_at: string;
  created_by: string;
  dataset_type: DatasetType;
  datetime_end: Date;
  datetime_start: Date;
  description: string;
  detail: string;
  is_active: Boolean;
  is_coordinated: Boolean;
  is_deleted: Boolean;
  is_public: Boolean;
  latitude: number;
  longitude: number;
  name: string;
  tags: any[];
  updated_at: string;
  vis_files?: IVisFile[];
  raw_files?: any[];
  meta_data: any;
  uuid: string;
}
