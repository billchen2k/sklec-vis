import {LayerManager} from '@/lib/map/LayerManager';
import L, {LeafletEvent, LeafletMouseEvent} from 'leaflet';
import {markerIcons} from '@/components/map/DatasetMarkers';
import ReactDOMServer from 'react-dom/server';
import {Button, Card, CardContent, Typography} from '@mui/material';
import {ContentPaste} from '@mui/icons-material';
import * as React from 'react';
import consts from '../consts';
import {copyToClipboard} from '../utils';
import * as d3 from 'd3';

export class CoordinateInspectorManager extends LayerManager {
  private marker: any;

  public __init__(map: L.Map): void {
    this.map = map;
  }

  public addEventHooks(): void {
    const setDisplayLatLng = (latlng: L.LatLng) => {
      const latitudeDisplay = document.getElementById('latitude-display');
      const longitudeDisplay = document.getElementById('longitude-display');
      const copyButton = document.getElementById('button-copy-coordinates');
      latitudeDisplay.innerHTML = latlng.lat.toFixed(6);
      longitudeDisplay.innerHTML = latlng.lng.toFixed(6);
      // Trigger global events for data editor to listen
      document.dispatchEvent(new CustomEvent(consts.EVENT.COORDINATE_SELECTED, {
        detail: {
          lat: latlng.lat % 90,
          lng: latlng.lng % 180,
        },
      }));
    };

    // copyButton.onclick

    this.map.on('click', (e: LeafletMouseEvent) => {
      if (this.marker) {
        this.marker.setLatLng(e.latlng);
        setDisplayLatLng(e.latlng);
        return;
      }
      const marker = L.marker(e.latlng, {
        draggable: true,
        icon: markerIcons.crossSymbol,
      });
      marker.on('dragend', (e: LeafletEvent) => {
        // this.marker.setLatLng(e.target.getLatLng());
        setDisplayLatLng(e.target.getLatLng());
      });
      this.marker = marker;
      setDisplayLatLng(e.latlng);
      marker.addTo(this.map);
    });
  }


  public addLayer(): void {
    const CoordinateControl = L.Control.extend({
      onAdd: function(map: L.Map) {
        const container = L.DomUtil.create('div', 'leaflet-control-coordinate-control');
        container.innerHTML = ReactDOMServer.renderToStaticMarkup((
          <Card sx={{m: 2}}>
            <CardContent>
              <Typography variant={'body1'}>Selected Coordinate:</Typography>
              <Typography variant={'body2'}><b>Latitude</b>: <span id={'latitude-display'}>(Not Selected)</span></Typography>
              <Typography variant={'body2'}><b>Longitude</b>: <span id={'longitude-display'}>(Not Selected)</span></Typography>
              <Button id={'button-copy-coordinates'} startIcon={<ContentPaste />} variant={'outlined'} color={'inherit'}
                size={'small'} sx={{mt: 1}}
              >COPY</Button>
            </CardContent>
          </Card>
        ));
        L.DomEvent.disableClickPropagation(container);
        return container;
      },
    });

    this.layer = new CoordinateControl({
      position: 'bottomleft',
    }).addTo(this.map);
  }

  public removeEventHooks(): void {
    this.map.off('click');
    if (this.marker) {
      this.marker.remove();
      this.marker = null;
    }
  }

  public removeLayer(): void {
    super.removeLayer();
  }
}
