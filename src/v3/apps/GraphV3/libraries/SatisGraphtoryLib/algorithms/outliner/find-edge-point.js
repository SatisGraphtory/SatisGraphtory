export default function findEdgePoint(width, height, isInRegion) {
  // Start by trying the diagonal
  var max = Math.min(width, height);

  for (var xy = 0; xy < max; xy++) {
    if (isInRegion(xy, xy)) {
      return { x: xy, y: xy };
    }
  }

  // No in-region pixels along the main diagonal? OK, totally brute-force it
  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      if (isInRegion(x, y)) {
        return { x: x, y: y };
      }
    }
  }
  throw new Error('No point found inside region!');
}
