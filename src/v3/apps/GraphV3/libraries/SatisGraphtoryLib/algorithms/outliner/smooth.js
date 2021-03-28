function copy(out, a) {
  out.x = a.x;
  out.y = a.y;

  return out;
}

export default function smooth(points) {
  var output = [];

  if (points.length > 0) {
    output.push(copy({ x: 0, y: 0 }, points[0]));
  }

  for (var i = 0; i < points.length - 1; i++) {
    var p0 = points[i];
    var p1 = points[i + 1];
    var p0x = p0.x;
    var p0y = p0.y;
    var p1x = p1.x;
    var p1y = p1.y;

    output.push({ x: 0.85 * p0x + 0.15 * p1x, y: 0.85 * p0y + 0.15 * p1y });
    output.push({ x: 0.15 * p0x + 0.85 * p1x, y: 0.15 * p0y + 0.85 * p1y });
  }

  if (points.length > 1) {
    output.push(copy({ x: 0, y: 0 }, points[points.length - 1]));
  }

  return output;
}
