export class LayerManager {
  map: L.Map;
  layer: any;
  options: any;
  name: string;

  constructor(map: L.Map, options: any = {}) {
    this.map = map;
    this.layer = null;
    this.options = null;
    this.name = '';
    this.init(options);
  }

  // Overwrite this one for initialization
  // initialize layer, set layer callbacks...
  // default options and options param already set in init(options),
  // use this.options in _init()
  _init() { }

  init(options: any) {
    this.options = {...this.defaultOptions(), ...options};
    this._init();
  }

  defaultOptions() {
    return {};
  }

  addEventHooks() {}

  removeEventHooks() {}

  addLayer() {
    if (this.layer) {
      this.layer.addTo(this.map);
    }
  }

  removeLayer() {
    if (this.layer) {
      this.layer.remove();
    }
  }
}
