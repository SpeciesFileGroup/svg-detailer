import { SVGType } from "../constants/index.js";

function createBubbleForCircle (svgAttrs) {
  const bubbleGroup = document.createElementNS('http://www.w3.org/2000/svg', SVGType.GROUP);
  const { cx, cy, cr } = svgAttrs
  
  bubbleGroup.setAttributeNS(null, 'class', 'bubbles');
  bubbleGroup.appendChild(createShiftBubble(cx, cy, 'shift'));    // this is the center point of both bubble and circle
  bubbleGroup.appendChild(createSizeBubble(cr + cx, cy, 'E'));    // this is the E resize point
  bubbleGroup.appendChild(createSizeBubble(cx, cr + cy, 'S'));    // this is the S resize point
  bubbleGroup.appendChild(createSizeBubble(cx - cr, cy, 'W'));    // this is the W resize point
  bubbleGroup.appendChild(createSizeBubble(cx, cy - cr, 'N'));    // this is the N resize point

  return bubbleGroup;
}

function createBubbleForEllipse ({ cx, cy, rx, ry }) {
  const bubbleGroup = document.createElementNS('http://www.w3.org/2000/svg', SVGType.GROUP);

  bubbleGroup.appendChild(createShiftBubble(cx, cy, 'shift'));    // this is the center point of both bubble and circle
  bubbleGroup.appendChild(createSizeBubble((cx + rx * 0.707), (cy + ry * 0.707), 'SE'));    // this is the SE resize point
  bubbleGroup.appendChild(createSizeBubble((cx + rx * 0.707), (cy - ry * 0.707), 'NE'));    // this is the NE resize point
  bubbleGroup.appendChild(createSizeBubble((cx - rx * 0.707), (cy - ry * 0.707), 'NW'));    // this is the NW resize point
  bubbleGroup.appendChild(createSizeBubble((cx - rx * 0.707), (cy + ry * 0.707), 'SW'));    // this is the SW resize point

  return bubbleGroup;
}

function createSizeBubble(cx, cy, id) {
  const bubble = createBubbleStub(cx, cy)

  bubble.setAttributeNS(null, 'fill-opacity', '0.6')
  bubble.addEventListener('mousedown', (event) => {
    setSizeElement(bubble)
  })

  bubble.setAttributeNS(null, 'id', id)    // use this identifier to attach cursor in onSvgMouseMove
  return bubble;
}

function createShiftBubble(cx, cy, id) {
  let bubble = createBubbleStub(cx, cy);
  bubble.setAttributeNS(null, 'r', bubbleRadius * 1.25);      // radius override for SHIFT point
  bubble.setAttributeNS(null, 'stroke', '#004477');           // override scaffold attrs
  bubble.setAttributeNS(null, 'fill-opacity', '1.0');         // SHIFT bubble is slightly more opaque
  bubble.addEventListener('mousedown', (event) => {
    setShiftElement(bubble)
  });
  bubble.addEventListener('mouseup', (event) => {
    setElementMouseEnterLeave(bubble)
  });
  bubble.setAttributeNS(null, 'style', 'cursor:move;');
  bubble.setAttributeNS(null, 'id', id);    // use this identifier to attach cursor in onSvgMouseMove
  return bubble;
}