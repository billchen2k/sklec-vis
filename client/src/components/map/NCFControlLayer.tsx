import {useAppDispatch, useAppSelector} from '@/app/hooks';
import {LatLng, LatLngBounds, LatLngBoundsExpression, PathOptions} from 'leaflet';
import * as React from 'react';
import {LayerGroup, Polygon, Rectangle, useMap} from 'react-leaflet';

export interface INCFControlLayerProps {

}

export function NCFControlLayer(props: INCFControlLayerProps) {
  const dispatch = useAppDispatch();
  const map = useMap();
  const {datasetDetailCache, inspectState} = useAppSelector(((state) => state.site));
  const timer = React.useRef(null);
  const [justUpdated, setJustUpdated] = React.useState(true);

  React.useEffect(() => {
    setJustUpdated(true);
    if (timer.current) {
      clearTimeout(timer.current);
    }
    // Clear the rectangle hint after 3000 ms.
    timer.current = setTimeout(() => {
      setJustUpdated(false);
    }, 3000);
  }, [inspectState]);
  if (inspectState.selectedChannel < 0 || !datasetDetailCache || datasetDetailCache.dataset_type != 'NCF') {
    return null;
  }
  if (!inspectState.selectedRange || !inspectState.selectedRange.latitude || !inspectState.selectedRange.longitude) {
    return null;
  }
  const southWest = new LatLng(inspectState.selectedRange.latitude[0], inspectState.selectedRange.longitude[0]);
  const northEast = new LatLng(inspectState.selectedRange.latitude[1], inspectState.selectedRange.longitude[1]);
  const rectangle = new LatLngBounds(southWest, northEast);
  const pathOptions: PathOptions = {
    color: '#2b8cc4',
    className: 'map-path',
    lineCap: 'round',
    weight: 1,
    opacity: justUpdated ? 0.9 : 0,
    fillOpacity: justUpdated ? 0.35 : 0,
  };
  // console.log(rectangle);
  return (<LayerGroup>
    <Rectangle pathOptions={pathOptions} bounds={rectangle}/>
  </LayerGroup>);
}
