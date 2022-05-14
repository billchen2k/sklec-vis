import {useAppDispatch} from '@/app/hooks';
import DataMetaTable from '@/components/containers/DataMetaTable';
import {copyMetaToClipboard} from '@/lib/dataset';
import {uiSlice} from '@/store/uiSlice';
import {CopyAll, Download, Edit} from '@mui/icons-material';
import {Box, Button, Card, CardContent, Stack} from '@mui/material';
import MDEditor from '@uiw/react-md-editor';
import * as React from 'react';
import {useNavigate} from 'react-router-dom';

export interface IDataMetaInfoProps {
  datasetName?: string;
  downloadLink?: string;
  description?: string;
  meta: any;
}

const DataDetails = (props: IDataMetaInfoProps) => {
  const dispatch = useAppDispatch();

  const detailsRows = Object.keys(props.meta).map((item) => {
    return (<tr key={item}>
      <td>{item}</td>
      <td>{props.meta[item]}</td>
    </tr>);
  });

  const demoSource = '## Ruskin data\nThis is the description of the dataset. This data was collected in **Shanghai**, 2018.';

  return (
    <Box>
      <Box sx={{my: 1}}>
        <MDEditor.Markdown
          style={{'fontSize': '14px'}}
          source={props.description || demoSource}
        />
      </Box>

      <Card variant={'outlined'}>
        <CardContent>
          <DataMetaTable meta={props.meta} />
        </CardContent>
      </Card>

      <Stack direction={'column'} sx={{margin: '6px'}} spacing={1}>
        <Button variant={'outlined'} size={'small'} startIcon={<CopyAll />}
          onClick={() => {
            copyMetaToClipboard(props.meta);
            dispatch(uiSlice.actions.openSnackbar({
              message: 'Metadata copied to clipboard.',
              severity: 'success',
            }));
          }}
        >
          Copy Metadata to Clipboard
        </Button>

        <Button variant={'outlined'} size={'small'}
          startIcon={<Edit />}
        >
          Edit description and attachments
        </Button>

        {props.downloadLink &&
          <Button size={'small'} variant={'outlined'}
            startIcon={<Download />}
            onClick={() => {
              window.open(props.downloadLink, '_blank');
            }}
          >Download Original</Button>
        }

      </Stack>
    </Box>
  );
};

export default DataDetails;
