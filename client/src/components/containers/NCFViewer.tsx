import {useAppDispatch} from '@/app/hooks';
import {endpoints} from '@/config/endpoints';
import LayerBox from '@/layout/LayerBox';
import {uiSlice} from '@/store/uiSlice';
import {IRasterForRendering, IVisFile} from '@/types';
import {Box} from '@mui/material';
import useAxios from 'axios-hooks';
import * as React from 'react';
import RasterControl from '../charts/RasterControl';

export interface INCFViewerProps {
    visfile: IVisFile;
}

export function NCFViewer(props: INCFViewerProps) {
  const dispatch = useAppDispatch();
  const [{data, loading, error}] = useAxios(endpoints.getNcfContent(props.visfile.uuid, 'pspr0'));

  if (loading) {
    return <Box>Loading...</Box>;
  }

  if (error || !data) {
    dispatch(uiSlice.actions.openSnackbar({
      message: 'Error loading NCF file.',
      severity: 'error',
    }));
    return null;
  }

  const rasters: IVisFile[] = data.data.files.map((one: IVisFile) => {
    one.file_name = one.file_name.substring(0, 20);
    return one;
  });

  return (
    <Box>
      <LayerBox key={'rastercontrol'} mode={'rb'} opacity={0.95}>
        <RasterControl rasterFiles={rasters} />
      </LayerBox>
    </Box>
  );
}
