import * as React from 'react';
import {LayerManager} from '@/lib/map/LayerManager';
import L, {LatLngBounds, LeafletMouseEvent, PathOptions} from 'leaflet';
import consts from '../consts';


export class MapBoxSelectorManager extends LayerManager {
  startBound: L.LatLng;
  endBound: L.LatLng;
  layer: L.Rectangle;
  moving: boolean;

  _renderBox() {
    if (this.moving) {
      this.layer.setBounds(new LatLngBounds(this.startBound, this.endBound));
      this.layer.setStyle({
        opacity: 0.9,
        fillOpacity: 0.35,
      });
    } else {
      this.layer.setStyle({
        opacity: 0,
        fillOpacity: 0,
      });
    }
  }

  _onMapMouseDown(event: LeafletMouseEvent) {
    this.moving = true;
    this.startBound = event.latlng;
  }

  _onMapMouseMove(event: LeafletMouseEvent) {
    if (!this.moving) {
      return;
    }
    this.endBound = event.latlng;
    this._renderBox();
  }

  _onMapMouseUp(event: LeafletMouseEvent) {
    this.moving = false;
    this._renderBox();
    // Dispatch event
    document.dispatchEvent(new CustomEvent(consts.EVENT.MAP_BOX_SELECTED, {
      detail: {
        latlng1: this.startBound,
        latlng2: this.endBound,
      },
    }));
  }

  _init() {
    this.moving = false;
    super._init();
  }

  addLayer() {
    L.DomUtil.addClass(this.map.getContainer(), 'crosshair-cursor-enabled');
    this.layer = L.rectangle([[10, 10], [0, 0]], {
      color: '#2b8cc4',
      className: 'crosshair-cursor-enabled',
      lineCap: 'round',
      weight: 1,
      opacity: 0,
      fillOpacity: 0,
    });
    super.addLayer();
  }

  removeLayer() {
    L.DomUtil.removeClass(this.map.getContainer(), 'crosshair-cursor-enabled');
    this.layer.remove();
    super.removeLayer();
  }

  addEventHooks() {
    this.map.dragging.disable();
    this.map.addEventListener('mousedown', this._onMapMouseDown.bind(this));
    this.map.addEventListener('mousemove', this._onMapMouseMove.bind(this));
    this.map.addEventListener('mouseup', this._onMapMouseUp.bind(this));
    super.addEventHooks();
  }

  removeEventHooks() {
    this.map.dragging.enable();
    this.map.removeEventListener('mousedown');
    this.map.removeEventListener('mousemove');
    this.map.removeEventListener('mouseup');
    super.removeEventHooks();
  }
}
