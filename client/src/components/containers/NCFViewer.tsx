import {useAppDispatch, useAppSelector} from '@/app/hooks';
import {endpoints} from '@/config/endpoints';
import LayerBox from '@/layout/LayerBox';
import {uiSlice} from '@/store/uiSlice';
import {IDataset, IVisFile} from '@/types';
import {Box, Typography} from '@mui/material';
import useAxios from 'axios-hooks';
import * as React from 'react';
import {useEffect} from 'react';
import {errorMonitor} from 'stream';
import RasterControl from '../charts/RasterControl';

export interface INCFViewerProps {
    data: IDataset
}

export function NCFViewer(props: INCFViewerProps) {
  const dispatch = useAppDispatch();
  const {selectedVisFile, selectedChannel} = useAppSelector((state) => state.site.inspectState);
  console.log(props.data);
  console.log(selectedVisFile);

  const [{data, loading, error}, execute] = useAxios(
      endpoints.getNcfContent('', ''),
      {
        manual: true,
      });

  useEffect(() => {
    if (loading) {
      dispatch(uiSlice.actions.beginLoading('Generating NCF preview data...'));
    } else {
      dispatch(uiSlice.actions.endLoading());
    }
    if (error) {
      dispatch(uiSlice.actions.openSnackbar({
        message: `Error loading NCF content: ${error.message}`,
        severity: 'error',
      }));
    }
  }, [loading, dispatch, error]);


  useEffect(() => {
    if (selectedChannel != -1 && selectedVisFile >= 0) {
      execute(
          endpoints.getNcfContent(props.data.vis_files[selectedVisFile].uuid,
              props.data.vis_files[selectedVisFile].meta_data.variables[selectedChannel].variable_name));
    }
  }, [selectedVisFile, selectedChannel]);

  let rasters: IVisFile[] = [];
  if (data && !error && !loading) {
    rasters = data.data.files.map((one: IVisFile) => {
      one.file_name = one.file_name.substring(0, 20);
      return one;
    });
  }

  return (
    <Box>
      <LayerBox key={'rastercontrol'} mode={'rt'} opacity={0.95}>
        <Typography variant={'h1'}>Hello, RT.</Typography>
      </LayerBox>
      {rasters.length > 0 &&
        <LayerBox key={'rastercontrol'} mode={'rb'} opacity={0.95}>
          <RasterControl rasterFiles={rasters} />
        </LayerBox>
      }
    </Box>
  );
}
