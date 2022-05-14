import * as React from 'react';
import {Box, IconButton} from '@mui/material';
import {Fullscreen, FullscreenExit} from '@mui/icons-material';
import {useState} from 'react';
import {DomEvent, DomUtil} from 'leaflet';

export interface IBoyLayerProps {
  mode: 'inset' | 'full' | 'rb' | 'lb' | 'rt';
  opacity?: number;
  content?: React.ReactNode;
  children?: React.ReactNode;
  allowHidden?: boolean;
}

const LayerBox = (props: IBoyLayerProps) => {
  const [minimize, setMinimize] = useState(false);
  const handleMinimizeClicked = (e: React.MouseEvent) => {
    setMinimize(!minimize);
  };

  const className = `layer-wrapper-${props.mode}`;
  const childClassName = minimize ? 'layer-content-minimize': `layer-content-${props.mode}`;

  return (
    <Box className={className} sx={{opacity: props.opacity || 1}} id={'layer-box-wrapper'}>
      <Box className={childClassName}>
        {(props.allowHidden || true) &&
          <Box sx={{position: 'absolute', m: '2rem', top: '0.75rem', left: '0.75rem'}}>
            <IconButton size={'small'}
              onClick={(e) => handleMinimizeClicked(e)}>
              {minimize ? <Fullscreen /> : <FullscreenExit />}
            </IconButton>
          </Box>
        }
        {props.content || props.children}
      </Box>
    </Box>
  );
};

export default LayerBox;
