import * as React from 'react';
import {Typography} from '@mui/material';
import {Toolbar} from '@mui/material';

export interface ISKToolbarProps {
}

const SKToolbar = (props: ISKToolbarProps) => {
  return (
    <Toolbar>
      <Typography variant={'h6'}>
        SKLEC Spatial-temporal Data Visualization
      </Typography>
    </Toolbar>
  );
};

export default SKToolbar;
