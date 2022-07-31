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
import DataMetaTable from './DataMetaTable';
import {DatePicker, DateTimePicker, LocalizationProvider} from '@mui/x-date-pickers';
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFns';

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

export interface IDatasetVisFileEditFormData {

}

const DatasetEditorPanel = (props: IDatasetEditorPanelProps) => {
  const dispatch = useAppDispatch();
  const {datasetId} = useParams();
  const originalData = props.datasetDetail;

  const [patchDatasetAxiosResult, patchDatasetExecute] = useAxios<IDataset>({
    ...endpoints.patchDataset(''),
  }, {
    manual: true,
  });

  const [getDatasetListAxiosRes, getDatasetListExecute] = useAxios({
    ...endpoints.getDatasetList(),
  });

  React.useEffect(() => {
    const {data, loading, error} = patchDatasetAxiosResult;
    if (data && !loading && !error) {
      dispatch(uiSlice.actions.openSnackbar({
        severity: 'success',
        message: 'Successfully updated dataset information',
      }));
      getDatasetListExecute();
    }
    if (!loading && error) {
      dispatch(uiSlice.actions.openSnackbar({
        severity: 'error',
        message: `Fail to update dataset information: ${error.message}.`,
      }));
    }
  }, [patchDatasetAxiosResult, dispatch]);

  React.useEffect(() => {
    const {data, loading, error} = getDatasetListAxiosRes;
    if (data && !error && !loading) {
      dispatch(siteSlice.actions.setDatasetListCache(data.results));
    }
  }, [getDatasetListAxiosRes, dispatch]);

  React.useEffect(() => {
    const onCoordinateSelected = (event: CustomEvent) => {
      formikDataset.setFieldValue('longitude', Number(event.detail.lng || 0).toFixed(4));
      formikDataset.setFieldValue('latitude', Number(event.detail.lat || 0).toFixed(4));
    };
    document.addEventListener(consts.EVENT.COORDINATE_SELECTED, onCoordinateSelected);
    return () => {
      document.removeEventListener(consts.EVENT.COORDINATE_SELECTED, onCoordinateSelected);
    };
  }, []);

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
      patchDatasetExecute({
        ...endpoints.patchDataset(datasetId),
        data: values,
      });
    },
    validationSchema: Yup.object().shape({
      name: Yup.string().required('This field is required')
          .max(150, 'Dataset name is too long.'),
      description: Yup.string().max(500, 'Dataset description is too long.'),
      is_coordinated: Yup.boolean(),
      longitude: Yup.number().nullable().min(-180, 'Longitude must be between -180 and 180.')
          .max(180, 'Longitude must be a number between -180 and 180.'),
      latitude: Yup.number().nullable().min(-90, 'Latitude must be between -90 and 90.')
          .max(90, 'Latitude must be a number between -90 and 90.'),
      is_public: Yup.boolean(),
      datetime_start: Yup.date().nullable().test({
        name: 'datetime_start_earlier_than_datetime_end',
        exclusive: false,
        params: {},
        message: 'Start date must be earlier than end date.',
        test: (value) => {
          if (!value) {
            return true;
          }
          const endDate: Date = new Date(formikDataset.values.datetime_end);
          if (!endDate) {
            return true;
          }
          return value.getTime() < endDate.getTime();
        },
      }),
      datetime_end: Yup.date().nullable(),
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
            <Typography variant={'body1'} sx={{fontWeight: 'bold'}}>Dataset Information:</Typography>
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
              <FormItemLabel label={'Metadata:'} tooltip={'This field is read only.'}/>
              <Box sx={{display: 'flex', width: '70%', overflowX: 'scroll'}}>
                <DataMetaTable meta={originalData?.meta_data} />
              </Box>
            </Box>
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
              <FormItemLabel label={'Uploader:'} />
              <Typography variant={'body1'} sx={{width: '70%', mt: 1}}>
                {originalData?.created_by?.display_name} (@{originalData?.created_by?.username})
              </Typography>
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
                    disabled={formikDataset.values.is_coordinated !== true}
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
              <FormItemLabel label={'Dataset date:'} />
              <Stack sx={{width: '70%'}}>
                <LocalizationProvider dateAdapter={AdapterDateFns} >
                  <DateTimePicker
                    value={formikDataset.values.datetime_start}
                    onChange={(date) => {
                      formikDataset.setFieldValue('datetime_start', date);
                    }}
                    renderInput={(props) => (
                      <TextField size={'small'} variant={'standard'} fullWidth
                        {...props}
                        label={'Start date'}
                        value={formikDataset.values.datetime_start}
                        helperText={formikDataset.errors.datetime_start}
                        error={Boolean(formikDataset.errors.datetime_start)}
                      />
                    )}
                  />
                  <DateTimePicker
                    value={formikDataset.values.datetime_end}
                    onChange={(date) => {
                      formikDataset.setFieldValue('datetime_end', date);
                    }}
                    renderInput={(props) => (
                      <TextField size={'small'} variant={'standard'} fullWidth
                        {...props}
                        label={'End date'}
                        value={formikDataset.values.datetime_end}
                        helperText={formikDataset.errors.datetime_end}
                        error={Boolean(formikDataset.errors.datetime_end)}
                      />
                    )}
                  />

                </LocalizationProvider>


                {/* <TextField size={'small'} variant={'standard'} fullWidth
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
                /> */}
              </Stack>
            </Box>
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
              <FormItemLabel label={'Creation date:'} />
              <Typography variant={'body1'} sx={{width: '70%', mt: 1}}>
                {originalData?.created_at.substring(0, 19).replace('T', ' ')}
              </Typography>
            </Box>
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
              <FormItemLabel label={'Modification date:'} />
              <Typography variant={'body1'} sx={{width: '70%', mt: 1}}>
                {originalData?.updated_at.substring(0, 19).replace('T', ' ')}
              </Typography>
            </Box>
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <Box sx={{display: 'flex', flexGrow: 1}} />
              {patchDatasetAxiosResult.loading &&
                <CircularProgress variant={'indeterminate'}
                  sx={{mr: 1}} size={18}
                />
              }
              <Button disabled={patchDatasetAxiosResult.loading} onClick={() => {
                formikDataset.submitForm();
              }}>
                Update Dataset
              </Button>
            </Box>
          </Stack>
        </Grid>
        <Grid item xs={6}>
          <Stack spacing={1}>
            <Typography variant={'body1'} sx={{fontWeight: 'bold'}}>Dataset Files:</Typography>
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
              <FormItemLabel label={'Metadata:'} tooltip={'This field is read only.'} />
              <Box sx={{display: 'flex', width: '70%', overflowX: 'scroll'}}>
                <DataMetaTable meta={originalData?.meta_data} />
              </Box>
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DatasetEditorPanel;
