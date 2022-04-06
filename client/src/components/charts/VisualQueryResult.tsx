import * as React from 'react';
import {Box, Card, IconButton, LinearProgress, Typography} from '@mui/material';
import {useAppDispatch, useAppSelector} from '@/app/hooks';
import LayerBox from '@/layout/LayerBox';
import {useEffect} from 'react';
import {Close} from '@mui/icons-material';
import useAxios from 'axios-hooks';
import {endpoints} from '@/config/endpoints';
import {IResponse, IVQDataStreamResData} from '@/types/api';
import {uiSlice} from '@/store/uiSlice';
import * as d3 from 'd3';
import {VisualQueryResultPainter} from '@/lib/map/VisualQueryResultPainter';

export interface IVisualQueryResultProps {
}

const VisualQueryResult = (props: IVisualQueryResultProps) => {
  const dispatch = useAppDispatch();
  const {currentType, currentData, rasterState} = useAppSelector((state) => state.site);
  const [localVQLatLngs, setLocalVQLatLngs] = React.useState<any[]>([]);

  const [{data, loading, error}, executeRequest] = useAxios<IResponse<IVQDataStreamResData>>(endpoints.postVQDataStream(
      localVQLatLngs, 3, currentData as string));

  const calcBounds = (rasterMin: number, rasterMax: number) => {
    const range = rasterMax - rasterMin;
    const min = rasterMin - range;
    const max = rasterMax + range * 2.5;
    return [0, max];
  };

  useEffect(() => {
    if (rasterState.visualQueryLatLngs.length > 0) {
      setLocalVQLatLngs(rasterState.visualQueryLatLngs);
    }
  }, [rasterState.visualQueryLatLngs]);

  // d3 magic
  useEffect(() => {
    if (!data || localVQLatLngs.length == 0) return;
    console.log(data);
    const bounds = calcBounds(rasterState.config.rasterMin || 0.8, rasterState.config.rasterMax || 0.15);
    const painter = new VisualQueryResultPainter('visual-query-container',
        data.data.stream_data, data.data.date_data, {
          domainBoundLow: bounds[0],
          domainBoundHigh: bounds[1],
          threshAmplitude: (bounds[1] - bounds[0]) / 10,
          threshFluctuation: (bounds[1] - bounds[0]) / 10,
        });
    painter.remove();
    painter.renderDataStream();
  }, [data]);

  if (currentType != 'RT' || !rasterState || localVQLatLngs.length == 0) {
    return (<div></div>);
  }

  if (!loading && error) {
    dispatch(uiSlice.actions.openSnackbar({
      severity: 'error',
      message: 'Error: ' + error.message,
    }));
    return null;
  }

  console.log(data.data);

  return (
    <LayerBox key={'queryresult'} mode={'lb'} opacity={0.95}>
      <Box sx={{width: '36rem', height: '24rem'} }>
        <Box sx={{position: 'absolute', padding: '2rem', top: 0, right: 0}}>
          <IconButton size={'small'}
            onClick={() => {
              setLocalVQLatLngs([]);
            }}>
            <Close />
          </IconButton>
        </Box>
        {loading && <LinearProgress variant={'indeterminate'}/>}
        {!loading &&
            <div>
              <Typography variant={'body2'}><b>Visuql Query Results</b></Typography>
            </div>
        }
        <div id={'visual-query-container'}
          style={{height: '95%', width: '100%'}}
        ></div>

      </Box>

    </LayerBox>
  );
};

export default VisualQueryResult;
