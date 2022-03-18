import * as React from 'react';
import {Slider, SliderThumb, styled} from '@mui/material';

export interface ISKSliderProps {
}
interface SKThumbComponentProps extends React.HTMLAttributes<unknown> {}

export function SKThumbComponent(props: SKThumbComponentProps) {
  const {children, ...other} = props;
  return (
    <SliderThumb {...other}>
      {children}
      <span className="airbnb-bar" />
      {/*<span className="airbnb-bar" />*/}
      {/*<span className="airbnb-bar" />*/}
    </SliderThumb>
  );
}

const SKSlider = styled(Slider)(({theme}) => ({
  // 'color': '#e18a19',
  'height': 3,
  'padding': '13px 0',
  '& .MuiSlider-thumb': {
    'height': 30,
    'width': 8,
    'borderRadius': '0',
    'backgroundColor': '#fff',
    'border': '2px solid currentColor',
    '&:hover': {
      boxShadow: '0 0 0 8px rgba(58, 133, 137, 0.16)',
    },
    '& .airbnb-bar': {
      height: 9,
      width: 1,
      backgroundColor: 'currentColor',
      marginLeft: 1,
      marginRight: 1,
    },
  },
  '& .MuiSlider-track': {
    height: 8,
    borderRadius: '0',
  },
  '& .MuiSlider-rail': {
    color: theme.palette.mode === 'dark' ? '#bfbfbf' : '#d8d8d8',
    opacity: theme.palette.mode === 'dark' ? undefined : 1,
    height: 5,
    borderRadius: '0',
  },
}));
export default SKSlider;
