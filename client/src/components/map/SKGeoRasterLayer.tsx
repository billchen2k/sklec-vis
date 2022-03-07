import * as React from 'react';
import {useMap} from 'react-leaflet';

import GeoRasterLayer, {GeoRaster} from 'georaster-layer-for-leaflet';
// @ts-ignore
import parseGeoraster from 'georaster';
import {useLeafletContext} from '@react-leaflet/core';
import chroma from 'chroma-js';
import {useAppSelector} from '@/app/hooks';
import {Layer} from 'leaflet';
export interface IGeoRasterLayerProps {
  georasterUrl?: string;
}

const SKGeoRasterLayer = (props: IGeoRasterLayerProps) : any => {
  // const {georasterUrl} = props;
  const context = useLeafletContext();
  const {rasterState} = useAppSelector((state) => state.site);

  if (!rasterState) {
    return null;
  }

  React.useEffect(() => {
    let layer: Layer = null;
    const container = context.layerContainer || context.map;
    const control = context.layersControl;
    fetch(rasterState.rasterLink)
        .then((response) => response.arrayBuffer())
        .then((arrayBuffer) => {
          parseGeoraster(arrayBuffer).then((georaster: any) => {
            const min = 0.0;
            const max = 0.2;
            // const min = georaster.mins[0]
            // const max = georaster.maxs[0];
            console.log(georaster);
            console.log(chroma.brewer);
            // const scale = chroma.scale('Viridis');
            // const scale = chroma.scale('Spectral');
            const scale = chroma.scale(rasterState.colorScale || 'RdYlGn');

            layer = new GeoRasterLayer({
              georaster: georaster,
              opacity: rasterState.opacity || 0.75,
              resolution: rasterState.resolution || 2 ** 8,
              pixelValuesToColorFn: (pixelValues: any) => {
                if (isNaN(pixelValues[0]) || pixelValues[0] == georaster.noDataValue) {
                  return null;
                }
                const color = scale(
                    (pixelValues[0] - min) / (max - min),
                );
                return color.hex();
              },
            });
            container.addLayer(layer);
            control.addOverlay(layer, 'Raster');
          });
        });

    return () => {
      container.removeLayer(layer);
      control.removeLayer(layer);
    };
  }, [rasterState, context.layersControl]);

  return null;
};

export default SKGeoRasterLayer;

