import {useLeafletContext} from '@react-leaflet/core';
import {LatLng} from 'leaflet';
import * as React from 'react';
import {useMap} from 'react-leaflet';

export interface IMapEventsProps {
}

export type IMapEventNames = 'fly-to'
export function MapEvents(props: IMapEventsProps): any {
  const map = useMap();
  const context = useLeafletContext();

  React.useEffect(() => {
    document.addEventListener('fly-to', (e: CustomEvent) => {
      console.log(e);
      map.flyTo(e.detail, 6);
    });
  }, []);

  return null;
}
