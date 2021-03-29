import getImageOutline from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/algorithms/outliner/getImageOutline ';
import smooth from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/algorithms/outliner/smooth';

const outlineCache = new Map();

export default function createOutline(imageElement) {
  if (outlineCache.has(imageElement)) {
    return outlineCache.get(imageElement);
  }
  if (!imageElement.complete || !imageElement.naturalWidth) {
    throw new Error('getImageOutline: imageElement must be loaded.');
  }

  const width = imageElement.naturalWidth,
    height = imageElement.naturalHeight;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(imageElement, 0, 0);

  const imageData = ctx.getImageData(0, 0, width, height).data;

  const getPixel = function (x, y, channel) {
    return imageData[x * 4 + y * 4 * width + channel];
  };

  const output = smooth(smooth(getImageOutline(width, height, getPixel)));

  outlineCache.set(imageElement, output);

  return output;
}
