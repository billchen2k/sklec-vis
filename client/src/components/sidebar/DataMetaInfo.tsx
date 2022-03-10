import * as React from 'react';
import {Box, Button, IconButton, Stack} from '@mui/material';
import {useLocation, useNavigate} from 'react-router-dom';
import {Card, CardActions, CardContent, CardHeader, Typography} from '@mui/material';
import {ArrowBack} from '@mui/icons-material';
import {siteSlice} from '@/store/siteSlice';
import {useAppDispatch} from '@/app/hooks';

export interface IDataMetaInfoProps {
  datasetName?: string;
  downloadLink?: string;
  viewLink?: string;
  meta: any;
  mini?: boolean;
}

const DataMetaInfo = (props: IDataMetaInfoProps) => {
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

  return (
    <Box>
      {!props.mini &&
        <Stack sx={{mb: 2}} spacing={'1'} direction={'row'} alignItems={'center'}>
          <IconButton onClick={handleNavigateBack}>
            <ArrowBack />
          </IconButton>
          <Typography variant={'h5'}>{props.datasetName}</Typography>
        </Stack>
      }
      <Card variant={'outlined'}>
        <CardContent>
          <Box sx={{display: 'flex'}}>
            {detailsTable}
          </Box>
        </CardContent>
      </Card>
      <Box sx={{margin: '6px'}} className={'clearfix'}>
        {props.viewLink &&
          <Button sx={{float: 'right'}} size={'small'} variant={'outlined'}
            onClick={() => {
              navigate(props.viewLink, {replace: true});
            }}
          >Detail</Button>
        }
        {props.downloadLink &&
          <Button sx={{float: 'right'}} size={'small'} variant={'outlined'}
            onClick={() => {
              navigate(props.downloadLink, {replace: true});
            }}
          >Download</Button>
        }

      </Box>
    </Box>
  );
};

export default DataMetaInfo;