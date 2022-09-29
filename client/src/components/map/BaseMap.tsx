import '@mui/material';
import L from 'leaflet';
import React from 'react';

import {useAppSelector} from '@/app/hooks';
import DatasetMarkers from '@/components/map/DatasetMarkers';
import MapToolbar from '@/components/map/MapToolbar';
import SKGeoRasterLayer from '@/components/map/SKGeoRasterLayer';
import config from '@/config';
import {LayerGroup, LayersControl, MapContainer, TileLayer} from 'react-leaflet';
import {MapEvents} from './MapEvents';
import {NCFControlLayer} from './NCFControlLayer';

export interface IMapProps {
  children?: any;
}


const MapBoxThemes = [
  {
    name: 'Satellite Map',
    id: 'mapbox/satellite-streets-v11',
  },
  {
    name: 'Dark Street Map',
    id: 'mapbox/dark-v10',
  },
  {
    name: 'Light Street Map',
    id: 'mapbox/light-v10',
  },
];

const BaseMap = (props: IMapProps) => {
  const defaultCenter = new L.LatLng(31.067777777777778, 122.2182222);
  const {rasterState, datasetDetailCache} = useAppSelector(((state) => state.site));

  // const icon = new DivIcon({
  //   html: renderToStaticMarkup(
  //       <FilePresent sx={{color: '#71d0b8'}} />,
  //   ),
  // });

  React.useEffect(() => {
    // @ts-ignore
    document.getElementsByClassName('leaflet-control-attribution')[0].style.display = 'none';
  }, []);

  return (
    <MapContainer id={'map-layer'} center={defaultCenter} zoom={6}
      maxBounds={new L.LatLngBounds(new L.LatLng(90, 180), new L.LatLng(-90, -180))}
      maxBoundsViscosity={1} // Disables dragging out of bounds entirely.
      className={'layer-basemap'}>
      <LayersControl>
        {MapBoxThemes.map((theme, index) => {
          return (
            <LayersControl.BaseLayer key={index} name={theme.name} checked={index == 0}>
              <TileLayer
                url="https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}{r}?access_token={accessToken}"
                attribution='Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>'
                id={theme.id}
                tileSize={512}
                maxZoom={18}
                zoomOffset={-1}
                accessToken={config.map.apiToken}
              />
            </LayersControl.BaseLayer>
          );
        })}
        <DatasetMarkers />
        <MapToolbar />
        <MapEvents />
        <NCFControlLayer />
        {rasterState &&
          <SKGeoRasterLayer/>
        }

      </LayersControl>
    </MapContainer>
  );
};

export default BaseMap;
