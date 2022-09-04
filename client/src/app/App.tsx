import React, {useEffect} from 'react';
import '@/styles/index.scss';
import {ThemeProvider} from '@mui/material';
import config from '@/config';
import {BrowserRouter} from 'react-router-dom';
import AppRoutes from '@/app/AppRoutes';
import AppHeaders from '@/app/AppHeaders';
import {Provider} from 'react-redux';
import {store} from '@/store';
import GlobalSnackBar from '@/components/elements/GlobalSnackBar';
import GlobalDialog from '@/components/elements/GlobalDialog';
import {AppAuth} from './AppAuth';

export interface IAppProps {
}

const App = (props: IAppProps) => {
  // On app load
  useEffect(() => {
    localStorage.removeItem('selectedTags');
  }, []);
  return (
    <ThemeProvider theme={config.theme}>
      <Provider store={store}>
        <AppHeaders />
        <AppAuth />
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
