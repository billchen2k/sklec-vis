import * as React from 'react';
import {Box, Drawer, IconButton, Stack, SxProps, Typography} from '@mui/material';
import DataMetaInfo from '@/components/sidebar/DataMetaInfo';
import {useNavigate} from 'react-router-dom';
import {ArrowBack} from '@mui/icons-material';
import {useAppSelector} from '@/app/hooks';
import DatasetList from '@/components/sidebar/DatasetList';

export interface ISidebarProps {
  sx?: SxProps;
}

const demoData: { [key: string]: any } = {
  '1': {
    name: 'ADCP_202009-10',
    meta: {
      'Instrument': '201283',
      'Sensors': 'Serial K175067, Channel 1',
      'Sampling Period': '10000',
      'Longitude': '122˚13`5.60"',
      'Latitude': '31˚04`4.00"',
      'File Version': '1.0',
      'Ruskin Version': '1.0',
    },
    downloadLink: '',
  },
  '2': {
    name: 'CTD_201283_20201111_1520',
    meta: {
      'Instrument': '201283',
      'Sensors': 'Serial K175067, Channel 1',
      'Sampling Period': '10000',
      'Longitude': '122˚13`5.60"',
      'Latitude': '31˚04`4.00"',
      'File Version': '1.0',
      'Ruskin Version': '1.0',
    },
    downloadLink: '',
  },
  '3': {
    name: 'RDI_S3A_20200220',
    meta: {
      'Instrument': '201283',
      'Sensors': 'Serial K175067, Channel 1',
      'Sampling Period': '10000',
      'Longitude': '122˚13`5.60"',
      'Latitude': '31˚04`4.00"',
      'File Version': '1.0',
      'Ruskin Version': '1.0',
    },
    downloadLink: '',
  },
};

const Sidebar = (props: ISidebarProps) => {
  const navigate = useNavigate();
  const {globalState, currentData, currentType} = useAppSelector((state) => state.site);

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
          <DataMetaInfo
            meta={demoData[currentData as string]['meta']}
            datasetName={demoData[currentData as string]['name']}
            downloadLink={''}
          />
        </Box>

      );
      break;
  }

  return (
    <Box sx={props.sx}>
      {sidebarContent}
    </Box>
  );
};

export default Sidebar;
