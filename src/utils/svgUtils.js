import { SVGType } from "../constants/index.js"

export function getModel(element) {
  const ox = 0;
  const oy = 0;
  const p1 = 1;
  const p2 = 1;

  switch (element) {
    case SVGType.POLYLINE:
      return {
        'points': p1
      };
    case SVGType.POLYGON:
      return {
        'points': p1
      };
    case SVGType.RECT:
      return {
        'x': ox, 'y': oy, 'width': p1, 'height': p2
      };
    case SVGType.LINE:
      return {
        'x1': ox, 'y1': oy, 'x2': p1, 'y2': p2
      };
    case SVGType.CIRCLE:
      return {
        'cx': ox, 'cy': oy, 'r': p1
      };
    case SVGType.ELLIPSE:
      return {
        'cx': ox, 'cy': oy, 'rx': p1, 'ry': p2
      };
    case SVGType.PATH:
      return {
        'x1': ox, 'y1': oy, 'xc1': p1, 'yc1': p2, 'xc2': p1, 'yc2': p2, 'x2': ox, 'y2': oy
      };
    case SVGType.TEXT:
      return {
        'x': ox, 'y': oy
      }
  }
}
