import {useAppDispatch, useUser} from '@/app/hooks';
import DataMetaTable from '@/components/containers/DataMetaTable';
import config from '@/config';
import {copyMetaToClipboard} from '@/lib/dataset';
import {uiSlice} from '@/store/uiSlice';
import {CopyAll, Download, Edit, Storage} from '@mui/icons-material';
import {Box, Button, Card, CardContent, Stack} from '@mui/material';
import MDEditor from '@uiw/react-md-editor';
import * as React from 'react';
import {useNavigate, useParams} from 'react-router-dom';

export interface IDataMetaInfoProps {
  datasetName?: string;
  downloadLink?: string;
  description?: string;
  meta: any;
}

const DataDetails = (props: IDataMetaInfoProps) => {
  const dispatch = useAppDispatch();
  const user = useUser();
  const {datasetId} = useParams();
  const navigate = useNavigate();

  const detailsRows = Object.keys(props.meta || {}).map((item) => {
    return (<tr key={item}>
      <td>{item}</td>
      <td>{props.meta[item]}</td>
    </tr>);
  });

  const handleDownloadClicked = () => {
    window.open(props.downloadLink, '_blank');
  };

  const handleThreddsDownloadClicked = () => {
    const fileName = props.downloadLink?.substring(props.downloadLink?.lastIndexOf('/') + 1);
    window.open(`${config.THREDDS_BASE}/${fileName}`, '_blank');
  };

  return (
    <Box>
      <Box sx={{my: 1}}>
        <MDEditor.Markdown
          style={{'fontSize': '14px'}}
          source={props.description || '*No description*'}
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

        {user?.username &&
          <Button variant={'outlined'} size={'small'}
            startIcon={<Edit />}
            onClick={() => {
              navigate(`/edit/${datasetId}`);
            }}
          >
            Edit description and attachments
          </Button>
        }

        {props.downloadLink &&
          <Button size={'small'} variant={'outlined'}
            startIcon={<Download />}
            onClick={handleDownloadClicked}
          >Download Original</Button>
        }

        {props.downloadLink?.endsWith('nc') &&
          <Button size={'small'} variant={'outlined'}
            startIcon={<Storage />}
            onClick={handleThreddsDownloadClicked}
          >Inspect with THREDDS</Button>
        }

      </Stack>
    </Box>
  );
};

export default DataDetails;
