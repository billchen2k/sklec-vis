import {IDataset} from '@/types';
import {Box, Grid, Stack, Typography} from '@mui/material';
import * as React from 'react';
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
  return (
    <Box>
      <Stack direction={'row'} sx={{alignItems: 'flex-start', mb: 1}}>
        <Typography variant={'h4'} sx={{'mr': 2}}>{props.datasetDetail.name}</Typography>
        <DatasetTypeBadge type={props.datasetDetail.dataset_type}></DatasetTypeBadge>
      </Stack>
      <Grid container spacing={2} sx={{
        maxHeight: '70vh',
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
