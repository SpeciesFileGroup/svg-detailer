import { SVGType } from "../../constants/index"
import { createSVGElement } from '../svgUtils'

export function drawLine ({ x, y, mode, attributes }) {
  const group = document.createElementNS('http://www.w3.org/2000/svg', SVGType.GROUP)
  const element = createSVGElement(SVGType.LINE, attributes);
  
  group.setAttributeNS(null, 'class', mode);

  element.setAttributeNS(null, 'x1', x.toFixed(4))
  element.setAttributeNS(null, 'y1', y.toFixed(4))
  element.setAttributeNS(null, 'x2', x.toFixed(4))
  element.setAttributeNS(null, 'y2', y.toFixed(4))

  group.appendChild(element)

  return {
    group,
    element
  }
}
