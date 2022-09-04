import {useAppDispatch, useUser} from '@/app/hooks';
import {endpoints} from '@/config/endpoints';
import DefaultPage from '@/layout/DefaultPage';
import consts from '@/lib/consts';
import {siteSlice} from '@/store/siteSlice';
import {uiSlice} from '@/store/uiSlice';
import {DatasetType} from '@/types';
import {Box, Button, Checkbox, CircularProgress, FormControlLabel, ListItemText, MenuItem, Select, Stack, TextField, Typography} from '@mui/material';
import {DateTimePicker, LocalizationProvider} from '@mui/x-date-pickers';
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFns';
import useAxios from 'axios-hooks';
import {sub} from 'date-fns';
import {useFormik} from 'formik';
import * as React from 'react';
import {useNavigate} from 'react-router-dom';
import * as Yup from 'yup';
import FormItemLabel from '../editor/FormItemLabel';
import {DatasetTypeBadge} from '../elements/DatasetTypeBadge';

export interface IDatasetCreatorProps {
}


export interface IDatasetCreateFormData {
    name: string;
    description: string;
    is_public: boolean;
    is_coordinated: boolean;
    longitude: number | string;
    latitude: number | string;
    meta_data: any;
    datetime_start: Date;
    datetime_end: Date;
    dataset_type: DatasetType;
}

