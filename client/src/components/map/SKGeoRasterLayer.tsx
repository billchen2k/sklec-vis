import * as React from 'react';
import {useMap} from 'react-leaflet';

import GeoRasterLayer, {GeoRaster} from 'georaster-layer-for-leaflet';
// @ts-ignore
import parseGeoraster from 'georaster';
import {useLeafletContext} from '@react-leaflet/core';
import chroma from 'chroma-js';
import {useAppSelector} from '@/app/hooks';
import {Layer} from 'leaflet';
import {useEffect} from 'react';
export interface IGeoRasterLayerProps {
  georasterUrl?: string;
}

const SKGeoRasterLayer = (props: IGeoRasterLayerProps) : any => {
  // const {georasterUrl} = props;
  const context = useLeafletContext();
  const map = useMap();

  const {rasterState} = useAppSelector((state) => state.site);

  let layer: Layer = null;

  useEffect(() => {
    if (!rasterState || !rasterState.open) {
      return;
    }
    const {opacity, colorScale, resolution, invertColorScale, rasterMin, rasterMax} = rasterState.config;
    const container = context.layerContainer || context.map;
    const control = context.layersControl;

    const drawGeoRaster = (georaster: any) => {
      let layerToRemove: Layer = null;
      map.eachLayer((layer) => {
        // @ts-ignore
        if (layer.georasters) {
          layerToRemove = layer;
        }
      });
      const min = rasterMin || 0.06;
      const max = rasterMax || 0.15;
      // const min = georaster.mins[0];
      // const max = georaster.maxs[0];
      console.log(georaster);
      const scale = chroma.scale(colorScale || 'RdYlGn').domain(invertColorScale? [max, min] : [min, max]);
      layer = new GeoRasterLayer({
        georaster: georaster,
        debugLevel: 1,
        opacity: opacity || 0.75,
        resolution: resolution || 2 ** 8,
        pixelValuesToColorFn: (pixelValues: any) => {
          if (isNaN(pixelValues[0]) || pixelValues[0] == georaster.noDataValue || pixelValues[0] > 9e36) {
            return null;
          }
          let color = undefined;
          const boundedVal = Math.min(Math.max(pixelValues[0], min), max);
          color = scale(max - boundedVal + min);
          return color.hex();
        },
      });
      container.addLayer(layer);
      control.addOverlay(layer, 'Raster');
      setTimeout(() => {
        if (layerToRemove) {
          container.removeLayer(layerToRemove);
          control.removeLayer(layerToRemove);
        }
      }, 300);
    };

    fetch(rasterState.rasterLink)
        .then((response) => response.arrayBuffer())
        .then((arrayBuffer) => {
          parseGeoraster(arrayBuffer).then((georaster: any) => {
            drawGeoRaster(georaster);
          });
        });

    return () => {
      layer && setTimeout(() => {
        container.removeLayer(layer);
        control.removeLayer(layer);
      }, 300);
    };
  }, [rasterState.rasterLink, rasterState.config]);

  return null;
};

export default SKGeoRasterLayer;

