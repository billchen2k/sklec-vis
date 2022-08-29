import consts from '@/lib/consts';
import {useLeafletContext} from '@react-leaflet/core';
import * as React from 'react';
import {useMap} from 'react-leaflet';

export interface IMapEventsProps {
}

export type IMapEventNames = 'fly-to'
export function MapEvents(props: IMapEventsProps): any {
  const map = useMap();

  React.useEffect(() => {
    document.addEventListener(consts.EVENT.MAP_FLY_TO, (e: CustomEvent) => {
      console.log(e);
      map.flyTo(e.detail, 6);
    });
  }, [map]);

  return null;
}
