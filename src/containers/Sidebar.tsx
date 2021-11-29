import * as React from 'react';
import {Box, Typography} from '@mui/material';
import {DataMetaInfo} from '@/components/MetaInfo/DataMetaInfo';

type SidebarProps = {};

type SidebarState = {};

export class Sidebar extends React.Component<SidebarProps, SidebarState> {
  constructor(props: SidebarProps) {
    super(props);
    this.state = {};
  }

  render() {
    const demoMetaData = {
      'Instrument': '201283',
      'Sensors': 'Serial K175067, Channel 1',
      'Sampling Period': '10000',
      'Longtitude': '122˚13\'5.60"',
      'Latitude': '31˚04\'4.00"',
    };
    return (
      <div>
        <Typography mb={'12px'} variant={'h5'} component={'div'}>
          Dataset Name
        </Typography>
        <DataMetaInfo meta={demoMetaData}></DataMetaInfo>
      </div>
    );
  }
}
