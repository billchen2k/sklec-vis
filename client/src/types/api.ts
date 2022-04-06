export interface IResponse<T extends {}> {
  success: boolean;
  message?: string;
  error?: any;
  data: T;
}

export interface IVQDataStreamResData {
  date_data: string[];
  stream_data: number[][];
  lat_lngs: L.LatLng[];
}
