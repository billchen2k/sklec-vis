import {IUser} from '@/types';
import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import Cookies from 'js-cookie';

export type IAuthorizationState = {
    isAuthorized: boolean;
    accessToken: | string;
    userobj: Partial<IUser>;
}

const initState: IAuthorizationState = {
  isAuthorized: false,
  accessToken: '',
  userobj: {},
};

const authSlice = createSlice({
  name: 'auth',
  initialState: initState,
  reducers: {
    loggedIn: (state: IAuthorizationState, action: PayloadAction<{
          accessToken: string;
          refreshToken: string;
      }>) => {
      state.isAuthorized = true;
      state.accessToken = action.payload.accessToken;
      Cookies.set('sklecvis_refresh_token', action.payload.refreshToken,
          {expires: 7},
      );
      console.log('Cookies set.');
    },
    loggedOut: (state: IAuthorizationState) => {
      state.isAuthorized = false;
      state.accessToken = '';
      state.userobj = {};
      Cookies.remove('sklecvis_refresh_token');
      console.log('Cookie cleared.');
    },
    setUserObj: (state: IAuthorizationState, action: PayloadAction<IUser>) => {
      state.userobj = action.payload;
    },
  },
},
);

export default authSlice;
