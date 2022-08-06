import {IDataset} from '@/types';
import {Stack, Typography, Box, Select, MenuItem, Button, LinearProgress, Divider} from '@mui/material';
import * as React from 'react';
import FormItemLabel from '@/components/editor/FormItemLabel';

export interface IVisFileEditorProps {
  datasetDetail: IDataset,
  onVisFileUpdate?: () => any;
}

export interface IDatasetVisFileEditFormData {

}

export default function VisFileEditor(props: IVisFileEditorProps) {
  const [uploading, setUploading] = React.useState<Boolean>(false);
  const [selectedVisFile, setSelectedVisFile] = React.useState<| string>(null);

  React.useEffect(() => {
    if (props.datasetDetail.vis_files?.length > 0) {
      setSelectedVisFile(props.datasetDetail.vis_files[0].uuid);
    }
  }, [props.datasetDetail.vis_files]);

  const handleUploadClicked = () => {

  };

  const handleDeleteClicked = () => {

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
          <Button fullWidth variant={'outlined'} onClick={() => handleUploadClicked()}>
            Upload New
          </Button>
          <Button fullWidth variant={'outlined'} onClick={() => handleDeleteClicked()}>Delete</Button>
        </Stack>
      </Box>
      {uploading &&
        <LinearProgress variant={'indeterminate'} />
      }
      <Divider light />
      {/* <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
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
      </Box> */}
    </Stack>
  );
}
