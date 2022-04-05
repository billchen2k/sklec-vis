import * as React from 'react';
import {Box, SxProps} from '@mui/material';
import DataDetails from '@/components/sidebar/DataDetails';
import {useNavigate} from 'react-router-dom';
import {useAppSelector} from '@/app/hooks';
import DatasetList from '@/components/sidebar/DatasetList';
import demoData from '@/lib/demoData';

export interface ISidebarProps {
  sx?: SxProps;
}

const Sidebar = (props: ISidebarProps) => {
  const {globalState, currentData, currentType, rasterState, datasetDetailCache} = useAppSelector((state) => state.site);

  let sidebarContent = null;
  let detailContent = null;

  switch (globalState) {
    case 'data-listing':
      sidebarContent = (
        <DatasetList />
      );
      break;
    case 'data-inspecting':
      if (Object.keys(demoData).includes(String(currentData))) {
        // DEMO DATA
        detailContent = (
          <DataDetails
            meta={demoData[currentData as string]['meta']}
            datasetName={demoData[currentData as string]['name']}
            downloadLink={demoData[currentData as string]['downloadLink']}
          />
        );
      } else if (datasetDetailCache) {
        detailContent = (
          <DataDetails
            meta={datasetDetailCache['meta_data']}
            datasetName={datasetDetailCache['name']}
            description={datasetDetailCache['description']}
            downloadLink={datasetDetailCache['raw_files'].length > 0 ? datasetDetailCache['raw_files'][0]['file'] : null}
          />
        );
      }
      sidebarContent = (
        <Box sx={{p: 2}}>
          {detailContent}
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
