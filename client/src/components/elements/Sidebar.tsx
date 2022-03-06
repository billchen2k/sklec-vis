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

  return (
    <Box sx={props.sx}>
      <Box padding={2}>
        <Stack sx={{mb: 2}} spacing={'1'} direction={'row'} alignItems={'center'}>
          <IconButton>
            <ArrowBack onClick={() => navigate('/')} />
          </IconButton>
          <Typography variant={'h5'}>Dataset Name</Typography>
        </Stack>
        <DataMetaInfo meta={demoMetaData}></DataMetaInfo>
      </Box>
    </Box>
  );
};

export default Sidebar;
