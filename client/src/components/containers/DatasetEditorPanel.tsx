import {useAppDispatch} from '@/app/hooks';
import {endpoints} from '@/config/endpoints';
import {uiSlice} from '@/store/uiSlice';
import {IDataset} from '@/types';
import {Box, Checkbox, FormControlLabel, Grid, LinearProgress, Stack, TextField, Tooltip, Typography} from '@mui/material';
import useAxios from 'axios-hooks';
import {useFormik} from 'formik';
import {BooleanSupportOption} from 'prettier';
import * as React from 'react';
import * as Yup from 'yup';
import {useParams} from 'react-router-dom';
import {DatasetTypeBadge} from '../elements/DatasetTypeBadge';
import {InfoOutlined} from '@mui/icons-material';

export interface IDatasetEditorPanelProps {
  datasetDetail: IDataset,
  onDatasetUpdated?: () => void,
}

export interface IDatasetEditFormData {
  name: string;
  description: string;
  is_public: boolean;
  is_coordinated: boolean;
  longitude: number;
  latitude: number;
  datetime_start: Date;
  datetime_end: Date;
}

export interface IDatasetVisFileEditFormData {

}

const DatasetEditorPanel = (props: IDatasetEditorPanelProps) => {
  const dispatch = useAppDispatch();
  const {datasetId} = useParams();
  const originalData = props.datasetDetail;

  const formikDataset = useFormik<IDatasetEditFormData>({
    initialValues: {
      name: originalData.name,
      description: originalData.description,
      is_coordinated: originalData.is_coordinated,
      longitude: originalData.longitude,
      latitude: originalData.latitude,
      is_public: originalData.is_public,
      datetime_start: originalData.datetime_start,
      datetime_end: originalData.datetime_end,
    },
    onSubmit: (values) => {
      console.log(JSON.stringify(values, null, 2));
    },
    validationSchema: Yup.object().shape({
      name: Yup.string().required('This field is required')
          .max(150, 'Dataset name is too long.'),
    }),
  });

  const FormItemLabel = (props: {
    label: string;
    tooltip?: string
  }) => {
    if (props.tooltip) {
      return <Tooltip title={
        <Typography variant={'body2'}>{props.tooltip}</Typography>
      }>
        <Stack direction={'row'} alignItems={'center'} sx={{mt: 1}}>
          <Typography variant={'body1'}>{props.label}</Typography>
          <InfoOutlined sx={{width: 16, height: 16, ml: 1}} />
        </Stack>
      </Tooltip>;
    } else {
      return <Typography variant={'body1'} sx={{mt: 1}}>{props.label}</Typography>;
    }
  };


  return (
    <Box>
      <Stack direction={'row'} sx={{alignItems: 'flex-start', mb: 1}}>
        <Typography variant={'h4'} sx={{'mr': 2}}>{formikDataset.values.name}</Typography>
        <DatasetTypeBadge type={originalData.dataset_type}></DatasetTypeBadge>
      </Stack>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Stack spacing={1}>
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
              <FormItemLabel label={'Name:'} />
              <TextField size={'small'} variant={'standard'} sx={{width: '70%'}}
                name={'name'}
                value={formikDataset.values.name}
                onChange={formikDataset.handleChange}
                helperText={formikDataset.errors.name}
                error={Boolean(formikDataset.errors.name)}
              />
            </Box>
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
              <FormItemLabel label={'Description:'} />
              <TextField size={'small'} variant={'standard'} sx={{width: '70%'}}
                multiline minRows={3} maxRows={10}
                name={'description'}
                value={formikDataset.values.description}
                onChange={formikDataset.handleChange}
                helperText={formikDataset.errors.description}
                error={Boolean(formikDataset.errors.description)}
              />
            </Box>
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
              <FormItemLabel label={'Coordinates:'} tooltip={
                'You can use the map\'s coordinate selector to interactively choose dataset coordinates.'
              } />
              <Stack sx={{width: '70%'}}>
                <FormControlLabel
                  control={<Checkbox size={'small'}
                    value={formikDataset.values.is_coordinated}
                    name={'is_coordinated'}
                    onChange={formikDataset.handleChange}
                  />}
                  label={
                    <Typography variant={'body1'}>Has coordinates</Typography>
                  }
                />
                <Box sx={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
                  <TextField size={'small'} variant={'standard'} sx={{width: '45%'}}
                    name={'longitude'} label={'Longitude'}
                    disabled={formikDataset.values.is_coordinated === false}
                    value={formikDataset.values.longitude}
                    onChange={formikDataset.handleChange}
                    helperText={formikDataset.errors.longitude}
                    error={Boolean(formikDataset.errors.longitude)}
                  />
                  <TextField size={'small'} variant={'standard'} sx={{width: '45%'}}
                    name={'latitude'} label={'Latitude'}
                    disabled={formikDataset.values.is_coordinated === false}
                    value={formikDataset.values.latitude}
                    onChange={formikDataset.handleChange}
                    helperText={formikDataset.errors.latitude}
                    error={Boolean(formikDataset.errors.latitude)}
                  />
                </Box>
              </Stack>
            </Box>
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
              <FormItemLabel label={'Visibility:'} tooltip={
                'Public dataset will be visible to all users including admins, non-admins and guests.'
              } />
              <FormControlLabel sx={{width: '70%'}}
                control={<Checkbox size={'small'}
                  value={formikDataset.values.is_public}
                  name={'is_public'}
                  onChange={formikDataset.handleChange}
                />}
                label={
                  <Typography variant={'body1'}>Public dataset</Typography>
                }
              />
            </Box>
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
              <FormItemLabel label={'Date:'} />
              <Stack sx={{width: '70%'}}>
                <TextField size={'small'} variant={'standard'} fullWidth
                  name={'datetime_start'} label={'Start Date'}
                  value={formikDataset.values.datetime_start}
                  onChange={formikDataset.handleChange}
                  helperText={formikDataset.errors.datetime_start}
                  error={Boolean(formikDataset.errors.datetime_start)}
                />
                <TextField size={'small'} variant={'standard'} fullWidth
                  name={'datetime_end'} label={'End Date'}
                  value={formikDataset.values.datetime_end}
                  onChange={formikDataset.handleChange}
                  helperText={formikDataset.errors.datetime_end}
                  error={Boolean(formikDataset.errors.datetime_end)}
                />
              </Stack>
            </Box>
          </Stack>
        </Grid>
        <Grid item xs={6}>
              222
        </Grid>
      </Grid>
    </Box>
  );
};

export default DatasetEditorPanel;
