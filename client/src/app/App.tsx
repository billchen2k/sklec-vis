import React from 'react';
import '@/styles/index.scss';
import {ThemeProvider} from '@mui/material';
import config from '@/config';
import {BrowserRouter} from 'react-router-dom';
import AppRoutes from '@/app/AppRoutes';
import AppHeaders from '@/app/AppHeaders';
import {Provider, ReactReduxContext} from 'react-redux';
import {store} from '@/store';
import GlobalSnackBar from '@/components/elements/GlobalSnackBar';
import GlobalDialog from '@/components/elements/GlobalDialog';

export interface IAppProps {
}

const App = (props: IAppProps) => {
  return (
    <ThemeProvider theme={config.theme}>
      <Provider store={store}>
        <AppHeaders />
        <GlobalSnackBar />
        <GlobalDialog />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </Provider>
    </ThemeProvider>
  );
};

export default App;
