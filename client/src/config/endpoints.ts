import {AxiosRequestConfig} from 'axios';
import {IResponse, IVQDataStreamResData} from '@/types/api';

const API_ROOT = '/api';

export const endpoints = {
  getDatasetList: (): AxiosRequestConfig<any> => {
    return {
      url: `${API_ROOT}/dataset/`,
      method: 'GET',
    };
  },
  getDatasetDetail: (uuid: string): AxiosRequestConfig<any> => {
    return {
      url: `${API_ROOT}/dataset/${uuid}/`,
      method: 'GET',
    };
  },
  getVisdataContent: (uuid: string, allChannels: boolean, datetimeStart: Date, datetimeEnd: Date, channels: string[]): AxiosRequestConfig<any> => {
    return {
      url: `${API_ROOT}/viscontent/${uuid}/`,
      method: 'GET',
      params: {
        datetime_start: datetimeStart && datetimeStart.toISOString(),
        datetime_end: datetimeEnd && datetimeEnd.toISOString(),
        all_channels: allChannels,
        channels: channels,
      },
    };
  },
  postVQDataStream: (latLngs: L.LatLng[], radius: number, datasetUUID?: string, visFileUUID?: string[]):
    AxiosRequestConfig<any> => {
    if (visFileUUID && datasetUUID) {
      console.warn('Both visFileUUID and datasetUUID are set. Only visFileUUID will be used.');
    }
    return {
      url: `${API_ROOT}/viscontent/vqdatastream/`,
      method: 'POST',
      // headers: {
      //   'X-CSRFToken': document.cookie.split('csrftoken=')[1].split(';')[0],
      // },
      data: {
        lat_lngs: latLngs,
        radius: radius,
        visfile_uuid: visFileUUID,
        dataset_uuid: datasetUUID,
      },
    };
  },
};