export default function DatasetCreator(props: IDatasetCreatorProps) {
  const user = useUser();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [createDatasetAxiosResult, createDatasetExecute] = useAxios<any>({}, {manual: true});

  React.useEffect(() => {
    dispatch(siteSlice.actions.setGlobalState('managing'));
  });

  const formikCreateDataset = useFormik<IDatasetCreateFormData>({
    initialValues: {
      name: '',
      description: '',
      is_public: true,
      is_coordinated: true,
      longitude: 0,
      latitude: 0,
      datetime_start: sub(new Date(), {days: 1}),
      datetime_end: new Date(),
      dataset_type: 'NCF',
      meta_data: {},
    },
    onSubmit: (values) => {
      createDatasetExecute({
        ...endpoints.postCreateDataset(),
        data: values,
      });
    },
    validationSchema: Yup.object().shape({
      dataset_type: Yup.string().required('This field is required'),
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
          const endDate: Date = new Date(formikCreateDataset.values.datetime_end);
          if (!endDate) {
            return true;
          }
          return value.getTime() < endDate.getTime();
        },
      }),
      datetime_end: Yup.date().nullable(),
    }),
  });

  React.useEffect(() => {
    const onCoordinateSelected = (event: CustomEvent) => {
      formikCreateDataset.setFieldValue('longitude', Number(event.detail.lng || 0).toFixed(4));
      formikCreateDataset.setFieldValue('latitude', Number(event.detail.lat || 0).toFixed(4));
    };
    document.addEventListener(consts.EVENT.COORDINATE_SELECTED, onCoordinateSelected);
    return () => {
      document.removeEventListener(consts.EVENT.COORDINATE_SELECTED, onCoordinateSelected);
    };
  }, [formikCreateDataset]);

  React.useEffect(() => {
    const {loading, data, error} = createDatasetAxiosResult;
    if (!loading && data) {
      dispatch(siteSlice.actions.refreshDatasetList());
      dispatch(uiSlice.actions.openDialog({
        type: 'confirm',
        title: 'Dataset Created',
        content: `Dataset ${formikCreateDataset.values.name} created successfully. Do you want to upload files for this dataset now?`,
        confirmText: 'Navigate to edit',
        cancelText: 'Cancel',
        onConfirm: () => {
          navigate(`/edit/${data.data.uuid}`);
        },
      }));
      dispatch(uiSlice.actions.openSnackbar({
        severity: 'success',
        message: `Dataset ${formikCreateDataset.values.name} created successfully.`,
      }));
    }
    if (!loading && error) {
      dispatch(uiSlice.actions.openSnackbar({
        severity: 'error',
        message: `Fail to create new dataset: ${error.message}.`,
      }));
    }
  }, [createDatasetAxiosResult, dispatch]);


  const handleCreate = () => {
    formikCreateDataset.submitForm();
  };

  if (!user?.username) {
    return <DefaultPage type={'403'} />;
  }

  return (
    <Box>
      <Typography variant={'h4'}>Create Dataset</Typography>
      <Stack spacing={1} sx={{width: '30rem'}}>
        <Typography variant={'body1'} sx={{my: 1}}>
                        By creating an empty dataset, you can upload files under this dataset later.
        </Typography>
        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
          <FormItemLabel label={'Type:'} tooltip={
            'Specify dataset type. This doesn\' limit what kind of file you can upload into the dataset, but will determine how the system will visualize the data. It can\'t be changed after creation.'
          } />
          <Select variant={'standard'} sx={{width: '70%'}}
            size={'small'}
            name={'dataset_type'}
            value={formikCreateDataset.values.dataset_type}
            onChange={formikCreateDataset.handleChange}
            error={Boolean(formikCreateDataset.errors.dataset_type)}
          >
            {Object.keys(consts.datasetTypeFullNames).map((type) => (
              <MenuItem value={type} key={type}>
                <Stack direction={'row'} spacing={1}>
                  <DatasetTypeBadge type={type as DatasetType}></DatasetTypeBadge>
                  <ListItemText>{consts.datasetTypeFullNames[type as DatasetType]}</ListItemText>
                </Stack>
              </MenuItem>
            ))}
          </Select>

        </Box>
        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
          <FormItemLabel label={'Name:'} />
          <TextField size={'small'} variant={'standard'} sx={{width: '70%'}}
            name={'name'}
            value={formikCreateDataset.values.name}
            onChange={formikCreateDataset.handleChange}
            helperText={formikCreateDataset.errors.name}
            error={Boolean(formikCreateDataset.errors.name)}
          />
        </Box>
        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
          <FormItemLabel label={'Description:'} />
          <TextField size={'small'} variant={'standard'} sx={{width: '70%'}}
            multiline minRows={3} maxRows={10}
            name={'description'}
            value={formikCreateDataset.values.description}
            onChange={formikCreateDataset.handleChange}
            helperText={formikCreateDataset.errors.description}
            error={Boolean(formikCreateDataset.errors.description)}
          />
        </Box>
        {/* <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
              <FormItemLabel label={'Metadata:'} tooltip={'This field is read only.'} />
              <Box sx={{display: 'flex', width: '70%', overflowX: 'scroll'}}>
                <DataMetaTable meta={originalData?.meta_data} />
              </Box>
            </Box> */}
        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
          <FormItemLabel label={'Uploader:'} />
          <Typography variant={'body1'} sx={{width: '70%', mt: 1}}>
            {user?.display_name} (@{user?.username})
          </Typography>
        </Box>
        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
          <FormItemLabel label={'Coordinates:'} tooltip={
            'You can use the map\'s coordinate selector to interactively choose dataset coordinates.'
          } />
          <Stack sx={{width: '70%'}}>
            <FormControlLabel
              control={<Checkbox size={'small'}
                value={formikCreateDataset.values.is_coordinated}
                name={'is_coordinated'}
                onChange={formikCreateDataset.handleChange}
              />}
              label={
                <Typography variant={'body1'}>Has coordinates</Typography>
              }
            />
            <Box sx={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
              <TextField size={'small'} variant={'standard'} sx={{width: '45%'}}
                name={'longitude'} label={'Longitude'}
                disabled={formikCreateDataset.values.is_coordinated !== true}
                value={formikCreateDataset.values.longitude}
                onChange={formikCreateDataset.handleChange}
                helperText={formikCreateDataset.errors.longitude}
                error={Boolean(formikCreateDataset.errors.longitude)}
              />
              <TextField size={'small'} variant={'standard'} sx={{width: '45%'}}
                name={'latitude'} label={'Latitude'}
                disabled={formikCreateDataset.values.is_coordinated === false}
                value={formikCreateDataset.values.latitude}
                onChange={formikCreateDataset.handleChange}
                helperText={formikCreateDataset.errors.latitude}
                error={Boolean(formikCreateDataset.errors.latitude)}
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
              value={formikCreateDataset.values.is_public}
              name={'is_public'}
              onChange={formikCreateDataset.handleChange}
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
                value={formikCreateDataset.values.datetime_start}
                onChange={(date) => {
                  formikCreateDataset.setFieldValue('datetime_start', date);
                }}
                renderInput={(props) => (
                  <TextField size={'small'} variant={'standard'} fullWidth
                    {...props}
                    label={'Start date'}
                    value={formikCreateDataset.values.datetime_start}
                    helperText={formikCreateDataset.errors.datetime_start}
                    error={Boolean(formikCreateDataset.errors.datetime_start)}
                  />
                )}
              />
              <DateTimePicker
                value={formikCreateDataset.values.datetime_end}
                onChange={(date) => {
                  formikCreateDataset.setFieldValue('datetime_end', date);
                }}
                renderInput={(props) => (
                  <TextField size={'small'} variant={'standard'} fullWidth
                    {...props}
                    label={'End date'}
                    value={formikCreateDataset.values.datetime_end}
                    helperText={formikCreateDataset.errors.datetime_end}
                    error={Boolean(formikCreateDataset.errors.datetime_end)}
                  />
                )}
              />

            </LocalizationProvider>

          </Stack>
        </Box>
      </Stack>
      <Stack direction={'row'} sx={{mt: 2}}>
        <Box sx={{display: 'flex', flexGrow: 1}} />
        {createDatasetAxiosResult.loading &&
            <CircularProgress variant={'indeterminate'}
              sx={{mr: 1}} size={18}
            />
        }
        <Button onClick={() => navigate(-1)}>Cancel</Button>
        <Button onClick={handleCreate} disabled={createDatasetAxiosResult.loading}>Create</Button>
      </Stack>
    </Box>


  );
}
