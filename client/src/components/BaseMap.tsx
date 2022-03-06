import React from 'react';
import L, {DivIcon} from 'leaflet';
import '@mui/material';

import {MapContainer, Marker, Popup, TileLayer} from 'react-leaflet';
import {AttachFile, FilePresent, Folder} from '@mui/icons-material';
import {renderToStaticMarkup} from 'react-dom/server';
import {common} from '@mui/material/colors';
import DataMetaInfo from '@/components/meta/DataMetaInfo';
import config from '@/config';

export interface IMapProps {
  children?: any;
}

const BaseMap = (props: IMapProps) => {
  const [lat, setLat] = React.useState(0);
  const [lng, setLng] = React.useState(0);
  const [zoom, setZoom] = React.useState(2);
  const [markers, setMarkers] = React.useState([]);
  const [data, setData] = React.useState([]);

  const center = new L.LatLng(31.067777777777778, 122.2182222);

  const icon = new DivIcon({
    html: renderToStaticMarkup(
        <FilePresent sx={{color: '#71d0b8'}} />,
    ),
  });

  const demoMetaData = {
    'Instrument': '201283',
    'Sensors': 'Serial K175067, Channel 1',
    'Sampling Period': '10000',
    'Longtitude': '122˚13\'5.60"',
    'Latitude': '31˚04\'4.00"',
  };

  return (
    <MapContainer id={'map-layer'} center={center} zoom={10}
      className={'layer-basemap'}>
      <TileLayer
        url="https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}{r}?access_token={accessToken}"
        attribution='BaseMap data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>'
        id='mapbox/dark-v10'
        tileSize={512}
        maxZoom={18}
        zoomOffset={-1}
        /* eslint-disable-next-line max-len */
        accessToken={config.map.apiToken}
      />
      <Marker position={center} icon={icon}>
        <Popup>
          <DataMetaInfo datasetName={'CTD_201283_20201111_1520'} meta={demoMetaData}></DataMetaInfo>
        </Popup>
      </Marker>
      {props.children}
    </MapContainer>
  );
};

export default BaseMap;
