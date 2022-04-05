import * as React from 'react';
import {Box, Button, IconButton, Stack} from '@mui/material';
import {useLocation, useNavigate} from 'react-router-dom';
import {Card, CardActions, CardContent, CardHeader, Typography} from '@mui/material';
import {ArrowBack, CopyAll, Download, Edit} from '@mui/icons-material';
import {siteSlice} from '@/store/siteSlice';
import {useAppDispatch} from '@/app/hooks';
import DataMetaTable from '@/components/containers/DataMetaTable';
import MDEditor from '@uiw/react-md-editor';
import {copyMetaToClipboard} from '@/lib/dataset';
import {uiSlice} from '@/store/uiSlice';

export interface IDataMetaInfoProps {
  datasetName?: string;
  downloadLink?: string;
  description?: string;
  meta: any;
}

const DataDetails = (props: IDataMetaInfoProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleNavigateBack = () => {
    dispatch(siteSlice.actions.leaveDataInspecting());
    navigate('/');
  };

  const detailsRows = Object.keys(props.meta).map((item) => {
    return (<tr key={item}>
      <td>{item}</td>
      <td>{props.meta[item]}</td>
    </tr>);
  });
  const detailsTable = (<table className={'meta-table'}>
    <thead>
      <tr>
        <th>Attribute</th>
        <th>Value</th>
      </tr>
    </thead>
    <tbody>
      {detailsRows}
    </tbody>
  </table>);

  const demoSource = '## Ruskin data\nThis is the description of the dataset. This data was collected in **Shanghai**, 2018.';
  return (
    <Box>

      <Stack sx={{mb: 2}} spacing={'1'} direction={'row'} alignItems={'center'}>
        <IconButton onClick={handleNavigateBack}>
          <ArrowBack />
        </IconButton>
        <Typography variant={'h5'}>{props.datasetName}</Typography>
      </Stack>

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
