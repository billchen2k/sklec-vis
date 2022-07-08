import {useAppDispatch} from '@/app/hooks';
import DatasetEditorPanel from '@/components/containers/DatasetEditorPanel';
import {DatasetTypeBadge} from '@/components/elements/DatasetTypeBadge';
import {endpoints} from '@/config/endpoints';
import {siteSlice} from '@/store/siteSlice';
import {uiSlice} from '@/store/uiSlice';
import {IDataset} from '@/types';
import {Box, Grid, LinearProgress, Stack, TextField, Typography} from '@mui/material';
import useAxios from 'axios-hooks';
import * as React from 'react';
import {useParams} from 'react-router-dom';
import LayerBox from './LayerBox';

export interface IDataEditorProps {
}

export default function DataEditor(props: IDataEditorProps) {
  const dispatch = useAppDispatch();
  const {datasetId} = useParams();
  const [{data, loading, error}] = useAxios<IDataset>(endpoints.getDatasetDetail(datasetId));

  React.useEffect(() => {
    if (!loading && error) {
      dispatch(uiSlice.actions.openSnackbar({
        severity: 'error',
        message: `Fail to initialize dataset editig: ${error.message}`,
      }));
    }
  }, [data, loading, error, dispatch]);

  React.useEffect(() => {
    dispatch(siteSlice.actions.enterDataManaging(datasetId));
  }, [dispatch, datasetId]);

  return (
    <LayerBox mode={'lt'}>
      <Box sx={{
        overflowY: 'scroll',
        width: '800px',
      }}
      >
        {data && !error && !loading &&
          <DatasetEditorPanel datasetDetail={data} />
        }
      </Box>
    </LayerBox>
  );
}
