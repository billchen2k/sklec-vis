import * as React from 'react';
import L from 'leaflet';
import {useMap} from 'react-leaflet';
import {Card, CardContent, Typography} from '@mui/material';
import {useEffect} from 'react';

export interface ICoordinateControlProps {
  latlng?: L.LatLng;
}

const CoordinateDisplay = (props: ICoordinateControlProps) => {
  return (
    <div className={'leaflet-left leaflet-bottom'}>
      <Card sx={{m: 2}}>
        <CardContent>
          <Typography variant={'body1'}>Selected Coordinate:</Typography>
          <Typography variant={'body2'}><b>Latitude</b>: {props.latlng.lat.toFixed(5)}</Typography>
          <Typography variant={'body2'}><b>Longtitude</b>: {props.latlng.lng.toFixed(5)}</Typography>
        </CardContent>
      </Card>
    </div>
  );
};

export default CoordinateDisplay;
