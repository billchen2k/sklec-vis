import * as React from 'react';
import {Box} from '@mui/material';

export interface IBoyLayerProps {
  mode: 'inset' | 'full';
  content?: React.ReactNode;
  children?: React.ReactNode;
}

const LayerBox = (props: IBoyLayerProps) => {
  let className = '';
  let childClassName = '';

  switch (props.mode) {
    case 'inset':
      className = 'layer-wrapper-insect';
      childClassName = 'layer-content-insect';
      break;
    case 'full':
      className = 'layer-wrapper-full';
      childClassName = 'layer-content-full';
      break;
  }

  return (
    <Box className={className}>
      <Box className={childClassName}>
        {props.content || props.children}
      </Box>
    </Box>
  );
};

export default LayerBox;
