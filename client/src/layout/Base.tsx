import * as React from 'react';
import {AppBar, Box, LinearProgress} from '@mui/material';
import SKToolbar from '@/components/elements/Toolbar';
import Sidebar from '@/components/sidebar/Sidebar';
import BaseMap from '@/components/map/BaseMap';
import {Outlet} from 'react-router-dom';
import config from '@/config';
import {useAppSelector} from '@/app/hooks';
import {orange} from '@mui/material/colors';

export interface IBaseProps {

}

const Base = (props: IBaseProps) => {
  const {isLoading} = useAppSelector((state) => state.ui);
  const {globalState} = useAppSelector((state) => state.site);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [sidebarWidth, setSidebarWidth] = React.useState<number>(config.appearance.sideBarWidth);

  const sidebarRef = React.useRef<HTMLDivElement>(null);

  const onSidebarControlDown = React.useCallback(
      (event) => {
        const startWidth = sidebarWidth;
        const startPosition = {
          x: event.pageX,
          y: event.pageY,
        };
        const onMouseMove = (event: MouseEvent) => {
        // @ts-ignore
          setSidebarWidth(Number(startWidth - startPosition.x + event.pageX));
        };
        const onMouseUp = () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      }, [sidebarWidth]);


  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  const isManaging = globalState == 'managing';

  return (
    <Box className={'app'}>
      <AppBar position='fixed' color={isManaging ? 'warning' : 'primary'}
        sx={{height: config.appearance.appBarHeight}}>
        <SKToolbar sidebarOpen={sidebarOpen}
          onToggleOpen={toggleSidebar}
        ></SKToolbar>
        {isLoading && <LinearProgress variant='indeterminate' color={'info'} sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1,
        }}/>}
      </AppBar>
      <Box sx={{
        display: 'flex',
        flexDirection: 'row',
        height: 'calc(100vh - 48px)',
        pt: '48px',
        width: '100vw',
        overflow: 'hidden',
      }} >
        {sidebarOpen &&
         <Sidebar
           sx={{
             //  minWidth: config.appearance.sideBarWidth,
             //  width: config.appearance.sideBarWidth,
             minWidth: sidebarWidth,
             width: sidebarWidth,
             height: '100vh',
             overflowY: 'scroll',
           }} />
        }
        {sidebarOpen &&
        // @ts-ignore
          <Box sx={{
            'height': '100vh',
            'width': '5px',
            'background': '#CCCCCC',
            'transition': 'all 0.2s',
            'cursor': 'col-resize',
            ':hover': {
              background: '#919191',
            },
          }}
          onMouseDown={onSidebarControlDown}
          />
        }
        <Box component={'main'}
          sx={{
            flexGrow: 1,
            height: '100vh',
            position: 'relative',
          }}>
          <Outlet />
          <BaseMap>
          </BaseMap>
        </Box>
      </Box>
    </Box>
  );
};

export default Base;
