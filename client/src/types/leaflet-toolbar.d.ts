import * as L from 'leaflet';


export interface IToolbarActionOptions {
  toolbarIcon: {
    html?: string;
    className?: string;
    // Tooltip to be shown when the cursor hovers over the icon
    tooltip?: string;
  }
  subToolbar?: L.Toolbar2;
}

export interface IToolbarOptions {
  position?: L.ControlPosition;
  actions?: (typeof L.Toolbar2.Action)[];
  className? : string;
}


declare module 'leaflet' {
  class Toolbar2 extends L.Control {
    constructor(options: any);
    addTo(map: L.Map): this;
    onAdd(map: L.Map): HTMLElement;
    onRemove(map: L.Map): void;
    appendToContainer(container: any): void;
  }

  namespace Toolbar2 {
     class Control extends L.Toolbar2 {
       constructor(options: IToolbarOptions);
       addTo(map: L.Map): this;
     }

     class Popup extends L.Toolbar2 {
       constructor(options: IToolbarOptions);
       // @ts-ignore
       addTo(latlng: L.LatLng, map: typeof L.Map): this;
     }

     class Action extends L.Handler {
       constructor(options: IToolbarActionOptions);
     }

  }
}
