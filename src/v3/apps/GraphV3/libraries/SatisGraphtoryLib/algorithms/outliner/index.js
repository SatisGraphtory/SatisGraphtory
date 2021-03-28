import getImageOutline from 'v3/apps/GraphV3/libraries/SatisGraphtoryLib/algorithms/outliner/getImageOutline ';

function createOutline(imageElement, options) {
  if (!imageElement.complete || !imageElement.naturalWidth) {
    throw new Error('getImageOutline: imageElement must be loaded.');
  }

  var width = imageElement.naturalWidth,
    height = imageElement.naturalHeight;

  var canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  var ctx = canvas.getContext('2d');
  ctx.drawImage(imageElement, 0, 0);

  var imageData = ctx.getImageData(0, 0, width, height).data;

  var getPixel = function (x, y, channel) {
    return imageData[x * 4 + y * 4 * width + channel];
  };

  return getImageOutline(width, height, getPixel, options);
}

export default createOutline;
