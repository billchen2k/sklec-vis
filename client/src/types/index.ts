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
