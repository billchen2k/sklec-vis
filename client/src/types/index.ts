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
  vis_files?: any[];
  raw_files?: any[];
  meta_data: any;
  uuid: string;
}
