import * as React from 'react';
import {Box, Grid} from '@mui/material';
import LineChart from '@/components/charts/LineChart';
import LayerBox from '@/layout/LayerBox';

export interface IVisualizerProps {
}

const DataViewer = (props: IVisualizerProps) => {
  const texts = [...Array<number>(24).keys()].map((one: number) => <Box sx={{paddingY: '12px'}} key={one}>Content</Box>);

  return (
    <LayerBox mode={'inset'}>
      <LineChart link={'dataset/ADCP_202009-10.csv'} xlabel={'DateTime'} type={'csv'}></LineChart>
    </LayerBox>
  );
};

export default DataViewer;
