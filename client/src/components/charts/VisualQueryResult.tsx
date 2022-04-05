import * as React from 'react';
import {Box, Card, Typography} from '@mui/material';
import {useAppSelector} from '@/app/hooks';
import LayerBox from '@/layout/LayerBox';

export interface IVisualQueryResultProps {
}

const VisualQueryResult = (props: IVisualQueryResultProps) => {
  const {currentType, currentData, rasterState} = useAppSelector((state) => state.site);

  if (currentType != 'RT' || !rasterState || rasterState.visualQueryLatLngs.length == 0) {
    return (<div></div>);
  }

  return (
    <LayerBox key={'queryresult'} mode={'lb'}>
      <Box sx={{width: '40rem', height: '30rem', opacity: 0.9} }>
        <Typography variant={'body2'}>
          {JSON.stringify(rasterState.visualQueryLatLngs, null, 2)}
        </Typography>
      </Box>
    </LayerBox>
  );
};

export default VisualQueryResult;
