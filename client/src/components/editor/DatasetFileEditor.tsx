import {IDataset, IVisFile} from '@/types';
import {Stack, Typography, Box, Select, MenuItem, Button, LinearProgress, Divider, TextField, CircularProgress} from '@mui/material';
import * as React from 'react';
import FormItemLabel from '@/components/editor/FormItemLabel';
import useAxios from 'axios-hooks';
import {endpoints} from '@/config/endpoints';
import {useParams} from 'react-router-dom';
import {useAppDispatch} from '@/app/hooks';
import {readableFileSize} from '@/lib/utils';
import DataMetaTable from '../containers/DataMetaTable';
import {uiSlice} from '@/store/uiSlice';
import {useFormik} from 'formik';
import * as Yup from 'yup';
import {DateTimePicker, LocalizationProvider} from '@mui/x-date-pickers';
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFns';


export interface IVisFileEditorProps {
  datasetDetail: IDataset,
  onVisFileUpdate?: () => any;
}

export interface IDatasetVisFileEditFormData {
  file_name: string;
  datetime_start: string;
  datetime_end: string;
}

export default function VisFileEditor(props: IVisFileEditorProps) {
  const dispatch = useAppDispatch();
  // Selected visfile uuid
  const [selectedVisFile, setSelectedVisFile] = React.useState<| string>(
    props.datasetDetail.vis_files.length > 0 ? props.datasetDetail.vis_files[0].uuid : null,
  );
  const [selectedFileObj, setSelectedFileObj] = React.useState<| File>(null);
  const {datasetId} = useParams();

  const [uploadAxiosResult, uploadExecute] = useAxios<any>({
    ...endpoints.postUploadRawFile(datasetId),
  }, {manual: true});

  const [patchDatasetFileAxiosResult, patchDatasetFileExecute] = useAxios<any>({}, {manual: true});


  React.useEffect(() => {
    if (props.datasetDetail.vis_files?.length > 0) {
      setSelectedVisFile(props.datasetDetail.vis_files[0].uuid);
    }
  }, [props.datasetDetail.vis_files]);

  const currentVisFile = selectedVisFile ?
    props.datasetDetail.vis_files.find((one) => one.uuid == selectedVisFile) : null;

  const formikEditVisFile = useFormik<IDatasetVisFileEditFormData>({
    initialValues: {
      file_name: currentVisFile?.file_name,
      datetime_start: currentVisFile?.datetime_start,
      datetime_end: currentVisFile?.datetime_end,
    },
    onSubmit: (values) => {

    },
    validationSchema: Yup.object().shape({
      file_name: Yup.string().required('This field is required.')
          .max(80, 'File name is too long.')
          .min(3, 'File name is too short.'),
      datetime_start: Yup.date().nullable().test({
        name: 'datetime_start_earlier_than_datetime_end',
        exclusive: false,
        params: {},
        message: 'Start date must be earlier than end date.',
        test: (value) => {
          if (!value) {
            return true;
          }
          const endDate: Date = new Date(formikEditVisFile.values.datetime_end);
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
    if (currentVisFile) {
      formikEditVisFile.setValues({
        file_name: currentVisFile.file_name,
        datetime_start: currentVisFile.datetime_start,
        datetime_end: currentVisFile.datetime_end,
      });
    }
  }, [currentVisFile]);

  React.useEffect(() => {
    const {data, loading, error} = uploadAxiosResult;
    if (data && !loading && !error) {
      dispatch(uiSlice.actions.openSnackbar({
        message: 'File uploaded successfully.',
        severity: 'success',
      }));
      props.onVisFileUpdate();
    }
  }, [uploadAxiosResult, dispatch]);


  const handleUploadSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files[0];
    const extension = file.name.split('.').splice(-1)[0];
    const legalFormats = ['nc', 'ncf', 'tiff', 'tif'];
    if (!legalFormats.includes(extension)) {
      dispatch(uiSlice.actions.openDialog({
        type: 'simple',
        title: 'Unsupported file',
        content: <Typography variant={'body1'}>
          File extension not supported. Supported files: {legalFormats.join(', ')}.
        </Typography>,
      }));
      return;
    }
    setSelectedFileObj(file);
    dispatch(uiSlice.actions.openDialog({
      type: 'confirm',
      title: 'Confirm upload?',
      content: (
        <React.Fragment>
          <Typography variant={'body1'}>
            Are you sure to upload {file.name} (size: {readableFileSize(file.size)}) into this dataset?
          </Typography>
        </React.Fragment>
      ),
      onConfirm: () => {
        const formData = new FormData();
        formData.append('uuid', datasetId);
        formData.append('file', file);
        uploadExecute({
          data: formData,
        });
      },
    }));
  };

  const handleDeleteClicked = () => {
    dispatch(uiSlice.actions.openDialog({
      type: 'confirm',
      title: 'Confirm delete?',
      content: (
        <React.Fragment>
          <Typography variant={'body1'}>
            Are you sure to delete {currentVisFile.file_name}?
          </Typography>
        </React.Fragment>
      ),
      onConfirm: () => {

      },
    }));
  };


  return (
    <Stack spacing={1}>
      <Typography variant={'body1'} sx={{fontWeight: 'bold'}}>Dataset Files:</Typography>
      <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
        <FormItemLabel label={'Select File:'} />
        <Select sx={{width: '70%'}} variant={'standard'}
          value={selectedVisFile}
          onChange={(e) => setSelectedVisFile(e.target.value)}
        >
          {props.datasetDetail.vis_files?.map((one, index) => {
            return <MenuItem value={one.uuid} key={index}>{one.file_name}</MenuItem>;
          })}
        </Select>
      </Box>
      <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
        <FormItemLabel label={'Actions:'} />
        <Stack direction={'row'} spacing={1} width={'70%'}>
          <Button fullWidth variant={'outlined'}
            component={'label'}
            disabled={uploadAxiosResult.loading}
          >
            {uploadAxiosResult.loading ? 'Uploading...' : 'Upload New'}
            <input type={'file'} hidden onChange={handleUploadSelected} />
          </Button>

          <Button fullWidth variant={'outlined'} onClick={() => handleDeleteClicked()}
            color={'error'}
            disabled={!currentVisFile}
          >
            Delete
          </Button>
        </Stack>
      </Box>
      {uploadAxiosResult.loading &&
        <LinearProgress variant={'indeterminate'} />
      }
      {currentVisFile &&
      <React.Fragment>
        <Divider light />
        <Typography variant={'body1'} sx={{fontWeight: 'bold'}}>Current Dataset:</Typography>
        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
          <FormItemLabel label={'File name:'} />
          <TextField size={'small'} variant={'standard'} sx={{width: '70%'}}
            name={'file_name'}
            value={formikEditVisFile.values.file_name}
            onChange={formikEditVisFile.handleChange}
            helperText={formikEditVisFile.errors.file_name}
            error={Boolean(formikEditVisFile.errors.file_name)}
          />
        </Box>
        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
          <FormItemLabel label={'File Size:'} />
          <Typography variant={'body1'} sx={{width: '70%', mt: 1}}>
            {readableFileSize(currentVisFile.file_size)}
          </Typography>
        </Box>
        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
          <FormItemLabel label={'File Format:'} />
          <Typography variant={'body1'} sx={{width: '70%', mt: 1}}>
            {currentVisFile.format}
          </Typography>
        </Box>
        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
          <FormItemLabel label={'Meta Data:'} />
          <Box sx={{display: 'flex', width: '70%', overflowX: 'scroll'}}>
            <DataMetaTable meta={currentVisFile.meta_data} />
          </Box>
        </Box>
        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
          <FormItemLabel label={'File Date:'} />
          <Stack sx={{width: '70%'}}>
            <LocalizationProvider dateAdapter={AdapterDateFns} >
              <DateTimePicker
                value={formikEditVisFile.values.datetime_start}
                onChange={(date) => {
                  formikEditVisFile.setFieldValue('datetime_start', date);
                }}
                renderInput={(props) => (
                  <TextField size={'small'} variant={'standard'} fullWidth
                    {...props}
                    label={'Start date'}
                    value={formikEditVisFile.values.datetime_start}
                    helperText={formikEditVisFile.errors.datetime_start}
                    error={Boolean(formikEditVisFile.errors.datetime_start)}
                  />
                )}
              />
              <DateTimePicker
                value={formikEditVisFile.values.datetime_end}
                onChange={(date) => {
                  formikEditVisFile.setFieldValue('datetime_end', date);
                }}
                renderInput={(props) => (
                  <TextField size={'small'} variant={'standard'}
                    {...props}
                    label={'End date'}
                    value={formikEditVisFile.values.datetime_end}
                    helperText={formikEditVisFile.errors.datetime_end}
                    error={Boolean(formikEditVisFile.errors.datetime_end)}
                  />
                )}
              />
            </LocalizationProvider>
          </Stack>
        </Box>
        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1}}>
          <Box sx={{display: 'flex', flexGrow: 1}} />
          {patchDatasetFileAxiosResult.loading &&
              <CircularProgress variant={'indeterminate'}
                sx={{mr: 1}} size={18}
              />
          }
          <Button disabled={patchDatasetFileAxiosResult.loading} onClick={() => {
            formikEditVisFile.submitForm();
          }}>
              Update File
          </Button>
        </Box>
      </React.Fragment>
      }
    </Stack>
  );
}
