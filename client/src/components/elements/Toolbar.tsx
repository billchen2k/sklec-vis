import * as React from 'react';
import {Box, IconButton, Typography} from '@mui/material';
import {Toolbar} from '@mui/material';
import {Menu as MenuIcon} from '@mui/icons-material';

export interface ISKToolbarProps {
  sidebarOpen: boolean;
  onToggleOpen: () => any;
}

const SKToolbar = (props: ISKToolbarProps) => {
  return (
    <Toolbar>
      <IconButton
        edge='start'
        color='inherit'
        onClick={props.onToggleOpen}
        sx={{
          marginRight: '24px',
          transition: 'all 0.3s ease-out',
        }}
      >
        <MenuIcon />
      </IconButton>
      <Typography variant={'h6'}>
        SKLEC Spatial-temporal Data Visualization
      </Typography>
      <Box sx={{flexGrow: 1}} />
    </Toolbar>
  );
};

export default SKToolbar;
