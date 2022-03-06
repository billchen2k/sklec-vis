import * as React from 'react';
import {AppBar, Box} from '@mui/material';
import SKToolbar from '@/components/elements/Toolbar';
import Sidebar from '@/components/elements/Sidebar';
import BaseMap from '@/components/BaseMap';
import {Outlet} from 'react-router-dom';
import config from '@/config';

export interface IBaseProps {

}

const Base = (props: IBaseProps) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box className={'app'}>
      <AppBar position='fixed'>
        <SKToolbar sidebarOpen={sidebarOpen}
          onToggleOpen={toggleSidebar}
        ></SKToolbar>
      </AppBar>
      <Box sx={{
        display: 'flex',
        flexDirection: 'row',
        height: 'calc(100vh - 64px)',
        pt: '64px',
        width: '100vw',
        overflow: 'hidden',
      }} >
        {sidebarOpen &&
         <Sidebar sx={{
           minWidth: config.appearance.sideBarWidth,
           height: '100vh',
         }} />
        }

        <Box component={'main'}
          sx={{
            flexGrow: 1,
            height: '100vh',
            position: 'relative',
          }}>
          <BaseMap />
          <Outlet />
        </Box>
      </Box>


    </Box>
  );
};

export default Base;
