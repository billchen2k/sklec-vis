import {useAppDispatch} from '@/app/hooks';
import {endpoints} from '@/config/endpoints';
import consts from '@/lib/consts';
import {siteSlice} from '@/store/siteSlice';
import {uiSlice} from '@/store/uiSlice';
import {IDataset} from '@/types';
import {Box, Button, Checkbox, CircularProgress, FormControlLabel, Stack, TextField, Typography} from '@mui/material';
import {DateTimePicker, LocalizationProvider} from '@mui/x-date-pickers';
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFns';
import useAxios from 'axios-hooks';
import {useFormik} from 'formik';
import * as React from 'react';
import {useParams} from 'react-router-dom';
import * as Yup from 'yup';
import DataMetaTable from '../containers/DataMetaTable';
import {IDatasetEditFormData} from './DatasetEditorPanel';
import FormItemLabel from './FormItemLabel';

export interface IDatasetEditorProps {
  datasetDetail: IDataset,
  onDatasetUpdated?: () => void,
}

export default function DatasetEditor(props: IDatasetEditorProps) {
  const {datasetId} = useParams();
  const dispatch = useAppDispatch();
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
  }, [patchDatasetAxiosResult, dispatch, getDatasetListExecute]);

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
  }, [formikDataset]);


  return (
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
        <FormItemLabel label={'Metadata:'} tooltip={'This field is read only.'} />
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
  );
}
