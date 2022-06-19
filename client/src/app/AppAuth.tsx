import {endpoints} from '@/config/endpoints';
import authSlice from '@/store/authSlice';
import {uiSlice} from '@/store/uiSlice';
import {IUser} from '@/types';
import {IAuthErrorResponse, IModelListResponse, ITokenResponse} from '@/types/api';
import useAxios from 'axios-hooks';
import * as React from 'react';
import {useAppDispatch, useAppSelector} from './hooks';

export interface IAppAuthProps {
}

export function AppAuth(props: IAppAuthProps): any {
  const auth = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [refreshed, setRefreshed] = React.useState(false);

  const [{data, loading, error, response}, executeRefresh] = useAxios<ITokenResponse & IAuthErrorResponse>({
    ...endpoints.postRefreshToken(),
  }, {manual: true});

  const [profileResult, executeProfile] = useAxios<Partial<{
    success: boolean;
    data: IUser;
    message: string;
  }>>({
    ...endpoints.getUserProfile(),
  }, {manual: true});

  React.useEffect(() => {
    if (!refreshed) {
      executeRefresh();
      setRefreshed(true);
    }
  }, [refreshed, executeRefresh]);

  React.useEffect(() => {
    if (!loading && !error && data) {
      if (response.status == 200) {
        dispatch(authSlice.actions.loggedIn({
          accessToken: data.access,
          refreshToken: data.refresh,
        }));
        executeProfile();
      }
    } else if (!loading && error) {
      // Token invalid
      dispatch(authSlice.actions.loggedOut());
    }
  }, [data, loading, error, response, dispatch]);

  React.useEffect(() => {
    if (auth.isAuthorized) {
      executeProfile();
    }
  }, [auth.isAuthorized, executeProfile]);

  React.useEffect(() => {
    if (profileResult.data && !profileResult.loading) {
      dispatch(authSlice.actions.setUserObj(profileResult.data.data));
    }
  }, [profileResult, dispatch]);
  return null;
}
