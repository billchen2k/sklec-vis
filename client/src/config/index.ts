import {createTheme} from '@mui/material';
import {blueGrey, cyan} from '@mui/material/colors';

const config = {
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
  API: 'http://localhost:3000',
};

export default config;

