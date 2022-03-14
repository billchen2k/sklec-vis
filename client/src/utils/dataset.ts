export function copyMetaToClipboard(meta: { [key: string]: string }) {
  let metaString = '';
  for (const key in meta) {
    if (meta.hasOwnProperty(key)) {
      metaString += `${key}: ${meta[key]}\n`;
    }
  }
  navigator.clipboard.writeText(metaString);
}