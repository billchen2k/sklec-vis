import {SvgIconComponent} from '@mui/icons-material';
import {renderToStaticMarkup} from 'react-dom/server';

/**
 * Convert MUI SvgIconComponent to Plotly.js compatible Icon object.
 */
export function muiIconToPlotlyIcon(icon:JSX.Element): Plotly.Icon {
  const html = renderToStaticMarkup(icon);
  const path = /path d=\"(.*)\"/.exec(html)[1];
  const width = parseInt(/viewBox=\"([0-9\s]+)\"/.exec(html)[1].split(' ')[2]);
  const height = parseInt(/viewBox=\"([0-9\s]+)\"/.exec(html)[1].split(' ')[3]);
  const plotlyIcon: Plotly.Icon = {
    path: path,
    width: width,
    height: height,
  };
  return plotlyIcon;
};

/**
 * Downsample an array of data.
 */
export function downsampleValue(src: number[] | string[], n: number): number[] {
  const dst: number[] = [];
  for (let i = 0; i < src.length; i += n) {
    let currentSum = 0;
    for (let j = 0; j < n && i + j < src.length; j++) {
      currentSum += parseFloat(src[i + j] as string);
    }
    dst.push(currentSum / n);
  }
  console.log(src);
  console.log(dst);
  return dst;
}

export function downsampleAxis(src: any[], n: number): any[] {
  const dst: any[] = [];
  for (let i = 0; i < src.length; i += n) {
    dst.push(src[i]);
  }
  return dst;
}
