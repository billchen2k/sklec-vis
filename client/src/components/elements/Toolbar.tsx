import * as React from 'react';
import {Box, Button, IconButton, Link, Toolbar, Typography} from '@mui/material';
import {Menu as MenuIcon} from '@mui/icons-material';
import config from '@/config';
import {useAppDispatch, useAppSelector} from '@/app/hooks';
import {uiSlice} from '@/store/uiSlice';

export interface ISKToolbarProps {
  sidebarOpen: boolean;
  onToggleOpen: () => any;
}

const SKToolbar = (props: ISKToolbarProps) => {
  const loadingText = useAppSelector((state) => state.ui.loadingText);
  const dispatch = useAppDispatch();

  const aboutDialogContent = (<div>
    <div>
      <Box sx={{textAlign: 'center', ma: 2, pb: 3}}>
        <img src={'/android-chrome-192x192.png'}
          style={{opacity: 0.6, filter: 'saturate(0.8)'}}
          width={'96'} />
      </Box>
      <Typography variant={'body1'}>
          SKLEC Spatial-temporal Data Visualization System.
      </Typography>

      <Typography variant={'body1'}>
        <br /> Version: {config.version}
      </Typography>
      <Typography variant={'body1'}>
        <b>East China Normal University</b> <br />
        State Key Laboratory of Estuarine and Coastal Research <br/>
        School of Computer Science and Technology <br />
        2021.11 - {new Date().getFullYear()}.{new Date().getMonth() + 1}, All Rights Reserved.
      </Typography>
      <Typography variant={'body1'}>
        Contact: <Link href={'mailto:jtchen@stu.ecnu.edu.cn'}>jtchen@stu.ecnu.edu.cn</Link>
      </Typography>
    </div>
  </div>);

  return (
    <Toolbar variant={'dense'}
      sx={{height: config.appearance.appBarHeight}}>
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
      <Typography variant={'caption'} sx={{m: 2}}>
        <i>{loadingText}</i>
      </Typography>
      <Box sx={{flexGrow: 1}} />
      <Button variant={'outlined'} sx={{color: 'white'}}
        onClick={() => {
          dispatch(uiSlice.actions.openDialog({
            type: 'simple',
            title: 'About',
            content: aboutDialogContent,
          }));
        }}>
        About
      </Button>
    </Toolbar>
  );
};

export default SKToolbar;
