import * as React from 'react';
import {Box, SxProps} from '@mui/material';
import DataDetails from '@/components/sidebar/DataDetails';
import {useNavigate} from 'react-router-dom';
import {useAppSelector} from '@/app/hooks';
import DatasetList from '@/components/sidebar/DatasetList';
import demoData from '@/utils/demoData';

export interface ISidebarProps {
  sx?: SxProps;
}

const Sidebar = (props: ISidebarProps) => {
  const navigate = useNavigate();
  const {globalState, currentData, currentType, rasterState} = useAppSelector((state) => state.site);

  let sidebarContent = null;
  switch (globalState) {
    case 'data-listing':
      sidebarContent = (
        <DatasetList />
      );
      break;
    case 'data-inspecting':
      sidebarContent = (
        <Box sx={{p: 2}}>
          <DataDetails
            meta={demoData[currentData as string]['meta']}
            datasetName={demoData[currentData as string]['name']}
            downloadLink={demoData[currentData as string]['downloadLink']}
          />
        </Box>

      );
      break;
  }

  return (
    <Box sx={props.sx} id={'container-sidebar'}>
      {sidebarContent}
    </Box>
  );
};

export default Sidebar;
