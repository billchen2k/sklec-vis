import {IRegisterFormData} from '@/components/dialogs/DialogRegister';
import store from '@/store';
import {IDatasetTag} from '@/types';
import {IModelListResponse} from '@/types/api';
import {AxiosRequestConfig} from 'axios';
import Cookies from 'js-cookie';

const API_ROOT = '/api';

type NCFContentRangeParams = 'datetime_start' | 'datetime_end' |
  'longitude_start' | 'longitude_end' |
  'latitude_start' | 'latitude_end' |
  'depth_start' | 'depth_end' |
  'filesize_limit' | 'filenum_limit' |
  'return_type' | 'res_limit' | 'scalar_format';

const withAuthorization = (config: AxiosRequestConfig) : AxiosRequestConfig => {
  const accessToken = store.getState().auth.accessToken;
  return {...config,
    headers: {
      ...config.headers,
      'Authorization': `Bearer ${accessToken}`,
    },
  };
};

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
  getNcfContent: (uuid: string,
      channel_label: string,
      xparams?: Partial<Record<NCFContentRangeParams, string | number>>): AxiosRequestConfig<any> => {
    return withAuthorization({
      url: `${API_ROOT}/ncfcontent/${uuid}/`,
      method: 'GET',
      params: {
        uuid, channel_label,
        ...xparams,
      },
    });
  },
  getDatasetTagList: (): AxiosRequestConfig<IModelListResponse<IDatasetTag>> => {
    return {
      url: `${API_ROOT}/tags/`,
      method: 'GET',
    };
  },
  postLogin: (username: string, password: string): AxiosRequestConfig<any> => {
    return {
      url: `${API_ROOT}/user/login/`,
      method: 'POST',
      data: {
        username: username,
        password: password,
      },
    };
  },
  postRegister: (registerFormData?: Partial<IRegisterFormData>): AxiosRequestConfig<any> => {
    return {
      url: `${API_ROOT}/user/register/`,
      method: 'POST',
      data: registerFormData,
    };
  },
  postRefreshToken(): AxiosRequestConfig<any> {
    return {
      url: `${API_ROOT}/user/token/refresh/`,
      method: 'POST',
      data: {
        'refresh': Cookies.get('sklecvis_refresh_token'),
      },
    };
  },
  getUserProfile(): AxiosRequestConfig<any> {
    return withAuthorization({
      url: `${API_ROOT}/user/profile/`,
      method: 'GET',
    });
  },
  patchDataset(uuid: string): AxiosRequestConfig<any> {
    return withAuthorization({
      url: `${API_ROOT}/dataset/${uuid}/`,
      method: 'PATCH',
    });
  },
  postUploadRawFile(uuid: string): AxiosRequestConfig<any> {
    return withAuthorization({
      url: `${API_ROOT}/dataset/rawfile/upload/`,
      method: 'POST',
    });
  },
};
