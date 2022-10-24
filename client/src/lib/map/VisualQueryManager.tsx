/**
 * Reference: DDLVisCode 2021 By Chenhui Li.
 */

import {LayerManager} from '@/lib/map/LayerManager';
import L from 'leaflet';

require('/public/js/leaflet.pather.js');
// require('/public/js/leaflet.label.js');
export class VisualQueryManager extends LayerManager {
  labels: any[];

  _init() {
    this.labels = [];
    super._init();
  }

  _setOption(options: any) {
    this.layer.setOptions(options);
  }

  _clearSelection(removeAll = true) {
    const lines = this.layer.getPaths();
    for (let i = this.labels.length - 1; i >= 0; i--) {
      this.labels[i].remove();
      this.labels.splice(i, 1);
    }
    let len = lines.length;
    if (!removeAll) {
      len--;
    }
    for (let i = 0; i < len; i++) {
      this.layer.removePath(lines[i]);
    }
    if (removeAll) {
      window.dispatchEvent(new CustomEvent('visual-query-cleared', {}));
    }
  }

  addEventHooks() {
    L.DomUtil.addClass(this.map.getContainer(), 'crosshair-cursor-enabled');
    super.addEventHooks();
  }

  removeEventHooks() {
    L.DomUtil.removeClass(this.map.getContainer(), 'crosshair-cursor-enabled');
    super.removeEventHooks();
  }

  addLayer() {
    this.layer = new L.Pather(this.options);

    this.layer.on('created', (e: any) => {
      // at this moment, Pather holds previous pathes and the newly created one,
      this._clearSelection(false);
      // bind labels
      for (let i = 0; i < e.latLngs.length; i++) {
        const label = L.marker(e.latLngs[i], {
          icon: L.divIcon({
            className: '',
            html: `<div class="leaflet-label leaflet-label-right">${i + 1}</div>`,
            iconSize: [30, 30],
            iconAnchor: [-10, 15],
          }),
        });
        label.addTo(this.map);
        this.labels.push(label);
      }
      console.log('Pather: created line ', e);
      const pts = e.latLngs.map((latLng: L.LatLng) => this.map.latLngToLayerPoint(latLng));
      window.dispatchEvent(new CustomEvent('visual-query-created', {
        detail: {
          pts: pts,
          latLngs: e.latLngs,
        },
      }));
    });

    super.addLayer();
  }

  removeLayer() {
    this._clearSelection(true);
    super.removeLayer();
  }

  defaultOptions(): {} {
    // Pather.js options:
    //   moduleClass: 'pather',
    //   lineClass: 'drawing-line',
    //   detectTouch: true,
    //   elbowClass: 'elbow',
    //   removePolylines: true,
    //   strokeColour: 'rgba(0,0,0,.5)',
    //   strokeWidth: 2,
    //   width: '100%',
    //   height: '100%',
    //   smoothFactor: 10,
    //   pathColour: 'black',
    //   pathOpacity: 0.55,
    //   pathWidth: 3,
    //   mode: MODES.ALL
    return {
      smoothFactor: 5,
      strokeColor: '#ff4f55',
      strokeWidth: 2,
      pathOpacity: 0.8,
      pathWidth: 3,
      sampleGap: 2, // 路径关键点的采样间隔，和 areaSelGap 作用不一样，注意区分
      pathColour: '#4fe9ff',
    };
  }

  get radius() {
    return Math.floor(this.options.pathWidth / 2); // radius:0 for brushSize:1
  }
}
