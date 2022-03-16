import * as React from 'react';
import {LayerGroup, LayersControl, Marker, Popup} from 'react-leaflet';
import DataMarkerPopupContent from '@/components/map/DataMarkerPopupContent';
import L, {DivIcon, Icon} from 'leaflet';
import {renderToStaticMarkup} from 'react-dom/server';
import {FilePresent} from '@mui/icons-material';
import useAxios from 'axios-hooks';
import {useAppDispatch} from '@/app/hooks';
import {uiSlice} from '@/store/uiSlice';

export interface IDatasetMarkersProps {
}

export const markerIcons = {
  greenFolder: new DivIcon({
    html: renderToStaticMarkup(
        <FilePresent sx={{color: '#71d0b8'}} />,
    ),
  }),
  redCircle: new Icon({
    iconUrl: '/img/markers/marker-red.png',
    iconRetinaUrl: '/img/markers/marker-red@2x.png',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  }),
};

const DatasetMarkers = (props: IDatasetMarkersProps) => {
  const [{data, loading, error}, refetch] = useAxios('/api/dataset/');
  const dispatch = useAppDispatch();
  const center = new L.LatLng(31.167777777777778, 122.2182222);
  const ADCPMetaData = {
    'Instrument': '201283',
    'Sensors': 'Serial K175067, Channel 1',
    'Sampling Period': '10000',
    'Longtitude': '122˚13\'5.60"',
    'Latitude': '31˚04\'4.00"',
  };

  const CTD = {
    'Instrument': '201283',
    'Sensors': 'Serial K175067, Channel 1',
    'Sampling Period': '10000',
    'Longtitude': '122˚13\'5.60"',
    'Latitude': '31˚04\'4.00"',
  };

  if (loading ) {
    dispatch(uiSlice.actions.beginLoading('Loading datasets...'));
    return null;
  }
  dispatch(uiSlice.actions.endLoading());
  if (error || !data) {
    dispatch(uiSlice.actions.openSnackbar({
      message: 'Error fetching datasets: ' + error && error.message || 'Unknown error.',
      severity: 'error',
    }));
    return null;
  }
  console.log(data);

  const markers = data.results.map((one: any) => {
    const center = new L.LatLng(one.latitude, one.longitude);
    return (
      <Marker position={[one.latitude, one.longitude]} key={one.uuid} icon={markerIcons.redCircle}>
        <Popup>
          <DataMarkerPopupContent name={one.name} link={`/view/${one.uuid}`} description={one.description} />
        </Popup>
      </Marker>
    );
  });
  return (
    <LayersControl.Overlay name={'Dataset List'} checked={true}>
      <LayerGroup>
        <Marker position={center} icon={markerIcons.greenFolder}>
          <Popup>
            <DataMarkerPopupContent name={'ADCP_202009-10'} meta={ADCPMetaData} link={'/view/1'}></DataMarkerPopupContent>
            <DataMarkerPopupContent name={'CTD_201283_20201111_1520'} meta={ADCPMetaData} link={'/view/2'}></DataMarkerPopupContent>
          </Popup>
        </Marker>
        {markers}
      </LayerGroup>
    </LayersControl.Overlay>
  );
};

export default DatasetMarkers;
