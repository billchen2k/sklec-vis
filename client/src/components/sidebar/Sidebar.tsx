import * as React from 'react';
import {Box, ButtonGroup, Drawer, IconButton, Stack, SxProps, Typography} from '@mui/material';
import DataDetails from '@/components/sidebar/DataDetails';
import {useNavigate} from 'react-router-dom';
import {ArrowBack} from '@mui/icons-material';
import {useAppSelector} from '@/app/hooks';
import DatasetList from '@/components/sidebar/DatasetList';
import $ from 'jquery';
import {useEffect} from 'react';
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
    downloadLink: '/dataset/ADCP_202009-10.csv',
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
    downloadLink: '/dataset/CTD_201283_20201111_1520.csv',
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
    downloadLink: '/dataset/sentinel3/RDI_S3A_20200220_VIS.tiff',
  },
};

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
