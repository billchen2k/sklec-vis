import * as React from 'react';
import {Box, Drawer, IconButton, Stack, SxProps, Typography} from '@mui/material';
import DataMetaInfo from '@/components/meta/DataMetaInfo';
import {useNavigate} from 'react-router-dom';
import {ArrowBack} from '@mui/icons-material';

export interface ISidebarProps {
  sx?: SxProps;
}

const Sidebar = (props: ISidebarProps) => {
  const navigate = useNavigate();

  const demoMetaData = {
    'Instrument': '201283',
    'Sensors': 'Serial K175067, Channel 1',
    'Sampling Period': '10000',
    'Longitude': '122˚13\'5.60"',
    'Latitude': '31˚04\'4.00"',
  };

  const rdiMeta = {

  };

  return (
    <Box sx={props.sx}>
      <Box padding={2}>
        <DataMetaInfo meta={demoMetaData}
          datasetName={'ADCP_202009-10'}
          link={'/view/1'}
        ></DataMetaInfo>
      </Box>
    </Box>
  );
};

export default Sidebar;
