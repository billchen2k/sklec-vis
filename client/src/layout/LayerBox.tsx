import * as React from 'react';
import {Box, IconButton} from '@mui/material';
import {Fullscreen, FullscreenExit} from '@mui/icons-material';
import {useState} from 'react';
import config from '@/config';

export interface IBoyLayerProps {
  mode: 'inset' | 'full' | 'rb' | 'lb' | 'rt' | 'lt';
  opacity?: number;
  content?: React.ReactNode;
  children?: React.ReactNode;
  allowHidden?: boolean;
}

const LayerBox = (props: IBoyLayerProps) => {
  const [minimize, setMinimize] = useState(false);

  const [position, setPosition] = useState({x: 0, y: 0});
  const boxRef = React.useRef<HTMLDivElement>(null);
  const DRAG_AREA_THRESHOLD = 30;

  // Reference: https://stackoverflow.com/a/68842808/10926869
  const onMouseDown = React.useCallback(
      (event) => {
        const boxElement = boxRef.current;
        if (!boxElement) {
          return;
        }
        // Calculate the Y coornidate relative to the box element.
        //   Ref: https://stackoverflow.com/a/2614472/10926869
        const insideY = event.clientY - boxElement.getBoundingClientRect().top;
        if (insideY >= config.behaviour.layerBoxTopDragAreaPixels) {
          return;
        }
        const onMouseMove = (event: MouseEvent) => {
          position.x += event.movementX;
          position.y += event.movementY;
          // @ts-ignore
          if (insideY < config.behaviour.layerBoxTopDragAreaPixels) {
            event.preventDefault();
            boxElement.style.transform = `translate(${position.x}px, ${position.y}px)`;
          }
          setPosition(position);
        };
        const onMouseUp = () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      },
      [position, setPosition, boxRef],
  );

  const handleMinimizeClicked = (e: React.MouseEvent) => {
    setMinimize(!minimize);
  };

  const className = `layer-wrapper-${props.mode}`;
  const childClassName = minimize ? 'layer-content-minimize': `layer-content-${props.mode}`;

  return (
    <Box
      ref={boxRef}
      onMouseDown={onMouseDown}
      className={className} sx={{
        opacity: props.opacity || 1,
      }} id={'layer-box-wrapper'}>
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
