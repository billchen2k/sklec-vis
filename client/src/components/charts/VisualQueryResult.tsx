import * as React from 'react';
import {Box, Button, IconButton, LinearProgress, Stack, Typography} from '@mui/material';
import {useAppDispatch, useAppSelector} from '@/app/hooks';
import LayerBox from '@/layout/LayerBox';
import {useEffect} from 'react';
import {Close, Download} from '@mui/icons-material';
import useAxios from 'axios-hooks';
import {endpoints} from '@/config/endpoints';
import {IResponse, IVQDataStreamResData} from '@/types/api';
import {uiSlice} from '@/store/uiSlice';
import {VisualQueryResultPainter} from '@/lib/map/VisualQueryResultPainter';
import {saveAs} from 'file-saver';
import {currentDateStringShort} from '@/lib/utils';

export interface IVisualQueryResultProps {
}

const VisualQueryResult = (props: IVisualQueryResultProps) => {
  const dispatch = useAppDispatch();
  const {currentType, currentData, rasterState, inspectState, datasetDetailCache} = useAppSelector((state) => state.site);
  const [localVQLatLngs, setLocalVQLatLngs] = React.useState<any[]>([]);
  const painter = React.useRef<VisualQueryResultPainter>(null);
  const [{data, loading, error}, executeRequest] = useAxios<IResponse<IVQDataStreamResData>>({}, {manual: true});

  const calcBounds = (rasterMin: number, rasterMax: number) => {
    const range = rasterMax - rasterMin;
    const min = rasterMin - 0.5 * range;
    const max = rasterMax + range * 2.5;
    return [0, max];
  };

  useEffect(() => {
    if (rasterState.visualQueryLatLngs.length > 0) {
      setLocalVQLatLngs(rasterState.visualQueryLatLngs);
      if (currentType == 'RT') {
        executeRequest(endpoints.postVQDataStream(
            rasterState.visualQueryLatLngs,
            3,
          currentData as string));
      }
      if (currentType == 'NCF') {
        executeRequest(endpoints.postNcfDataStream(
            rasterState.visualQueryLatLngs,
            [datasetDetailCache.vis_files[inspectState.selectedVisFile].uuid],
            datasetDetailCache.vis_files[inspectState.selectedVisFile].meta_data.variables[inspectState.selectedChannel].variable_name,
            1,
        ));
      }
    }
  }, [rasterState.visualQueryLatLngs, currentData, inspectState, currentType]);

  // d3 magic
  useEffect(() => {
    if (!data || localVQLatLngs.length == 0) return;
    console.log(data);
    const bounds = calcBounds(rasterState.config.rasterMin || 0.8, rasterState.config.rasterMax || 0.15);
    painter.current = new VisualQueryResultPainter('visual-query-container',
        data.data.stream_data, data.data.date_data, localVQLatLngs, {
          domainBoundLow: bounds[0],
          domainBoundHigh: bounds[1],
          threshAmplitude: (bounds[1] - bounds[0]) / 10,
          threshFluctuation: (bounds[1] - bounds[0]) / 10,
        });
    painter.current.remove();
    painter.current.renderDataStream();
  }, [data]);

  if (!['RT', 'NCF'].includes(currentType) || !rasterState || localVQLatLngs.length == 0) {
    return (<div></div>);
  }

  if (!loading && error) {
    dispatch(uiSlice.actions.openSnackbar({
      severity: 'error',
      message: 'Error: ' + error.message,
    }));
    return null;
  }

  console.log(data?.data);

  return (
    <LayerBox key={'queryresult'} mode={'lb'} opacity={0.95}>
      <Box sx={{width: '36rem', height: '24rem'} }>
        <Box sx={{position: 'absolute', padding: '2rem', top: '1rem', right: '1rem'}}>
          <IconButton size={'small'}
            onClick={() => {
              setLocalVQLatLngs([]);
            }}>
            <Close />
          </IconButton>
        </Box>
        {loading && <LinearProgress variant={'indeterminate'}/>}
        {!loading &&
            <Stack direction={'row'} spacing={1} alignItems={'center'}>
              <Typography variant={'body2'}><b>Visual Query Results</b></Typography>
              <Button variant={'outlined'} size={'small'}
                startIcon={<Download />}
                onClick={() => {
                  painter.current?.exportResult().then((content) => {
                    saveAs(content, `data_stream_export_${currentDateStringShort()}.zip`);
                    dispatch(uiSlice.actions.openSnackbar({
                      severity: 'success',
                      message: 'Data stream successfully exported.',
                    }));
                  });
                }}>
                  Export
              </Button>
            </Stack>
        }
        <div id={'visual-query-container'}
          style={{height: '95%', width: '100%'}}
        ></div>

      </Box>

    </LayerBox>
  );
};

export default VisualQueryResult;
