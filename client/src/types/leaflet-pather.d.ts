
import * as L from 'leaflet';
// @ts-ignore
// declare module 'leaflet-pather';

declare module 'leaflet' {
  class Pather extends L.Control {

  }
}
