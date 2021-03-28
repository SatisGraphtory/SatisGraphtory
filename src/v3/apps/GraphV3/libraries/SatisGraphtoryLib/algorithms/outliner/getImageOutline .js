import extend from 'extend';
import simplify from 'line-simplify-rdp';
import traceRegion from 'marching-squares';
import findEdgePoint from './find-edge-point';
import pixelFns from './pixel-fns';

/**
 * Synchronously processes the bitmap specified via width, height and getPixel, returning an
 * outline
 * @param {number} width - pixels across
 * @param {number} height - pixels down
 * @param {function} getPixel - function taking params x (0 to width-1), y (0 to height-1) and channel (0=R 1=G 2=B 3=A)
 * @param {object} options - options
 */

function getImageOutline(width, height, getPixel, options) {
  if (
    typeof width !== 'number' ||
    typeof height !== 'number' ||
    typeof getPixel !== 'function'
  )
    throw new TypeError();

  options = extend(
    {
      opacityThreshold: 170,
      simplifyThreshold: 1,
      pixelFn: 'opaque',
    },
    options || {}
  );

  if (typeof options !== 'object') throw new TypeError();

  const pixelFn = pixelFns[options.pixelFn];
  if (!pixelFn) throw new Error('Invalid pixelFn');

  const opacityThreshold = options.opacityThreshold;
  const isInRegion = function (x, y) {
    if (x < 0 || y < 0 || x >= width || y >= height) return false;
    return pixelFn(getPixel, x, y, opacityThreshold);
  };

  const startPt = findEdgePoint(width, height, isInRegion);

  let poly = traceRegion(startPt.x, startPt.y, isInRegion);
  if (options.simplifyThreshold >= 0) {
    poly = simplify(poly, options.simplifyThreshold, true);
  }
  return poly;
}

export default getImageOutline;
