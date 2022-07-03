import {createTheme, SnackbarOrigin} from '@mui/material';
import {blueGrey, cyan} from '@mui/material/colors';

const config = {
  version: '0.1.0',
  // MuiThemeProvider options
  theme: createTheme({
    palette: {
      mode: 'light',
      primary: blueGrey,
      secondary: cyan,
    },
    typography: {
      fontFamily: 'Roboto, Helvetica, -apple-system, Segoe UI, Helvetica Neue, Arial',
      fontSize: 12,
    },
  }),
  appearance: {
    sideBarWidth: 380,
    appBarHeight: '48px',
    snackBarAutoHideDuration: 5000, // in ms
    snackBarAnchorOrigin: {
      vertical: 'bottom',
      horizontal: 'right',
    } as SnackbarOrigin,
  },
  API: '/api',
  map: {
    apiToken: 'pk.eyJ1IjoiYmlsbGNoZW4yayIsImEiOiJja3R2MDBwNWgyNDljMnBvMmdzbnU0dTZ5In0.To49SgD0gHYceQ8Ap2BG3g',
  },
};

export default config;

