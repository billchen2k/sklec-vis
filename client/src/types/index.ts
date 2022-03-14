export type DatasetType = 'raster' | 'ncf' | 'table';

export interface IYLableGroupingItem {
  order: number;
  name: string;
  labels: string[];
}

export interface IGroupingResult {
    grouped: IYLableGroupingItem[];
    ungrouped: string[];
  };
