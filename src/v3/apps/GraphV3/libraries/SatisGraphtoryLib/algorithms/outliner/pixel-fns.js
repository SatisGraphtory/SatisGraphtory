const pixelFns = {
  opaque: function (getPixel, x, y, threshold) {
    return getPixel(x, y, 3) >= threshold;
  },

  'not-white': function (getPixel, x, y, threshold) {
    var lum =
      0.299 * getPixel(x, y, 0) +
      0.587 * getPixel(x, y, 1) +
      0.114 * getPixel(x, y, 2);
    return lum <= threshold;
  },

  'not-black': function (getPixel, x, y, threshold) {
    var lum =
      0.299 * getPixel(x, y, 0) +
      0.587 * getPixel(x, y, 1) +
      0.114 * getPixel(x, y, 2);
    return lum >= threshold;
  },
};

export default pixelFns;
