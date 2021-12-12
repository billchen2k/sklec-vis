import * as React from 'react';
import {Box} from '@mui/material';
import LineChart from '@/components/charts/LineChart';

type VisualizerProps = {};

type VisualizerState = {};

export class Visualizer extends React.Component<VisualizerProps, VisualizerState> {
  constructor(props: VisualizerProps) {
    super(props);
    this.state = {};
  }

  render() {
    const texts = [...Array<number>(24).keys()].map((one: number) => <Box sx={{paddingY: '12px'}} key={one}>Content</Box>);
    return (
      <Box className={'vis-panel'}>
        {/* <LineChart link={'dataset/CTD_201283_20201111_1520.csv'} xlabel={'Time'} type={'csv'}></LineChart>*/}
        <LineChart link={'dataset/ADCP_202009-10.csv'} xlabel={'DateTime'} type={'csv'}></LineChart>
      </Box>
    );
  }
}
