import {useAppDispatch, useAppSelector, useUser} from '@/app/hooks';
import ToolbarAboutAction from '@/components/elements/ToolbarActions/ToolbarAboutAction';
import ToolbarManageAction from '@/components/elements/ToolbarActions/ToolbarManageAction';
import config from '@/config';
import {siteSlice} from '@/store/siteSlice';
import {Menu as MenuIcon} from '@mui/icons-material';
import {Box, IconButton, Stack, Toolbar, Typography} from '@mui/material';
import * as React from 'react';
import {useNavigate} from 'react-router-dom';
import {ToolbarUserAction} from './ToolbarActions/ToolbarUserAction';

export interface ISKToolbarProps {
  sidebarOpen: boolean;
  onToggleOpen: () => any;
}

const SKToolbar = (props: ISKToolbarProps) => {
  const loadingText = useAppSelector((state) => state.ui.loadingText);
  const {globalState} = useAppSelector((state) => state.site);
  const user = useUser();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleNavigateBack = () => {
    dispatch(siteSlice.actions.enterDataListing());
    navigate('/');
  };


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
      <Typography variant={'h6'} onClick={() => handleNavigateBack()} sx={{cursor: 'pointer'}}>
          SKLEC Spatial-temporal Data Visualization
        {globalState == 'managing' && ' - Management Mode'}
      </Typography>
      <Typography variant={'caption'} sx={{m: 2}}>
        <i>{loadingText}</i>
      </Typography>
      <Box sx={{flexGrow: 1}} />
      <Stack direction={'row'} spacing={1}>
        {['data-listing', 'managing'].includes(globalState) && user?.username &&
          <ToolbarManageAction />
        }
        <ToolbarAboutAction />
        <ToolbarUserAction />
      </Stack>
    </Toolbar>
  );
};

export default SKToolbar;
