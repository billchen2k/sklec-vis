import {AxiosRequestConfig} from 'axios';

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
};
