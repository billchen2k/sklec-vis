import {useAppDispatch, useUser} from '@/app/hooks';
import DatasetEditorPanel from '@/components/editor/DatasetEditorPanel';
import {endpoints} from '@/config/endpoints';
import {siteSlice} from '@/store/siteSlice';
import {uiSlice} from '@/store/uiSlice';
import {IDataset} from '@/types';
import {Box} from '@mui/material';
import useAxios from 'axios-hooks';
import * as React from 'react';
import {useParams} from 'react-router-dom';
import DefaultPage from './DefaultPage';
import LayerBox from './LayerBox';

export interface IDataEditorProps {
}

export default function DataEditor(props: IDataEditorProps) {
  const dispatch = useAppDispatch();
  const user = useUser();
  const {datasetId} = useParams();
  const [{data, loading, error}, execute] = useAxios<IDataset>(endpoints.getDatasetDetail(datasetId));

  const [getDatasetListAxiosRes, getDatasetListExecute] = useAxios({
    ...endpoints.getDatasetList(),
  }, {manual: true});


  React.useEffect(() => {
    if (!loading && error) {
      dispatch(uiSlice.actions.openSnackbar({
        severity: 'error',
        message: `Fail to initialize dataset editig: ${error.message}`,
      }));
    }
  }, [data, loading, error, dispatch]);

  React.useEffect(() => {
    const {data, loading, error} = getDatasetListAxiosRes;
    if (data && !error && !loading) {
      dispatch(siteSlice.actions.setDatasetListCache(data.results));
    }
  }, [getDatasetListAxiosRes, dispatch]);

  React.useEffect(() => {
    dispatch(siteSlice.actions.enterDataManaging(datasetId));
  }, [dispatch, datasetId]);

  if (!user.username) {
    return <DefaultPage type={'403'} showHome />;
  }

  return (
    <LayerBox mode={'lt'}>
      <Box sx={{
        overflowY: 'scroll',
        width: '800px',
      }}
      >
        {data && !error && !loading &&
          <DatasetEditorPanel datasetDetail={data} onDatasetUpdated={() => {
            execute();
            getDatasetListExecute();
          }}/>
        }
      </Box>
    </LayerBox>
  );
}
