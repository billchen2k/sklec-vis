import * as React from 'react';
import {Box} from '@mui/material';

type VisualizerProps = {};

type VisualizerState = {};

export class Visualizer extends React.Component<VisualizerProps, VisualizerState> {
  constructor(props: VisualizerProps) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <Box className={'vis-panel'}>
        <span>Container content</span>
        <span>Container content</span>
      </Box>
    );
  }
}
