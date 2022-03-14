import * as React from 'react';
import {Box, Button, Card, CardContent, Typography} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import DataMetaTable from '@/components/containers/DataMetaTable';
import {useMap} from 'react-leaflet';

export interface IDataMarkerPopupProps {
  meta: any;
  name?: string;
  link?: string;
}

const DataMarkerPopupContent = (props: IDataMarkerPopupProps) => {
  const navigate = useNavigate();
  const map = useMap();
  return (
    <Box>
      {
        props.name && <Typography variant={'h6'}>{props.name}</Typography>
      }
      <Card variant={'outlined'} >
        <CardContent>
          <DataMetaTable meta={props.meta} />

        </CardContent>
      </Card>
      <Box sx={{width: '100%', m: 1}} className={'clearfix'}>
        {props.link &&
          <Button sx={{float: 'right'}} size={'small'} variant={'outlined'}
            onClick={() => {
              map.closePopup();
              navigate(props.link, {replace: true});
            }}
          >Detail</Button>
        }
      </Box>
    </Box>
  );
};

export default DataMarkerPopupContent;
