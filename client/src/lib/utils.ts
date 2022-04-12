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
