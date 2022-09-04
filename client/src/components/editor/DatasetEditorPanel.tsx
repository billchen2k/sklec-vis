import {IDataset} from '@/types';
import {Close} from '@mui/icons-material';
import {Box, Grid, IconButton, Stack, Typography} from '@mui/material';
import * as React from 'react';
import {useNavigate} from 'react-router-dom';
import {DatasetTypeBadge} from '../elements/DatasetTypeBadge';
import DatasetEditor from './DatasetEditor';
import DatasetFileEditor from './DatasetFileEditor';

export interface IDatasetEditorPanelProps {
  datasetDetail: IDataset,
  onDatasetUpdated?: () => void,
}

export interface IDatasetEditFormData {
  name: string;
  description: string;
  is_public: boolean;
  is_coordinated: boolean;
  longitude: number | string;
  latitude: number | string;
  datetime_start: Date;
  datetime_end: Date;
}

const DatasetEditorPanel = (props: IDatasetEditorPanelProps) => {
  const navigate = useNavigate();
  return (
    <Box>
      <Stack direction={'row'} sx={{alignItems: 'flex-start', mb: 1}}>
        <Typography variant={'h4'} sx={{'mr': 2}}>{props.datasetDetail.name}</Typography>
        <DatasetTypeBadge type={props.datasetDetail.dataset_type}></DatasetTypeBadge>
        <Box sx={{flex: 1, flexGrow: 1}} />
        <IconButton onClick={() => {
          navigate('/');
        }}>
          <Close />
        </IconButton>
      </Stack>
      <Grid container spacing={2} sx={{
        maxHeight: '75vh',
        overflowY: 'scroll',
      }}>
        {/* Dataset Editor */}
        <Grid item xs={6}>
          <DatasetEditor datasetDetail={props.datasetDetail} onDatasetUpdated={props.onDatasetUpdated} />
        </Grid>
        {/* VisFile Editor */}
        <Grid item xs={6}>
          <DatasetFileEditor datasetDetail={props.datasetDetail} onVisFileUpdate={props.onDatasetUpdated} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default DatasetEditorPanel;
