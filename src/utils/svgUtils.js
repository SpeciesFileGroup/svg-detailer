import { SVGType } from "../constants/index.js"

export function createSVGElement(klass, { stroke, strokeWidth, fill, fillOpacity, strokeOpacity, strokeLinecap }) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', klass)

  element.setAttributeNS(null, 'stroke', stroke)
  element.setAttributeNS(null, 'stroke-width', strokeWidth)
  element.setAttributeNS(null, 'stroke-opacity', strokeOpacity)
  element.setAttributeNS(null, 'fill', fill)
  element.setAttributeNS(null, 'fill-opacity', fillOpacity)
  element.setAttributeNS(null, 'stroke-linecap', strokeLinecap)

  return element
}

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
