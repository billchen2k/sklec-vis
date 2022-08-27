/* eslint-disable camelcase */
export interface IResponse<T extends {}> {
  success: boolean;
  message?: string;
  error?: any;
  data: T;
}

export interface IModelListResponse<T> {
  count: number;
  next: string;
  last: string;
  results: T[];
}

export interface IVQDataStreamResData {
  date_data: string[];
  stream_data: number[][];
  lat_lngs: L.LatLng[];
}

export interface ITokenResponse {
  access: string;
  refresh: string;
}

export interface IAuthErrorResponse {
  detail: string;
  code: string;
}
