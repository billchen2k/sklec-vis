import React from 'react';
import '@/styles/index.scss';
import {ThemeProvider} from '@mui/material';
import config from '@/config';
import {BrowserRouter} from 'react-router-dom';
import AppRoutes from '@/app/AppRoutes';
import AppHeaders from '@/app/AppHeaders';
import {Provider, ReactReduxContext} from 'react-redux';
import {store} from '@/store';

export interface IAppProps {
}

const App = (props: IAppProps) => {
  return (
    <ThemeProvider theme={config.theme}>
      <Provider store={store}>
        <AppHeaders />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </Provider>

    </ThemeProvider>
  );
};

export default App;
