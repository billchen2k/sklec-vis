import React from 'react';
import L, {DivIcon, Icon} from 'leaflet';
import '@mui/material';

import {MapContainer, Marker, Popup, TileLayer, LayersControl, LayerGroup} from 'react-leaflet';
import {AttachFile, FilePresent, Folder} from '@mui/icons-material';
import {renderToStaticMarkup} from 'react-dom/server';
import {common} from '@mui/material/colors';
import DataDetails from '@/components/sidebar/DataDetails';
import config from '@/config';
import SKGeoRasterLayer from '@/components/map/SKGeoRasterLayer';
import {useAppSelector} from '@/app/hooks';
import DataMarkerPopupContent from '@/components/map/DataMarkerPopupContent';
import useAxios from 'axios-hooks';
import DatasetMarkers from '@/components/map/DatasetMarkers';

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

  // const [lat, setLat] = React.useState(0);
  // const [lng, setLng] = React.useState(0);
  // const [zoom, setZoom] = React.useState(2);
  // const [markers, setMarkers] = React.useState([]);
  // const [data, setData] = React.useState([]);
  const {rasterState} = useAppSelector(((state) => state.site));


  const icon = new DivIcon({
    html: renderToStaticMarkup(
        <FilePresent sx={{color: '#71d0b8'}} />,
    ),
  });


  return (
    <MapContainer id={'map-layer'} center={defaultCenter} zoom={6}
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
        {/* <SKGeoRasterLayer georasterUrl={'dataset/sentinel3/RDI_S3A_20200429.tiff'} />*/}

        <DatasetMarkers />
        <LayerGroup>
          {rasterState &&
          <SKGeoRasterLayer/>
          }
        </LayerGroup>
      </LayersControl>

    </MapContainer>
  );
};

export default BaseMap;
