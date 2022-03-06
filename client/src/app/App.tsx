import React from 'react';
import '@/styles/index.scss';
import {ThemeProvider} from '@mui/material';
import config from '@/config';
import {BrowserRouter} from 'react-router-dom';
import AppRoutes from '@/app/AppRoutes';
import AppHeaders from '@/app/AppHeaders';

export interface IAppProps {
}

const App = (props: IAppProps) => {
  return (
    <ThemeProvider theme={config.theme}>
      <AppHeaders />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
