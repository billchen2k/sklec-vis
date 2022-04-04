/* tslint:disable */
import * as React from 'react';
import ReactDOMServer from 'react-dom/server';
import {useMap} from 'react-leaflet';
import L, {LeafletMouseEvent} from 'leaflet';
import {useEffect} from 'react';
import {ContentPaste, EditLocationOutlined, LocationOn} from '@mui/icons-material';
import CoordinateDisplay from '@/components/map/CoordinateDisplay';
import {markerIcons} from '@/components/map/DatasetMarkers';
import {Button, Card, CardContent, Typography} from '@mui/material';
import {uiSlice} from '@/store/uiSlice';
import {useAppDispatch} from '@/app/hooks';
require('leaflet');
require('leaflet-toolbar/dist/leaflet.toolbar.min.js');

const MapToolbar = (props) => {
  const map = useMap();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const cancelSubAction = L.Toolbar2.Action.extend({
      options: {
        toolbarIcon: {html: '<div>Cancel</div>', tooltip: 'Cancel'},
      },

      initialize: function(map, myAction) {
        this.myAction = myAction;
        L.Toolbar2.Action.prototype.initialize.call(this);
      },
      addHooks: function() {
        map.off('click');
        this.myAction.disable();
        this.disable();
      },
    });

    const coordinateInspectAction = L.Toolbar2.Action.extend({
      options: {
        toolbarIcon: {
          html: ReactDOMServer.renderToStaticMarkup(<LocationOn sx={{width: 16, pt: 0.5}} htmlColor={'#000000'} />),
          tooltip: 'Coordinate Selector',
        },
        subToolbar: new L.Toolbar2({
          actions: [cancelSubAction],
        }),
      },

      addHooks: function() {
        L.Control.CoordinateControl = L.Control.extend({
          onAdd: function(map) {
            const container = L.DomUtil.create('div', 'leaflet-control-coordinate-control');
            container.innerHTML = ReactDOMServer.renderToStaticMarkup((
              <Card sx={{m: 2}}>
                <CardContent>
                  <Typography variant={'body1'}>Selected Coordinate:</Typography>
                  <Typography variant={'body2'}><b>Latitude</b>: <span id={'latitude-display'}>(Not Selected)</span></Typography>
                  <Typography variant={'body2'}><b>Longitude</b>: <span id={'longitude-display'}>(Not Selected)</span></Typography>
                  <Button startIcon={<ContentPaste />} variant={'outlined'} color={'inherit'}
                    size={'small'} sx={{mt: 1}}
                    onClick={() => {
                      const lat = document.getElementById('latitude-display');
                      const lon = document.getElementById('longitude-display');
                      const latVal = lat.innerText;
                      const lonVal = lon.innerText;
                      navigator.clipboard.writeText(`${latVal}, ${lonVal}`);
                    }}
                  >COPY</Button>
                </CardContent>
              </Card>
            ));
            L.DomEvent.disableClickPropagation(container);
            return container;
          },
        });

        L.Control.coordinateControl = function(options) {
          return new L.Control.CoordinateControl(options);
        };

        this.controlLayer = L.Control.coordinateControl({
          position: 'bottomleft',
        }).addTo(map);

        const setDisplayLatLng = (latlng) => {
          console.log(latlng);
          const latitudeDisplay = document.getElementById('latitude-display');
          const longitudeDisplay = document.getElementById('longitude-display');
          latitudeDisplay.innerHTML = latlng.lat.toFixed(6);
          longitudeDisplay.innerHTML = latlng.lng.toFixed(6);
        };

        map.on('click', (e) => {
          if (this.marker) {
            this.marker.setLatLng(e.latlng);
            setDisplayLatLng(e.latlng);
            return;
          }
          const marker = L.marker(e.latlng, {
            draggable: true,
            icon: markerIcons.crossSymbol,
          });
          marker.on('dragend', (e) => {
          // this.marker.setLatLng(e.target.getLatLng());
            setDisplayLatLng(e.target.getLatLng());
          });
          this.marker = marker;
          setDisplayLatLng(e.latlng);
          marker.addTo(map);
        });
      },

      removeHooks: function() {
        map.off('click');
        if (this.marker) {
          this.marker.remove();
          this.marker = null;
        }
        this.controlLayer.remove();
      },
    });
    new L.Toolbar2.Control({
      position: 'topleft',
      actions: [
        coordinateInspectAction,
      ],
    }).addTo(map);
  });

  return (
    <div>
    </div>
  );
};

export default MapToolbar;
