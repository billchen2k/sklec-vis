import {useAppDispatch} from '@/app/hooks';
import {endpoints} from '@/config/endpoints';
import {uiSlice} from '@/store/uiSlice';
import {IDataset} from '@/types';
import {Box, Button, Checkbox, CircularProgress, FormControlLabel, Grid, LinearProgress, Stack, TextField, Tooltip, Typography} from '@mui/material';
import useAxios from 'axios-hooks';
import {useFormik} from 'formik';
import * as React from 'react';
import * as Yup from 'yup';
import {useParams} from 'react-router-dom';
import {DatasetTypeBadge} from '../elements/DatasetTypeBadge';
import {InfoOutlined} from '@mui/icons-material';
import consts from '@/lib/consts';
import {siteSlice} from '@/store/siteSlice';
import DataMetaTable from '../containers/DataMetaTable';
import {DateTimePicker, LocalizationProvider} from '@mui/x-date-pickers';
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFns';
import DatasetEditor from './DatasetEditor';
import FormItemLabel from './FormItemLabel';
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
      <Grid container spacing={2}>
        {/* Dataset Editor */}
        <Grid item xs={6}>
          <DatasetEditor datasetDetail={props.datasetDetail} onDatasetUpdated={props.onDatasetUpdated} />
        </Grid>

        {/* VisFile Editor */}
        <Grid item xs={6}>
          <DatasetFileEditor datasetDetail={props.datasetDetail} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default DatasetEditorPanel;
