import React, {Component} from 'react';
import L, {DivIcon} from 'leaflet';
import '@mui/material';

import {MapContainer, TileLayer, Marker, Popup} from 'react-leaflet';
import {LocationOn as LocationOnIcon} from '@mui/icons-material';
import {renderToStaticMarkup} from 'react-dom/server';
import {common} from '@mui/material/colors';
import {DataMetaInfo} from './MetaInfo/DataMetaInfo';

class Map extends Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      lat: 0,
      lng: 0,
      zoom: 2,
      markers: [],
      data: [],
    };
  }

  componentDidMount() {}

  render() {
    const center = new L.LatLng(31.067777777777778, 122.2182222);
    const icon = new DivIcon({
      html: renderToStaticMarkup(
          <LocationOnIcon sx={{color: common.white}} />,
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
      <MapContainer id={'map-layer'} center={center} zoom={10} style={{height: '100%'}}>
        <TileLayer
          url="https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}{r}?access_token={accessToken}"
          attribution='Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>'
          id='mapbox/dark-v10'
          tileSize={512}
          maxZoom={18}
          zoomOffset={-1}
          /* eslint-disable-next-line max-len */
          accessToken="pk.eyJ1IjoiYmlsbGNoZW4yayIsImEiOiJja3R2MDBwNWgyNDljMnBvMmdzbnU0dTZ5In0.To49SgD0gHYceQ8Ap2BG3g"
        />
        <Marker position={center} icon={icon}>
          <Popup>
            <DataMetaInfo datasetName={'CTD_201283_20201111_1520'} meta={demoMetaData}></DataMetaInfo>
          </Popup>
        </Marker>
        {this.props.children}
      </MapContainer>
    );
  }
}

export default Map;
