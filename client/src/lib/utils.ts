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


export function readableFileSize(size: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  let i = 0;
  while (size >= 1024) {
    size /= 1024;
    ++i;
  }
  return `${size.toFixed(3)} ${units[i]}`;
}

export function capitalizeFirstLetter(src: string): string {
  // Don't need this anymore. Use lodash functions instead.
  if (src && src.length > 0) {
    return src.charAt(0).toUpperCase + src.slice(-1);
  } else {
    return '';
  }
}

export function copyToClipboard(text: string) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
  } catch (err) {
    console.error('Unable to copy to clipboard', err);
  }
  document.body.removeChild(textArea);
}

export function currentDateStringShort(): string {
  const d = new Date();
  return `${d.getFullYear()}${d.getMonth() + 1}${d.getDate()}${d.getHours()}${d.getMinutes()}${d.getSeconds()}`;
}
