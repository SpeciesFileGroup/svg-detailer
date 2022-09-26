import { 
  drawMode,
  SVGType,
  KeyboardCode
} from "./constants/index.js"
import { EventEmitter, getModel, isMac } from "./utils/index.js"
import { buildSVGMenu } from './utils/createToolbar.js'
import { drawLine } from "./utils/shapes/index.js"

var cursorMode = drawMode.MOVE;
var stroke = '#000000';   // init to black
var zoom;                 // set on initialization from baseZoom @ full image
var baseBubbleRadius = 6;
// transform below to functions?
var strokeWidth = 1;   //= (baseStrokeWidth / zoom).toString();    // NOT dynamically recomputed with zoom (not this one)
var strokeOpacity = 0.9;
var fill = '';
var fillOpacity = 0.0;
var strokeLinecap = 'round';
var bubbleRadius;  //= (baseBubbleRadius / zoom).toString(); // and transcoded from/to string (may not be required)
var baseZoom;           // calculated from svg and image attributes
var maxZoom = 4;        // this is 4 pixels per source image pixel
var zoomDelta = 0.02;   // this can be altered to discriminate legacy firefox dommousescroll event
var svgLayer;
var svgImage;
var thisSVGpoints = [];            // collect points as [x,y]

var capsLock = false;
var thisKey;
// converted to thisElement: var thisSvgText;            // pointer to svg text element currently being populated
var text4svg = '_';         // buffer replacing HTML input control previously used for text, prime with underscore cursor
var fontSize = 50;
var fontFamily = 'Verdana';
var arrowPercent = 10;        // default arrow head size 10 percent of arrow length in pixels
var arrowheadLength = 50;     // or 50 pixels
var arrowFixed = false;       // paired with above
var arrowClosed = false;
var waitElement = false;   // interlock flag to prevent mouseenter mode change after selecting a create mode

var thisGroup;              // should be the parent of the current element

var thisElement;              // should be the current element

var thisBubble;             // the bubble mousedown-ed in the currently edited element

var svgInProgress = false;

var idCount = 0;

var enable_log  = false;    // default to NOT log debug output

// var logMouse = false;       // debug
// var logStatus = false;      // flags
// var logIndex = 0;           // limit counter for above
/*
 * mapping for special characters
 */
var _KEYCODE_MAP = {
  61: '=',
  106: '*',
  107: '+',
  109: '-',
  110: '.',
  111: '/',
  173: '-',
  186: ';',
  187: '=',
  188: ',',
  189: '-',
  190: '.',
  191: '/',
  192: '`',
  219: '[',
  220: '\\',
  221: ']',
  222: '\''
};
var _SHIFTMAP = {
  '`': '~',
  '1': '!',
  '2': '@',
  '3': '#',
  '4': '$',
  '5': '%',
  '6': '^',
  '7': '&',
  '8': '*',
  '9': '(',
  '0': ')',
  '-': '_',
  '=': '+',
  ';': ':',
  '\'': '\"',
  '[': '{',
  ']': '}',
  ',': '<',
  '.': '>',
  '/': '?',
  '\\': '|'
};

class SVGDraw extends EventEmitter {
  constructor (containerID) {     // container:<svgLayer>:<xlt>:<svgImage>
    const cWidth = parseInt(containerID.attributes['data-width'].value);        // this seems too explicit
    const cHeight = parseInt(containerID.attributes['data-height'].value);      // shouldn't this be inherited from parent?

    super()
    this.containerElement = containerID
    this.configuration = {
      arrowClosed: false,
      arrowFixed: false,
      arrowPercent: 10,        // default arrow head size 10 percent of arrow length in pixels
      arrowheadLength: 50,
      fontSize: 50,
      fontFamily: 'Verdana',
      stroke: '#000000',
      strokeWidth: 1,
      strokeOpacity: 0.9,
      fill: '',
      fillOpacity: 0.0,
      strokeLinecap: 'round',
      baseZoom: 0,           // calculated from svg and image attributes
      maxZoom: 4
    }

    this.state = {
      mousePosition: {
        x: 0,
        y: 0
      },
      xC: 0,
      yC: 0
    }

    svgImage = new Image();
    thisSVGpoints = [];            // collect points as [x,y]

    this.fontSize = 50;
    fontFamily = 'Verdana';

    svgImage.src = containerID.attributes['data-image'].value;
    svgImage.onload = () => {
      this.state.xC = 0
      this.state.yC = 0

      var cAR = cWidth / cHeight;
      var iAR = svgImage.width / svgImage.height;

      svgLayer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svgLayer.setAttributeNS(null, 'id', 'svgLayer');
      svgLayer.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svgLayer.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
      svgLayer.setAttributeNS(null, 'version', '1.1');
      svgLayer.setAttributeNS(null, 'style', 'position: inherit;');
      svgLayer.setAttributeNS(null, 'width', cWidth);
      svgLayer.setAttributeNS(null, 'height', cHeight);
      this.containerElement.appendChild(svgLayer);

      // scale to height if (similar aspect ratios AND image aspect ratio less than container's)
      // OR the image is tall and the container is wide)
      if ((((cAR >= 1 && iAR >= 1) || (cAR <= 1 && iAR <= 1)) && (iAR <= cAR)) || ((iAR <= 1) && (cAR >= 1))) {
        baseZoom = svgLayer.height.baseVal.value / svgImage.height;     // scale to height on condition desc in comment
      } else {
        baseZoom = svgLayer.width.baseVal.value / svgImage.width;     // otherwise scale to width
      }
    
      zoom = baseZoom;      // at initialization

      // strokeWidth = baseStrokeWidth.toString();    // NOT dynamically recomputed with zoom (not this one)
      bubbleRadius = (baseBubbleRadius / zoom).toString(); // and transcoded from/to string (may not be required)

      this.state.mousePosition.x = baseZoom * svgImage.width / 2;         // center of image
      this.state.mousePosition.y = baseZoom * svgImage.height / 2;
      // insert the svg base image into the transformable group <g id='xlt'>
      let xlt = document.createElementNS('http://www.w3.org/2000/svg', SVGType.GROUP);
      xlt.setAttributeNS(null, 'id', 'xlt');
      xlt.setAttributeNS(null, 'transform', 'translate(0,0) scale(' + parseFloat(zoom) + ')');
      svgLayer.appendChild((xlt));
      let xltImage = document.createElementNS('http://www.w3.org/2000/svg', SVGType.IMAGE);
      xltImage.setAttributeNS(null, 'id', "xltImage");
      xltImage.setAttributeNS(null, 'x', "0");
      xltImage.setAttributeNS(null, 'y', "0");
      xltImage.setAttributeNS(null, 'width', svgImage.width.toString());
      xltImage.setAttributeNS(null, 'height', svgImage.height.toString());
      xltImage.setAttributeNS(null, 'preserveAspectRatio', "none");
      xltImage.setAttributeNS('http://www.w3.org/1999/xlink', 'href', svgImage.src);
      xlt.appendChild(xltImage);

      buildSVGMenu(this)

      //SVGDraw.prototype.buildSVGmenu(containerID);       // populate the button-ology from the data element description (mostly)

      document.addEventListener('keydown', this.keyHandler);   /////////////// This is probably tooo broad   /////////////////
      document.addEventListener('keyup', this.keyUpHandler);

      this.zoom_trans(0, 0, zoom);             //////////// IMPORTANT !!!!!!!!!!!

      this.setCursorMode(drawMode.MOVE);

      this.renderFunction = this.updateSvgByElement;
      this.touchSupported = 'ontouchstart' in document.documentElement;   // thanks, Edd Turtle !
      this.containerID = containerID;
      this.state.mousePosition = {x: 0, y: 0};

      if (!this.touchSupported) {
        svgLayer.addEventListener('dblclick', this.doubleClickHandler.bind(this))
      }

      svgLayer.addEventListener('mousedown', this.onSvgMouseDown.bind(this))
      svgLayer.addEventListener('mouseup', this.onSvgMouseUp.bind(this))
      svgLayer.addEventListener('mousemove', this.onSvgMouseMove.bind(this))

    };
  }

  setCursorMode (mode) {
    if (thisElement) {
      checkLeftoverElement();     // look for dangling element, most likely off of svg image element ( - Y coord)
      clearEditElement(thisGroup);        //  TODO: make sure all cases complete
    }
    
    cursorMode = mode;

    if (cursorMode !== drawMode.MOVE) {
      if (cursorMode === drawMode.TEXT) {
        //document.getElementById("text4svg").removeAttribute('disabled');
        //document.getElementById("text4svg").focus();        // this control eliminated
      }

      if (mode == drawMode.CLEAR) {
        clearLastGroup();
        cursorMode = drawMode.MOVE;
      }

      if (mode == 'reset') {
        this.zoom_trans(0, 0, baseZoom);
        cursorMode = drawMode.MOVE;
      }

      waitElement = true
    }
  
    this.emit('changemode', {
      mode: cursorMode
    })
  
    svgInProgress = false
  }

  exitEditPoint (group) {    // services mouseUp from SIZE/point bubble
    while ((group.childElementCount > 1) && (group.lastChild.tagName == SVGType.GROUP)) {             // changed from group.childElementCount > 1
      group.lastChild.remove();                        // eliminates all bubbles
    }
    svgInProgress = false;
    thisBubble = null;

    this.setCursorMode(drawMode.MOVE);
    setElementMouseEnterLeave(group);
  }

  zoom_trans(x, y, scale) {
    const xlt = this.containerElement.querySelector('#xlt')
    const transform = 'translate(' + ((x)).toString() + ', ' + ((y)).toString() + ') scale(' + scale.toString() + ')'

    zoom = scale
    this.state.xC = x
    this.state.yC = y

    xlt.attributes['transform'].value = transform
  }

  zoomIn () {
    if (zoom < maxZoom) {           // zoom of 1 is pixel-per-pixel on svgLayer
      let newZoom = zoom * (1.0 + zoomDelta);
      if (newZoom > maxZoom) {
        newZoom = maxZoom;
      }
      this.state.xC = this.state.mousePosition.x - (this.state.mousePosition.x - this.state.xC) * newZoom / zoom;
      this.state.yC = this.state.mousePosition.y - (this.state.mousePosition.y - this.state.yC) * newZoom / zoom;
      this.zoom_trans(this.state.xC, this.state.yC, newZoom);
      zoom = newZoom;
      bubbleRadius = (baseBubbleRadius / zoom).toString();
    }
  }
  
  zoomOut () {
    if (zoom > baseZoom / 3) {
      let newZoom = zoom / (1.0 + zoomDelta);
      this.state.xC = this.state.mousePosition.x - (this.state.mousePosition.x - this.state.xC) * newZoom / zoom;
      this.state.yC = this.state.mousePosition.y - (this.state.mousePosition.y - this.state.yC) * newZoom / zoom;
      this.zoom_trans(this.state.xC, this.state.yC, newZoom);
      zoom = newZoom;
      bubbleRadius = (baseBubbleRadius / zoom).toString();
    }
  }
  
  setZoom (scale) {
    this.state.xC = this.state.mousePosition.x - (this.state.mousePosition.x - this.state.xC) * scale / zoom;
    this.state.yC = this.state.mousePosition.y - (this.state.mousePosition.y - this.state.yC) * scale / zoom;

    this.zoom_trans(this.state.xC, this.state.yC, scale);
    zoom = scale;
  }

  setStroke (color) {
    stroke = color;
    this.configuration.stroke = color
  }

  apiFontSize (fontsize) {
    if (isNumeric(fontsize)) fontSize = fontsize
  }

  apiFontFamily (font) {
    fontFamily = font
  }
  
  apiArrowClosed (checked) {
    arrowClosed = checked
  }
  
  apiArrowFixed (checked) {
    arrowFixed = checked
  }

  apiArrowLength (length) {
    if (isNumeric(length)) {
      arrowheadLength = length
    }
  }

  apiArrowPercent (percent) {
    if(isNumeric(percent)) {
      arrowPercent = percent
    }
  }

  apiStroke (color) {
    this.setStroke(color)
  }
  
  apiStrokeWidth (pixels) {
    if(isNumeric(pixels)) strokeWidth = pixels
  }

  apiStrokeOpacity (opacity) {
    if(opacity >= 0 && opacity <= 1) {
      strokeOpacity = opacity;
    }
  }
  
  apiStrokeLinecap (style) {
    strokeLinecap = style
  }
  
  apiFill (color) {
    fill = color
  }
  
  apiFillOpacity (opacity) {
    if (opacity >= 0 && opacity <= 1) {
      fillOpacity = opacity.toString()
    }
  }
  
  apiZoomIn () {
    this.zoomIn()
  }
  
  apiZoomOut () {
    this.zoomOut()
  }

  apiSetZoom (scale) {
    this.setZoom(scale)
  }

  apiDeleteLast () {
    clearLastGroup()
  }

  apiDeleteHover (group) {
    if (group) { clearThisGroup(group) }
  }

  apiShowSVG (verbatim) {
    return collectSVG(verbatim).outerHTML;
  }
  
  apiBareSVG (noGroups = true) {
    return getBareSVG(noGroups).outerHTML;
  }
  
  apiJsonSVG () {      // package SVG into JSON object
    const clonedSVG = collectSVG(false).firstChild     // strip off <svg...> </svg>
    clonedSVG.removeAttribute('id')
    clonedSVG.removeAttribute('transform')

    const JSONsvg = {
      "data": {
        "type": "svg",
        "attributes": clonedSVG.outerHTML
      }
    }
  
    return JSONsvg
  }
}

SVGDraw.prototype.onSvgMouseDown = function () {    // in general, start or stop element generation on mouseDOWN (true?)
    this.updateMousePosition(event);

    if (svgInProgress != false && svgInProgress !== cursorMode) {    // terminate in progress svg before continuing
      if (svgInProgress !== 'SHIFT') {
        svgInProgress = cursorMode;       //  ??
      }
      return
    }

    if (thisGroup) {
      if (thisGroup.childElementCount > 1 && cursorMode != drawMode.TEXT) {   // this is the case where there is a click on a mousentered
        clearEditElement(thisGroup);
        return false;
      }
    }

    const [x, y] = [(this.state.mousePosition.x - this.state.xC) / zoom, (this.state.mousePosition.y - this.state.yC) / zoom]
    thisSVGpoints[0] = [x, y]

    if (cursorMode == drawMode.POLYGON) {     // mouseDown sets initial point, subsequent points set by mouseDown after mouseUp
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)

        thisSVGpoints[0] = [(this.state.mousePosition.x - this.state.xC) / zoom, (this.state.mousePosition.y - this.state.yC) / zoom];
        let group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        let newGroupID = 'g' + getIDcount().toString();
        group.setAttributeNS(null, 'id', newGroupID);
        group.setAttributeNS(null, 'class', cursorMode);
        thisGroup = group;
        document.getElementById("xlt").appendChild(group);
        let element = newElement(drawMode.POLYLINE);        //YES, I KNOW... polyline behavior mimics google maps better

        group.appendChild(element);
        thisElement = group.children[0];
        element.setAttributeNS(null, 'points', thisSVGpoints[0][0].toFixed(4).toString()
          + ',' + thisSVGpoints[0][1].toFixed(4).toString() + ' '
          + thisSVGpoints[0][0].toFixed(4).toString()
          + ',' + thisSVGpoints[0][1].toFixed(4).toString() + ' ');      // start x,y for both points initially
        svgInProgress = cursorMode;     // mark in progress
      } else {      // this is the fixation of this last point, so DON'T dissociate mouse move handler
        this.updateMousePosition(event);
        let thesePoints = thisElement.attributes['points'].value;   // to trim or not to trim?  if so, multiple implications here
        let thisPoint = ((this.state.mousePosition.x - this.state.xC) / zoom).toFixed(4).toString()
          + ',' + ((this.state.mousePosition.y - this.state.yC) / zoom).toFixed(4).toString() + ' ';
        thisElement.attributes['points'].value = thesePoints.concat(thisPoint);
      }
    }
    if (cursorMode == drawMode.POLYLINE) {    // mouseDown sets initial point, subsequent points set by mouseDown after mouseUp
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        thisSVGpoints[0] = [(this.state.mousePosition.x - this.state.xC) / zoom, (this.state.mousePosition.y - this.state.yC) / zoom];
        let group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        thisGroup = group;
        let newGroupID = 'g' + getIDcount().toString();
        group.setAttributeNS(null, 'id', newGroupID);
        group.setAttributeNS(null, 'class', cursorMode);
        document.getElementById("xlt").appendChild(group);
        let element = newElement(drawMode.POLYLINE);

        group.appendChild(element);
        thisElement = group.children[0];
        element.setAttributeNS(null, 'stroke-linecap', 'round');
        element.setAttributeNS(null, 'points', thisSVGpoints[0][0].toFixed(4).toString()
          + ',' + thisSVGpoints[0][1].toFixed(4).toString() + ' '
          + thisSVGpoints[0][0].toFixed(4).toString()
          + ',' + thisSVGpoints[0][1].toFixed(4).toString() + ' ');      // start x,y for both points initially
        svgInProgress = cursorMode;     // mark in progress
      } else {      // this is the fixation of this last point, so DON'T dissociate mouse move handler
        this.updateMousePosition(event);
        let thesePoints = thisElement.attributes['points'].value;
        let thisPoint = ((this.state.mousePosition.x - this.state.xC) / zoom).toFixed(4).toString()
          + ',' + ((this.state.mousePosition.y - this.state.yC) / zoom).toFixed(4).toString() + ' ';
        thisElement.attributes['points'].value = thesePoints.concat(thisPoint);
      }
    }
    if (cursorMode == drawMode.RECTANGLE) {     // mouseDown starts creation, after drag, mouseUp ends
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        thisSVGpoints[0] = [(this.state.mousePosition.x - this.state.xC) / zoom, (this.state.mousePosition.y - this.state.yC) / zoom];
        let group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        let newGroupID = 'g' + getIDcount().toString();
        group.setAttributeNS(null, 'id', newGroupID);
        group.setAttributeNS(null, 'class', cursorMode);
        document.getElementById("xlt").appendChild(group);
        let element = newElement(SVGType.RECT);

        group.appendChild(element);
        thisGroup = group;
        thisElement = group.children[0];
        element.setAttributeNS(null, 'x', (thisSVGpoints[0][0]).toFixed(4));      // start x
        element.setAttributeNS(null, 'y', (thisSVGpoints[0][1]).toFixed(4));      // start y
        element.setAttributeNS(null, 'width', 1);      // width x
        element.setAttributeNS(null, 'height', 1);      // height y
        svgInProgress = cursorMode;     // mark in progress
      }
// now using mouseUp event to terminate rect
    }
    if (cursorMode == drawMode.LINE) {     //  mouseDown starts creation, after, drag mouseUp ends
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        
        svgInProgress = cursorMode;     // mark in progress

        const { element, group } = drawLine({ x, y, mode: cursorMode, attributes: this.configuration })
        group.setAttributeNS(null, 'id', 'g' + getIDcount().toString())
        document.getElementById("xlt").appendChild(group);
        thisElement = element
        thisGroup = group

      } else {      // this is the terminus of this instance, so dissociate mouse move handler
        svgInProgress = false;
        setElementMouseEnterLeave(thisElement);
        // unbindMouseHandlers(self);
      }
    }
    if (cursorMode == drawMode.ARROW) {     //  mouseDown starts creation, after, drag mouseUp ends
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        const { element, group } = drawLine({ x, y, mode: cursorMode, attributes: this.configuration })

        svgInProgress = cursorMode;
        group.setAttributeNS(null, 'id', 'g' + getIDcount().toString())
        document.getElementById("xlt").appendChild(group);
        thisElement = element
        thisGroup = group

      } else {      // this is the terminus of this instance, so dissociate mouse move handler
        svgInProgress = false;
        setElementMouseEnterLeave(thisElement);
        // unbindMouseHandlers(self);
      }
    }
    if (cursorMode == drawMode.CIRCLE) {     // mouseDown    // modified to use common element for handlers
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        if (thisGroup != null) {      //  ////////////// ???
          clearEditElement(thisGroup);    // this group is the one with bubbles, to be obviated
        }
        thisSVGpoints[0] = [(this.state.mousePosition.x - this.state.xC) / zoom, (this.state.mousePosition.y - this.state.yC) / zoom];
        let group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        let newGroupID = 'g' + getIDcount().toString();
        group.setAttributeNS(null, 'id', newGroupID);
        group.setAttributeNS(null, 'class', cursorMode);
        document.getElementById("xlt").appendChild(group);
        let element = newElement(SVGType.CIRCLE);      // new generalized method

        group.appendChild(element);
        thisGroup = group;
        thisElement = group.children[0];     // this var is used to dynamically create the element
        element.setAttributeNS(null, 'cx', (thisSVGpoints[0][0]).toFixed(4));      // start x
        element.setAttributeNS(null, 'cy', (thisSVGpoints[0][1]).toFixed(4));      // start y
        element.setAttributeNS(null, 'r', 1);      // width x
        svgInProgress = cursorMode;     // mark in progress
      }
      // now using mouseup event exclusively to terminate circle
    }
    if (cursorMode == drawMode.ELLIPSE) {     // mouseDown
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        thisSVGpoints[0] = [(this.state.mousePosition.x - this.state.xC) / zoom, (this.state.mousePosition.y - this.state.yC) / zoom];
        let group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        thisGroup = group;
        let newGroupID = 'g' + getIDcount().toString();
        group.setAttributeNS(null, 'id', newGroupID);
        group.setAttributeNS(null, 'class', cursorMode);
        document.getElementById("xlt").appendChild(group);
        let element = newElement(drawMode.ELLIPSE);

        group.appendChild(element);
        thisElement = group.children[0];
        element.setAttributeNS(null, 'cx', (thisSVGpoints[0][0]).toFixed(4));      // start x
        element.setAttributeNS(null, 'cy', (thisSVGpoints[0][1]).toFixed(4));      // start y
        element.setAttributeNS(null, 'rx', 1);      // radius x
        element.setAttributeNS(null, 'ry', 1);      // radius y
        svgInProgress = cursorMode;     // mark in progress
      } else {      // this is the terminus of this instance, so dissociate mouse move handler
        svgInProgress = false;
        setElementMouseEnterLeave(thisElement);
        // unbindMouseHandlers(self);
      }
    }
    if (cursorMode == drawMode.DRAW) {     // mouseDown
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        thisSVGpoints[0] = [(this.state.mousePosition.x - this.state.xC) / zoom, (this.state.mousePosition.y - this.state.yC) / zoom];
        let group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        thisGroup = group;
        let newGroupID = 'g' + getIDcount().toString();
        group.setAttributeNS(null, 'id', newGroupID);
        group.setAttributeNS(null, 'class', cursorMode);
        document.getElementById("xlt").appendChild(group);
        //for (j = 0; j < thisSVGpoints.length; j++) {              // for text mode there is only one
        let element = newElement(drawMode.POLYLINE);

        group.appendChild(element);
        thisElement = group.children[0];
        element.setAttributeNS(null, 'points', thisSVGpoints[0][0].toFixed(4).toString()
          + ',' + thisSVGpoints[0][1].toFixed(4).toString() + ' ');      // start x,y
        //}
        svgInProgress = cursorMode;     // mark in progress
      } else {      // this is the terminus of this instance, so dissociate mouse move handler
        svgInProgress = false;
        setMouseoverOut(thisElement);
        // unbindMouseHandlers(self);
      }
    }
    if ((cursorMode == drawMode.CUBIC) || (cursorMode == drawMode.QUADRATIC)) {     // mouseDown
                                                                      // The cubic Bezier curve requires non-symbolic integer values for its path parameters.
                                                                      // This will necessitate the dynamic reconstruction of the "d" attribute using parseInt
                                                                      // on each value.  The edit sister group will have 4 bubbles, ids: p1, c1, c2, p2 to decode
                                                                      // the control points' mousemove action.  Make control points the same as the endpoints initially,
                                                                      // then annotate with bubbles to shape the curve.  This is an extra step more than other elements.
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        thisSVGpoints[0] = [(this.state.mousePosition.x - this.state.xC) / zoom, (this.state.mousePosition.y - this.state.yC) / zoom];
        let group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        thisGroup = group;
        let newGroupID = 'g' + getIDcount().toString();
        group.setAttributeNS(null, 'id', newGroupID);
        group.setAttributeNS(null, 'class', cursorMode);
        document.getElementById("xlt").appendChild(group);
        let element = newElement(SVGType.PATH);

        group.appendChild(element);
        thisElement = group.children[0];
        let thisX = thisSVGpoints[0][0];
        let thisY = thisSVGpoints[0][1];
        element.setAttributeNS(null, 'd', getCurvePath(thisX, thisY, thisX, thisY, thisX, thisY, thisX, thisY));
        svgInProgress = cursorMode;     // mark in progress
      } else {      // this is the terminus of this instance, so dissociate mouse move handler
        svgInProgress = false;
        setElementMouseEnterLeave(thisElement);
        // unbindMouseHandlers(self);
      }
    }
    if (cursorMode == drawMode.TEXT) {     // mouseDown - could be initial click, revised position click, or preemie
      let group
      if (thisElement) {
        finishTextGroup();
      }
      if (svgInProgress == false) {
        thisSVGpoints[0] = [(this.state.mousePosition.x - this.state.xC) / zoom, (this.state.mousePosition.y - this.state.yC) / zoom];
        group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        thisGroup = group;
        let newGroupID = 'g' + getIDcount().toString();
        group.setAttributeNS(null, 'id', newGroupID);
        group.setAttributeNS(null, 'class', cursorMode);
        document.getElementById("xlt").appendChild(group);
        //for (j = 0; j < thisSVGpoints.length; j++) {              // for text mode there is only one
        let element;
        element = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        group.appendChild(element);
        thisElement = group.children[0];
        element.setAttributeNS(null, 'stroke', stroke);
        element.setAttributeNS(null, 'stroke-width', '1');
        element.setAttributeNS(null, 'stroke-opacity', '1.0');
        element.setAttributeNS(null, 'x', thisSVGpoints[0][0].toFixed(4));      // start x
        element.setAttributeNS(null, 'y', thisSVGpoints[0][1].toFixed(4));      // start y
        element.setAttributeNS(null, 'style', 'font-family: ' + fontFamily + '; fill: ' + stroke.toString() + ';');
        element.setAttributeNS(null, 'font-size', fontSize);
        element.innerHTML = '_';    // plant the text cursor   /////////////////
        svgInProgress = 'text';     // mark in progress
      }
    }
    if (cursorMode == drawMode.MOVE) {     // mouseDown
      if (svgInProgress == false) {
        svgInProgress = cursorMode;
      }
    }
    waitElement = false;      //    ///////////   new code to allow creation start within extant element
    return event.preventDefault() && false;
}     //// end of onSvgMouseDown

function pathPoint(x, y) {
  return parseInt(x) + ", " + parseInt(y);
}

function curvePoint(x, y) {
  return pathPoint(x, y) + ", ";
}

function getIDcount() {
  idCount += 1;
  return idCount;
}

function getCurvePath(x1, y1, cx1, cy1, cx2, cy2, x2, y2) {
  if (cursorMode == drawMode.CUBIC) {
    return "M " + pathPoint(x1, y1) + " C " + curvePoint(cx1, cy1) + curvePoint(cx2, cy2) + pathPoint(x2, y2);
  } 
  
  return "M " + pathPoint(x1, y1) + " Q " + curvePoint(cx1, cy1) + pathPoint(x2, y2);
}

function getCurveCoords(d) {
  let pieces = d.replace(/,/g, '').split(' ');
  let j = 0;
  let coords = [];
  for (let k = 0; k < pieces.length; k++) {
    if (isNumeric(pieces[k])) {   // bypass the curve type symbol
      coords[j] = pieces[k];
      j++;
    }
  }
  return coords;
}

function getCurvePoints(coords) {   // special bounding poly for curve element
  return curvePoint(coords[0], coords[1]) + ' ' + curvePoint(coords[2], coords[3]) + ' '
    + curvePoint(coords[4], coords[5]) + ' ' + curvePoint(coords[6], coords[7]);
}

function newElement(klass) {
  let element = document.createElementNS('http://www.w3.org/2000/svg', klass);
  element.setAttributeNS(null, 'stroke', stroke);
  element.setAttributeNS(null, 'stroke-width', strokeWidth);
  element.setAttributeNS(null, 'stroke-opacity', strokeOpacity.toString());
  element.setAttributeNS(null, 'fill', fill);
  element.setAttributeNS(null, 'fill-opacity', fillOpacity.toString());
  element.setAttributeNS(null, 'stroke-linecap', strokeLinecap);
  return element;
}

function setMouseoverOut(element) {
  element.setAttributeNS(null, 'onmouseover', "this.attributes['stroke-width'].value = '" + 1.5 * strokeWidth + "';");
  element.setAttributeNS(null, 'onmouseout', "this.attributes['stroke-width'].value = " + strokeWidth + ";");
  return element;
}

function mouseEnterFunction(event) {
  let thisGroupID = thisGroup ? thisGroup.id : 'null'
  let thisElementTagName = thisElement ? thisElement.tagName : 'null'
  let thisElementParent = thisElement ? thisElement.parentElement.id : 'null'
  console_log(enable_log, "mouseenter" + ' eventTarget=' + event.target.id + ' thisGroup=' + thisGroupID + ' thisElement=' + thisElementTagName + ' parent=' + thisElementParent+ ' ' + cursorMode + ' ')
  setEditElement(event.target)
}

function mouseLeaveFunction(event) {
  let thisGroupID = thisGroup ? thisGroup.id : 'null'
  let thisElementTagName = thisElement ? thisElement.tagName : 'null'
  let thisElementParent = thisElement ? thisElement.parentElement.id : 'null'
  console_log(enable_log, "mouseleave" + ' eventTarget=' + event.target.id + ' thisGroup=' + thisGroupID + ' thisElement=' + thisElementTagName + ' parent=' + thisElementParent + ' ' + cursorMode + ' ')
  clearEditElement(event.target)
}

function setElementMouseEnterLeave(group) {     // this actually sets the parent group's listeners
  if ((group == null) || (group == undefined)) {
    group = null;         //  debug catch point
  }

  group.removeEventListener('mouseenter', mouseEnterFunction)
  group.removeEventListener('mouseleave', mouseLeaveFunction)

  group.addEventListener('mouseenter', mouseEnterFunction)
  group.addEventListener('mouseleave', mouseLeaveFunction)

  return group;
}

function setEditElement(group) {    // add bubble elements to the group containing this element
  if (checkElementConflict(group)) {    // returns true if conflict
    console_log(enable_log, 'Element conflict: ' + group.attributes.class.value);
    return;
  }
  console_log(enable_log, 'setEditElement no conflict')
  if (thisGroup == null) {    // no conflicts detected, so if thisGroup is null,
    let msg = 'thisGroup is NULL';
    if (thisElement) {
      msg += ', thisElement = ' + thisElement.toString()
    }

    console_log(enable_log, group.attributes.class.value + ' ' + msg);
    thisGroup = group;        // there is probably no creation activity
  }
  //if (group.firstChild.tagName != cursorMode) {    // start editing an element not in the current mode
  if (group.firstChild) {
    if (group.firstChild.tagName != SVGType.PATH) {
      if (group.attributes.class) {                   // class atribute existence
        cursorMode = group.attributes.class.value;
      } else {
        cursorMode = group.firstChild.tagName;
      }
    } else {                  // now that there are both cubic and quadratic curves, we must detect this one's class
      cursorMode = drawMode.CUBIC;   // ///////// finesse path
      if (group.firstChild.attributes.d.value.indexOf('C ') == -1) {   // is the path quadratic because it's not cubic?
        cursorMode = drawMode.QUADRATIC;
      }
    }
  }
  svgInProgress = false;      //  ////////// we have set bubbles but no action taken yet

  //}
  if (group.childNodes.length > 1) {   // do I have bubbles? possibly? (might be text)
    if (group.lastChild.tagName == SVGType.GROUP) {
      // group.lastChild.remove();         // this is the group of bubbles
      clearEditElement(group);
    }
  }
  let bubbleGroup = createBubbleGroup(group);      // since bubble groups are heterogeneous in structure
  group.appendChild(bubbleGroup);             // make the new bubble group in a no-id <g>
  console_log(enable_log, 'setEditElement ' + group.id + ' ' + group.attributes.class.value)
  // group.removeEventListener('mouseleave', mouseLeaveFunction)
}

function clearEditElement(group) {   // given containing group; invoked by mouseleave, so order of statements reordered
  let thisGroupID = thisGroup ? thisGroup.id : 'null'
  console_log(enable_log, 'clearEditElement: svgInProgress=' + svgInProgress + ', group=' + group.id + ', thisGroup=' + thisGroupID)
  if (svgInProgress == 'SHIFT') {       // if we are shifting an element, do nothing
    return;
  }
  if (!group) {                         // if we are misassociated just back away . . .
    console_log(enable_log, 'clearEditElement: group argument null')
    return;
  }
  if (waitElement) {
    console_log(enable_log, 'clearEditElement: waitElement')
    return;
  }
  if((thisGroup) && (thisGroupID != group.id)) {   // collision
    console_log(enable_log, 'clearEditElement: group conflict')
    return
  }
  if (group.childNodes.length > 1) {   // do I have bubbles? i.e., is there more than just the golden chile?
    if ((group.lastChild.tagName == drawMode.CIRCLE) || (group.lastChild.tagName == 'g')) { // poly- bubbles have a child group
      group.lastChild.remove();         // this is the group of bubbles (and maybe nested ones) if not just a SHIFT bubble
      thisBubble = null;
      cursorMode = drawMode.MOVE;    // was savedCursorMode;   // on exit of edit mode, restore
      svgInProgress = false;
      thisElement = null;
      thisGroup = null;
    } else {
      if (group.firstChild.tagName == SVGType.TEXT) {
        if (svgInProgress == 'text') {
          finishTextGroup();
        }
      }
    }
  }
  //group./*firstChild.*/attributes['onmouseenter'].value = "this.firstChild.attributes['stroke-width'].value = '" + 1.5 * strokeWidth + "'; setEditElement(this.firstChild);"    // replant the listener in the real element
  setElementMouseEnterLeave(group);
  cursorMode = drawMode.MOVE;    // was savedCursorMode;   // on exit of edit mode, restore

  svgInProgress = false;
  thisElement = null;
  thisGroup = null;
//  eliminated savedCursorMode = drawMode.MOVE;
}

function checkElementConflict(group) {  // only invoked by mouseenter listeners
  /* consider potential values of:
   svgInProgress, one of the svg modes, plus move, shift, and size
   cursorMode, the selected (if not always indicated) creation / editing mode
   thisElement, nominally the active element - conflict with bubbles
   thisGroup, nominally the group of the active element
   */
  if (waitElement) {
    console_log(enable_log, 'checkElementConflict1: waitElement = ' + waitElement)
    return true;
  }
  if (!svgInProgress) {
    console_log(enable_log, 'checkElementConflict2: svgInProgress=' + svgInProgress + 'thisGroup=' + group.id)
    return false;     // if no active element
  }
  if(svgInProgress == 'SHIFT') {
    console_log(enable_log, 'checkElementConflict3: svgInProgress=' + svgInProgress + 'thisGroup=' + group.id)
    if (thisGroup.id != group.id) {
      return true
    }
  else {
      return false
    }
  }
  if (svgInProgress != group.firstChild.tagName) {
    console_log(enable_log, 'checkElementConflict4: svgInProgress=' + svgInProgress + ', thisElement=' + thisElement + ', group element=' +group.firstChild.tagName)
    return true;     //  if we crossed another element
  }
  if (thisGroup != group) {
    console_log(enable_log, 'checkElementConflict5: svgInProgress=' + svgInProgress + ', thisGroup=' + thisGroup.id + ', group=' + group.id + ', group element=' +group.firstChild.tagName)
    return true;
  }
}


function setShiftElement(bubble) {    // end of SHIFT leaves single bubble; should be removed on mouseleave of group
  //thisParent = element;                           // group containing real element and the bubbles group
  if(!thisGroup) {
    thisGroup = bubble.parentNode.parentNode;          // set group for mousemove
  }
  thisElement = thisGroup.firstChild;
  // thisBubble = group.lastChild.firstChild;      // this is the center/first bubble
  thisBubble = thisGroup.children[1].children['shift'];      // this is the center/first bubble
  cursorMode = thisElement.tagName;
  if (thisGroup.attributes.class) {
    cursorMode = thisGroup.attributes.class.value
  }
  //// presumption of ordering of shift bubble vs other bubbles: FIRST bubble is shift -- modified other code so TRUE
  let endK = thisGroup.lastChild.childElementCount;        // total bubbles, leave the first one
  for (let k = endK; k > 1; k--) {
    thisGroup.lastChild.lastChild.remove();      // remove resize bubbles from the end
  }
  thisGroup.removeEventListener('mouseenter', mouseEnterFunction)
  thisGroup.removeEventListener('mouseleave', mouseLeaveFunction)
  svgInProgress = 'SHIFT';
  console_log(enable_log, 'svgInProgress = SHIFT, cursorMode = ' + cursorMode);
}

function setSizeElement(bubble) {    // end of SHIFT leaves single bubble; should be removed on mouseleave of group
  const group = bubble.parentNode.parentNode;          // set group for mousemove

  thisGroup = group;          // set group for mousemove
  thisElement = group.firstChild;
  thisBubble = group.lastChild.firstChild;      // this is the center/first bubble
  cursorMode = thisElement.tagName;

  if (
    cursorMode === drawMode.CIRCLE || 
    cursorMode === drawMode.ELLIPSE
  ) {
    const endK = group.lastChild.childElementCount;        // total bubbles, leave the first one (thisElement)

    for (let k = endK; k > 0; k--) {
      group.lastChild.lastChild.remove();      // remove resize bubbles from the end
    }
  }

  svgInProgress = 'SIZE';

  console_log(enable_log, 'svgInProgress = SIZE, cursorMode = ' + cursorMode + ' ' + thisElement.tagName)
  group.removeEventListener('mouseenter', mouseEnterFunction)
  group.removeEventListener('mouseleave', mouseLeaveFunction)
}

function setPointElement(bubble) {    // this performs the inline substitution of the selected bubble coordinates
  const group = bubble.parentNode.parentNode;          // set group for mousemove

  thisBubble = bubble;
  thisGroup = group;
  thisElement = group.firstChild;    // this is the real element

  if (parseInt(bubble.id) == bubble.parentNode.childElementCount - 1) {   // last point/bubble?
    thisBubble = bubble;
  }
  if (bubble.parentNode.lastChild.tagName == SVGType.GROUP) {
    bubble.parentNode.lastChild.remove(); // /////////// this is the right place: remove insert point bubbles
  }
  if (thisGroup.attributes.class) {
    cursorMode = thisGroup.attributes.class.value;
  } else {
    cursorMode = thisElement.tagName;
  }
  group.removeEventListener('mouseenter', mouseEnterFunction)
  group.removeEventListener('mouseleave', mouseLeaveFunction)

  svgInProgress = 'POINT';                     // so we have an active element, and it has been marked in progress
  // look for mousedown in handler for circle to transition to rubber band mode
}                                       // use mouseup or mousedown to terminate radius drag

function setNewPointElement(bubble) {     // this inserts the new point into the <poly.. element
  const group = bubble.parentNode.parentNode.parentNode;          // set group for mousemove handler

  thisBubble = bubble;
  thisGroup = group;
  thisElement = group.firstChild;    // this is the real element

  if (parseInt(bubble.id) == bubble.parentNode.childElementCount - 1) {
    thisBubble = bubble;
  }

  cursorMode = thisElement.tagName;
  group.removeEventListener('mouseenter', mouseEnterFunction); // disable mousenter on real element's containing group
  group.removeEventListener('mouseleave', mouseLeaveFunction); // disable mouseleaver on real element's containing group
  // bubble.attributes['onmousedown'].value = '';  // cascade to onSvgMouseDown
  thisElement.attributes['points'].value = insertNewPoint(thisElement, thisBubble);
  thisBubble.id = (parseInt(thisBubble.id) + 1).toString();   // ///////// seems to work, but...
  svgInProgress = 'NEW';                     // so we have an active element, and it has been marked in progress
  // look for mousedown in handler for circle to transition to rubber band mode
}                                       // use mouseup or mousedown to terminate radius drag

function insertNewPoint(element, bubble) {     //this bubble's ID truncated is the point to insert AFTER
  const { cx, cy } = bubble.attributes
  const insertionPoint = parseInt(bubble.id);
  const thisPoint = cx.value + ',' + cy.value;
  const splitPoints = element.attributes['points'].value.trim().split(' ');

  let thesePoints = '';

  for (let k = 0; k < splitPoints.length; k++) {
    thesePoints += splitPoints[k] + ' ';
    if (k == insertionPoint) {
      thesePoints += thisPoint + ' ';
    }
  }
  return thesePoints;
}

function createBubbleForCircle (bubbleGroup, { cx, cy, r }) {
  bubbleGroup.setAttributeNS(null, 'class', 'bubbles');
  bubbleGroup.appendChild(createShiftBubble(cx, cy, 'shift'));    // this is the center point of both bubble and circle
  bubbleGroup.appendChild(createSizeBubble(r + cx, cy, 'E'));    // this is the E resize point
  bubbleGroup.appendChild(createSizeBubble(cx, r + cy, 'S'));    // this is the S resize point
  bubbleGroup.appendChild(createSizeBubble(cx - r, cy, 'W'));    // this is the W resize point
  bubbleGroup.appendChild(createSizeBubble(cx, cy - r, 'N'));    // this is the N resize point

  return bubbleGroup;
}

function createBubbleForEllipse (bubbleGroup, { cx, cy, rx, ry }) {
  bubbleGroup.appendChild(createShiftBubble(cx, cy, 'shift'));    // this is the center point of both bubble and circle
  bubbleGroup.appendChild(createSizeBubble((cx + rx * 0.707), (cy + ry * 0.707), 'SE'));    // this is the SE resize point
  bubbleGroup.appendChild(createSizeBubble((cx + rx * 0.707), (cy - ry * 0.707), 'NE'));    // this is the NE resize point
  bubbleGroup.appendChild(createSizeBubble((cx - rx * 0.707), (cy - ry * 0.707), 'NW'));    // this is the NW resize point
  bubbleGroup.appendChild(createSizeBubble((cx - rx * 0.707), (cy + ry * 0.707), 'SW'));    // this is the SW resize point

  return bubbleGroup;
}

function createBubbleForRectangle (bubbleGroup, { x, y, width, height }) {
  bubbleGroup.appendChild(createShiftBubble(x, y, 'shift'));     // this is the rectangle origin, anomalous as it may be
  bubbleGroup.appendChild(createSizeBubble(x + width, y + height));    // this is the resize point

  return bubbleGroup
}

function createBubbleForLine (bubbleGroup, { x1, y1, x2, y2 }) {
  bubbleGroup.appendChild(createShiftBubble((x2 + x1) / 2, (y2 + y1) / 2, 'shift'));    // this is the move line point
  bubbleGroup.appendChild(createPointBubble(x1, y1, 'x1-y1'));     // this is the 1st line coordinate
  bubbleGroup.appendChild(createPointBubble(x2, y2, 'x2-y2'));    // this is the 2nd (terminal) line point

  return bubbleGroup
}

function createBubbleForPath (bubbleGroup, element) {
  let theseCurvePoints = element.attributes['d'].value;
  let thisCurveTypeQuadratic = theseCurvePoints.indexOf('Q ') > 0;
  let theseCoords = getCurveCoords(theseCurvePoints);       // stack control points after end points after helpers
  // fill out both control points in either case
  if (thisCurveTypeQuadratic) {          // if quadratic
    theseCoords[6] = theseCoords[4];  // replicate p2
    theseCoords[7] = theseCoords[5];  // into last coord set
    theseCoords[4] = theseCoords[2];          // for both control points
    theseCoords[5] = theseCoords[3];          // for control lines
  }
  // calculate centroid for shift bubble
  let xn, yn;
  if (thisCurveTypeQuadratic) {
    xn = parseFloat(theseCoords[0]) + parseFloat(theseCoords[2]) + parseFloat(theseCoords[6]);
    yn = parseFloat(theseCoords[1]) + parseFloat(theseCoords[3]) + parseFloat(theseCoords[7]);
    xn = ((xn) / 3).toFixed(4);
    yn = ((yn) / 3).toFixed(4);   // this calculation is less wrong for quadratic ...
  }
  else {
    xn = parseFloat(theseCoords[0]) + parseFloat(theseCoords[2]) + parseFloat(theseCoords[4]) + parseFloat(theseCoords[6])
    yn = parseFloat(theseCoords[1]) + parseFloat(theseCoords[3]) + parseFloat(theseCoords[5]) + parseFloat(theseCoords[7])
    xn = ((xn) / 4).toFixed(4);
    yn = ((yn) / 4).toFixed(4);
  }
  // create the "bounding" polygon  'poly'
  bubbleGroup.appendChild(createBoundsPoly(theseCoords));
  bubbleGroup.appendChild(createShiftBubble(xn, yn, 'shift'));    // this is the move element bubble
  // create the lines between the control point(s) and the endpoints
  bubbleGroup.appendChild(createControlLine(theseCoords[0], theseCoords[1], theseCoords[2], theseCoords[3], 'l1'));
  bubbleGroup.appendChild(createControlLine(theseCoords[4], theseCoords[5], theseCoords[6], theseCoords[7], 'l2'));
  bubbleGroup.appendChild(createCurveBubble(theseCoords[0], theseCoords[1], 'p1'));   // first endpoint
  bubbleGroup.appendChild(createCurveBubble(theseCoords[6], theseCoords[7], 'p2'));   // second endpoint
  bubbleGroup.appendChild(createCurveBubble(theseCoords[2], theseCoords[3], 'c1'));   // first control point

  if (!thisCurveTypeQuadratic) {
    bubbleGroup.appendChild(createCurveBubble(theseCoords[4], theseCoords[5], 'c2'));   // second control point
  }

  return bubbleGroup;
}

function createBubbleForPolyline (bubbleGroup, element) {
  const thesePoints = element.attributes['points'].value.trim();      // trim to eliminate extraneous empty string
  const splitPoints = thesePoints.split(' ');
  const thisPoint = splitPoints[0].split(',');   // prime the pump for iteration
  let x = parseFloat(thisPoint[0]);
  let y = parseFloat(thisPoint[1]);
  let nextX;
  let nextY;

  let xAve = 0;
  let yAve = 0;
  let nextPoint; 
                     // nextX,nextY these are used to bound and calculate the intermediate
  for (let k = 0; k < splitPoints.length; k++) {    // append this point and an intermediary point
    xAve += x;    // simple computation
    yAve += y;    // of center-ish point
    if (k < splitPoints.length - 1) {     // since we are looking ahead one point
      nextPoint = splitPoints[k + 1].split(',');     // only add intermediate point if we are not at the last point
      nextX = parseFloat(nextPoint[0]);
      nextY = parseFloat(nextPoint[1]);
      x = nextX;
      y = nextY;
    }
  }
  x = xAve / splitPoints.length;
  y = yAve / splitPoints.length;
  bubbleGroup.appendChild(createShiftBubble(x, y, 'shift'));

  // insert new point bubbles in separate parallel group
  const newBubbleGroup = document.createElementNS('http://www.w3.org/2000/svg', SVGType.GROUP)

  x = parseFloat(thisPoint[0]);
  y = parseFloat(thisPoint[1]);
  for (let k = 0; k < splitPoints.length; k++) {    // append this point and an intermediary point
    //thisPoint  = splitPoints[k].split(',');
    bubbleGroup.appendChild(createPointBubble(x, y, k.toString()));   // add the vertex point
    if (k < splitPoints.length - 1) {     // since we are looking ahead one point
      nextPoint = splitPoints[k + 1].split(',');     // only add intermediate point if we are not at the last point
      nextX = parseFloat(nextPoint[0]);
      nextY = parseFloat(nextPoint[1]);
      newBubbleGroup.appendChild(createNewPointBubble(0.5 * (x + nextX), 0.5 * (y + nextY), k.toString() + '.5'));
      // ///////// watch for hierarchicial misplacement
      x = nextX;
      y = nextY;
    }
  }

  if (element.tagName == drawMode.POLYGON) {       // additional step for polygon, since there is an implicit closure
    const [pointX, pointY] = splitPoints[0].split(',');   // get the first point again
    const id = (splitPoints.length - 1).toString() + '.5';

    x = parseFloat(pointX);
    y = parseFloat(pointY);

    newBubbleGroup.appendChild(createNewPointBubble(0.5 * (x + nextX), 0.5 * (y + nextY), id));
  }

  bubbleGroup.appendChild(newBubbleGroup);   // add the new point insertion bubbles

  return bubbleGroup;
}

function createBubbleForText (bubbleGroup, { x, y }) {
  bubbleGroup.appendChild(createShiftBubble(x, y, 'shift'))
  
  return bubbleGroup
}

function createBubbleGroup(group) {
  if (!group) {
    console_log(enable_log, 'group arg null, thisGroup=' + thisGroup)
  }

  const element = group.firstChild;
  const svgAttrs = getModel(element.tagName);
  const bubbleGroup = document.createElementNS('http://www.w3.org/2000/svg', SVGType.GROUP);

  if (element.tagName !== SVGType.PATH) {    // /////// skip this step for path exception
    for (let key in svgAttrs) {     // collect basic (numeric) attributes for positioning and extent
      svgAttrs[key] = getAttributeValue(element, key);       // collect this numeric attribute
    }
  }

  switch (element.tagName) {
    case SVGType.CIRCLE:    // 1 relocation bubble, 4 compass-point resize bubbles (flagged SHIFT and SIZE respecively)
      return createBubbleForCircle(bubbleGroup, svgAttrs)
    case SVGType.ELLIPSE:    // 1 relocation bubble, 4 compass-point resize bubbles (flagged SHIFT and SIZE respecively)
      return createBubbleForEllipse(bubbleGroup, svgAttrs)
    case SVGType.RECT:
      return createBubbleForRectangle(bubbleGroup, svgAttrs)
    case SVGType.LINE:
      return createBubbleForLine(bubbleGroup, svgAttrs)
    case SVGType.PATH:           // this is a MAJOR EXCEPTION to the other cases, used for curve !! articulate for type !!
      return createBubbleForPath(bubbleGroup, element)
    case drawMode.POLYGON:
    case drawMode.POLYLINE:      // create a parallel structure to the point attr, using its coords
      return createBubbleForPolyline(bubbleGroup, element)
    case SVGType.TEXT:
      return createBubbleForText(bubbleGroup, svgAttrs);
  }
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

function createSizeBubble(cx, cy, id) {
  let bubble = createBubbleStub(cx, cy);
  bubble.setAttributeNS(null, 'fill-opacity', '0.6');         // SIZE/POINT bubble is slightly less opaque
  bubble.addEventListener('mousedown', (event) => {
    setSizeElement(bubble)
  });
  // bubble.addEventListener('mouseup', (event) => { setElementMouseEnterLeave(bubble) });
  bubble.setAttributeNS(null, 'id', id);    // use this identifier to attach cursor in onSvgMouseMove
  return bubble;
}

function createPointBubble(cx, cy, id) {    // used for <poly...> vertices
  let bubble = createBubbleStub(cx, cy);
  bubble.setAttributeNS(null, 'fill-opacity', '0.6');         // SIZE/POINT bubble is slightly less opaque
  bubble.setAttributeNS(null, 'id', id);    // use this identifier to attach cursor in onSvgMouseMove
                                            // will take the form: 'x1-y1', 'x2-y2' for <line>,
                                            // will take the form: '0', '13' for <poly-...>
  bubble.addEventListener('mousedown', (event) => {
    setPointElement(bubble)
  });
/*   bubble.addEventListener('mouseup', (event) => {
    exitEditPoint(thisGroup)
  }); */
  return bubble;
}

function createNewPointBubble(cx, cy, id) {    // used for <poly...> inter-vertex insert new point
  let bubble = createBubbleStub(cx, cy);
  bubble.setAttributeNS(null, 'r', bubbleRadius * 0.8);      // radius override for insertion point
  bubble.setAttributeNS(null, 'stroke', '#555555');     // not that great, use below
  bubble.setAttributeNS(null, 'stroke-opacity', '0.6');     // not that great, use below
  bubble.setAttributeNS(null, 'fill-opacity', '0.4');         // SIZE/POINT bubble is even less opaque
  bubble.addEventListener('mousedown', (event) => {
    setNewPointElement(bubble)
  });
/*   bubble.addEventListener('mouseup', (event) => {
    exitEditPoint(thisGroup)
  }); */
  bubble.setAttributeNS(null, 'id', id);    // use this identifier to attach cursor in onSvgMouseMove
                                            // will take the form: '0.5', '23.5' for <poly-...>
  return bubble;
}

function createCurveBubble(cx, cy, id) {    // used for <path...> inter-vertex control point
  let bubble = createBubbleStub(cx, cy);
  // bubble.setAttributeNS(null, 'r', bubbleRadius * 0.8);      // radius override for control point
  bubble.setAttributeNS(null, 'stroke', '#333333');     // not that great, use below
  bubble.setAttributeNS(null, 'stroke-opacity', '0.6');     // not that great, use below
  bubble.setAttributeNS(null, 'fill-opacity', '0.8');         // make these stand out
  bubble.addEventListener('mousedown', (event) => {
    setPointElement(bubble)
  });
/*   bubble.addEventListener('mouseup', (event) => {
    exitEditPoint(event.target.parentElement.parentElement)
  }); */
  bubble.setAttributeNS(null, 'id', id);    // use this identifier to attach cursor in onSvgMouseMove
                                            // will take the form: 'c1', 'c2' for <path-...>
  return bubble;
}

function createControlLine(x1, y1, x2, y2, id) {
  let line = newElement(drawMode.LINE);
  line.setAttributeNS(null, 'x1', x1);
  line.setAttributeNS(null, 'y1', y1);
  line.setAttributeNS(null, 'x2', x2);
  line.setAttributeNS(null, 'y2', y2);
  line.setAttributeNS(null, 'id', id);
  line.setAttributeNS(null, 'stroke-width', '1');
  return line;
}

function createBoundsPoly(coords) {        // used by createBubbleGroup.path
  let poly = newElement(drawMode.POLYLINE);
  poly.setAttributeNS(null, 'id', 'poly');
  poly.setAttributeNS(null, 'points', getCurvePoints(coords));
  poly.setAttributeNS(null, 'stroke-opacity', '0.0');
  return poly;
}

function createBubbleStub(offsetX, offsetY) {   // create same-size bubble
  let bubble = newElement(drawMode.CIRCLE);      // this is constant, since it is a bubble
  if (isNaN(offsetX)) {
    alert('offsetX: ' + offsetX.toString());
  }
  if (isNaN(offsetY)) {
    alert('offsetY: ' + offsetY.toString());
  }
  bubble.setAttributeNS(null, 'cx', offsetX);      // start x
  bubble.setAttributeNS(null, 'cy', offsetY);      // start y
  bubble.setAttributeNS(null, 'r', bubbleRadius);      // radius
  bubble.setAttributeNS(null, 'fill', '#FFFFFF');
  bubble.setAttributeNS(null, 'stroke', '#222222');   // set scaffold attrs
  bubble.setAttributeNS(null, 'stroke-width', bubbleRadius * 0.25);
  return bubble;
}

function getAttributeValue(element, attr) {     // convert string numeric and truncate to one place after decimal
  return parseFloat(parseFloat(element.attributes[attr].value).toFixed(1));
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

SVGDraw.prototype.onSvgMouseMove = function (event) {
    this.renderFunction(event);
    event.preventDefault();
    return false;
}

function length2points(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow((x1 - x2), 2) + (Math.pow((y1 - y2), 2)));
}

let Trig = {
  distanceBetween2Points: function (point1, point2) {

    let dx = point2.x - point1.x;
    let dy = point2.y - point1.y;
    return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
  },

  angleBetween2Points: function (point1, point2) {

    let dx = point2.x - point1.x;
    let dy = point2.y - point1.y;
    return Math.atan2(dx, dy);
  }
};

SVGDraw.prototype._getMousePosition = function (event) {
  const rect = this.containerElement.getBoundingClientRect()

  return { 
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
}

SVGDraw.prototype.updateMousePosition = function (event) {
  const target = this.touchSupported
    ? event.originalEvent.touches[0]
    : event

  this.state.mousePosition = this._getMousePosition(target)
};

SVGDraw.prototype.updateSvgByElement = function (event) {
  /*
   This section services updating of svg element thisElement from onSvgMouseMove

   The initial scheme prior to editing of elements was to dynamically update the current point
   of the currently being created thisElement. This point has been the latest or final point
   in the element, where <circle>, <ellipse>, <rect>angle, and <line> have only the initial
   point (set during onSvgMouseDown) and a final point/datum.

   The general scheme up to implementation of editing <line>/<polyline>/<polygon> element types
   has been to articulate thisElement through the svgInProgress state (SHIFT, SIZE, cursorMode)
   where SHIFT moves the entire element, typically through the initial point set during
   onSvgMouseDown.For what had been effectively a resizing operation, sleight of hand set up the
   modes and states to resume processing of thisElement AS IF it had just been created and was
   as usual dynamically defining the second point/datum.

   On implementation of <line> editing, the initial decision was to make both endpoints (x1, y1)
   (x2, y2) repositionable rather than have the initial point move the line (which would entail
   adjusting both points in concert - no big deal, but not clearly preferable to individually
   moving each endpoint). This implementation surfaced the issue of point identification for the
   onSvgMouseMove handler. Clearly implications are paramount for <polyline>/<polygon> editing,
   and so a perversion of the SHIFT mode was temporarily used for <line> while development of a
   proper technique for <poly-...> proceeds.
   */

  if (cursorMode != drawMode.MOVE) {          // if we are not moving(dragging) the SVG check the known tags
    if ((cursorMode === drawMode.POLYGON) || ((cursorMode === drawMode.POLYLINE) && (svgInProgress === drawMode.POLYGON))) {
      if (svgInProgress == false) {
        return;
      }     // could be POINT or NEW or polygon
      this.updateMousePosition(event);
      if (svgInProgress == 'SHIFT') {
        let shiftingPoints = thisElement.attributes['points'].value.trim();
        let splitShiftPoints = shiftingPoints.split(' ');
        if (thisBubble != null) {       // thisBubble set on mousedown
          let cx = parseFloat(thisBubble.attributes['cx'].value);   // old
          let cy = parseFloat(thisBubble.attributes['cy'].value);   // x, y
          let cx2 = (this.state.mousePosition.x - this.state.xC) / zoom;                       // new x
          let cy2 = (this.state.mousePosition.y - this.state.yC) / zoom;                       // , y
          let dx = (cx2 - cx);
          let dy = (cy2 - cy);
          thisBubble.attributes['cx'].value = (this.state.mousePosition.x - this.state.xC) / zoom;     // translate the bubble
          thisBubble.attributes['cy'].value = (this.state.mousePosition.y - this.state.yC) / zoom;

          // splitShiftPoints all need to be shifted by the deltas
          // so iterate over all points, in initially a very pedantic way
          let shiftedPoints = '';
          let j;      //iterator for decomposing x, y point lists
          let xPoints = [];
          let yPoints = [];
          for (j = 0; j < splitShiftPoints.length; j++) {
            let thisXY = splitShiftPoints[j].split(',');
            xPoints[j] = (parseFloat(thisXY[0]) + dx).toFixed(4);
            yPoints[j] = (parseFloat(thisXY[1]) + dy).toFixed(4);
            shiftedPoints += xPoints[j] + ',' + yPoints[j] + ' '
          }
          for (let k = 0; k < splitShiftPoints.length; k++) {
            shiftingPoints += splitShiftPoints[k] + ' ';
          }
          thisElement.attributes['points'].value = shiftedPoints
        }
      }
      else {
        let thisPoint = ((this.state.mousePosition.x - this.state.xC) / zoom).toFixed(4).toString()
          + ',' + ((this.state.mousePosition.y - this.state.yC) / zoom).toFixed(4).toString();
        let thesePoints = thisElement.attributes['points'].value.trim();
        let splitPoints = thesePoints.split(' ');
        if (thisBubble != null) {       // look for bubble to denote just move THIS point only
          thisBubble.attributes['cx'].value = (this.state.mousePosition.x - this.state.xC) / zoom;     // translate the bubble
          thisBubble.attributes['cy'].value = (this.state.mousePosition.y - this.state.yC) / zoom;
          if (isNumeric(thisBubble.id)) {       // presume integer for now
            splitPoints[parseInt(thisBubble.id)] = thisPoint;
            thesePoints = '';
            for (let k = 0; k < splitPoints.length; k++) {
              thesePoints += splitPoints[k] + ' ';
            }
            thisElement.attributes['points'].value = thesePoints
          }
        } else {        // svgInProgress = 'poly--', so normal creation of element adding new point to end
          thesePoints = '';                               // clear thecollector
          for (let k = 0; k < splitPoints.length - 1; k++) {  // reconstruct except for the last point
            thesePoints += splitPoints[k] + ' ';          // space delimiter at the end of each coordinate
          }
          thisPoint += ' ';
          thisElement.attributes['points'].value = thesePoints.concat(thisPoint);
        }
      }
    }

    else if (cursorMode == drawMode.POLYLINE) {
      if (svgInProgress == false) {
        return;
      }
      this.updateMousePosition(event);
      if (svgInProgress == 'SHIFT') {
        let shiftingPoints = thisElement.attributes['points'].value.trim();
        let splitShiftPoints = shiftingPoints.split(' ');
        if (thisBubble != null) {       // thisBubble set on mousedown
          let cx = parseFloat(thisBubble.attributes['cx'].value);   // old
          let cy = parseFloat(thisBubble.attributes['cy'].value);   // x, y
          let cx2 = (this.state.mousePosition.x - this.state.xC) / zoom;                       // new x
          let cy2 = (this.state.mousePosition.y - this.state.yC) / zoom;                       // , y
          let dx = (cx2 - cx)
          let dy = (cy2 - cy)
          thisBubble.attributes['cx'].value = (this.state.mousePosition.x - this.state.xC) / zoom;     // translate the bubble
          thisBubble.attributes['cy'].value = (this.state.mousePosition.y - this.state.yC) / zoom;

          // splitShiftPoints all need to be shifted by the deltas
          // so iterate over all points, in initially a very pedantic way
          let shiftedPoints = '';
          let j;      //iterator for decomposing x, y point lists
          let xPoints = [];
          let yPoints = [];
          for (j=0; j < splitShiftPoints.length; j++) {
            let thisXY = splitShiftPoints[j].split(',');
            xPoints[j] = (parseFloat(thisXY[0]) + dx).toFixed(4);
            yPoints[j] = (parseFloat(thisXY[1]) + dy).toFixed(4);
            shiftedPoints += xPoints[j] + ',' + yPoints[j] + ' '
          }
          for (let k = 0; k < splitShiftPoints.length; k++) {
            shiftingPoints += splitShiftPoints[k] + ' ';
          }
          thisElement.attributes['points'].value = shiftedPoints
        }
      }
      else {
        let thisPoint = ((this.state.mousePosition.x - this.state.xC) / zoom).toFixed(4).toString()
          + ',' + ((this.state.mousePosition.y - this.state.yC) / zoom).toFixed(4).toString();
        let thesePoints = thisElement.attributes['points'].value.trim();
        let splitPoints = thesePoints.split(' ');
        if (thisBubble != null) {       // look for bubble to denote just move THIS point only
          thisBubble.attributes['cx'].value = (this.state.mousePosition.x - this.state.xC) / zoom;     // translate the bubble
          thisBubble.attributes['cy'].value = (this.state.mousePosition.y - this.state.yC) / zoom;
          if (isNumeric(thisBubble.id)) {       // presume integer for now
            splitPoints[parseInt(thisBubble.id)] = thisPoint;   // replace this point
            thesePoints = '';
            for (let k = 0; k < splitPoints.length; k++) {
              thesePoints += splitPoints[k] + ' ';
            }
            thisElement.attributes['points'].value = thesePoints
          }
        } else {        // svgInProgress = 'poly--', so normal creation of element adding new point to end
          thesePoints = '';                               // clear the collector
          for (let k = 0; k < splitPoints.length - 1; k++) {  // reconstruct except for the last point
            thesePoints += splitPoints[k] + ' ';          // space delimiter at the end of each coordinate
          }
          thisPoint += ' ';
          thisElement.attributes['points'].value = thesePoints.concat(thisPoint);
        }
      }
    }

    else if (cursorMode == drawMode.RECTANGLE) {
      if (svgInProgress == false) {
        return;
      }
      if (svgInProgress == 'SHIFT') {
        this.updateMousePosition(event);
        thisBubble.attributes['cx'].value = (this.state.mousePosition.x - this.state.xC) / zoom;     // translate the bubble
        thisBubble.attributes['cy'].value = (this.state.mousePosition.y - this.state.yC) / zoom;
        thisElement.attributes['x'].value = ((this.state.mousePosition.x - this.state.xC) / zoom).toFixed(4);    // correspondingly translate thisElement
        thisElement.attributes['y'].value = ((this.state.mousePosition.y - this.state.yC) / zoom).toFixed(4);
      } else {
        let thisRectX = thisElement.attributes['x'].value;
        let thisRectY = thisElement.attributes['y'].value;

        this.updateMousePosition(event);
        thisElement.attributes['width'].value = ((this.state.mousePosition.x - this.state.xC) / zoom - thisRectX).toFixed(4);
        thisElement.attributes['height'].value = ((this.state.mousePosition.y - this.state.yC) / zoom - thisRectY).toFixed(4);
        if (thisBubble) {
          thisBubble = event.target
          thisBubble.attributes['cx'].value = (this.state.mousePosition.x - this.state.xC) / zoom;     // translate the bubble
          thisBubble.attributes['cy'].value = (this.state.mousePosition.y - this.state.yC) / zoom;
        }
      }
    }

    else if (cursorMode == drawMode.LINE) {
      let linePoints
      if ((event.type == 'mousedown') || (svgInProgress == false)) {    // extra condition for line
        console_log(enable_log, 'cursorMode=line abort event:' + event.type + ' svgInProgress= ' + svgInProgress);
        return;
      }
      if (svgInProgress == 'SHIFT') {
        this.updateMousePosition(event);
        let x1 = parseFloat(thisElement.attributes['x1'].value)
        let y1 = parseFloat(thisElement.attributes['y1'].value)
        let x2 = parseFloat(thisElement.attributes['x2'].value)
        let y2 = parseFloat(thisElement.attributes['y2'].value)
        // thisBubble set on mousedown
        let cx = parseFloat(thisBubble.attributes['cx'].value)
        let cy = parseFloat(thisBubble.attributes['cy'].value)
        let cx2 = (this.state.mousePosition.x - this.state.xC) / zoom
        let cy2 = (this.state.mousePosition.y - this.state.yC) / zoom
        let dx = (cx - cx2)
        let dy = (cy2 - cy)

        if (thisBubble) {
          thisBubble.attributes['cx'].value = cx2;         // translate the bubble
          thisBubble.attributes['cy'].value = cy2;
          thisElement.attributes['x1'].value = (x1 - dx).toFixed(4);    // correspondingly translate thisElement
          thisElement.attributes['y1'].value = (dy + y1).toFixed(4);
          thisElement.attributes['x2'].value = (x2 - dx).toFixed(4);    // correspondingly translate thisElement
          thisElement.attributes['y2'].value = (dy + y2).toFixed(4);
        }
      } else {      // repositioning either line endpoint
        this.updateMousePosition(event);
        linePoints = ['x2', 'y2'];          // preset for normal post-creation mode
        if (thisBubble != null) {       // look for bubble to denote just move THIS point only
          thisBubble.attributes['cx'].value = (this.state.mousePosition.x - this.state.xC) / zoom;     // translate the bubble
          thisBubble.attributes['cy'].value = (this.state.mousePosition.y - this.state.yC) / zoom;
          if (!isNumeric(thisBubble.id)) {                 // presume either 'x1-y1' or 'x2-y2'
            linePoints = (thisBubble.id).split('-');      // this will result in ['x1', 'y1'] or  ['x2', 'y2'] used below
          }
          if (thisGroup.lastChild.firstChild.id == 'shift') {
            thisGroup.lastChild.firstChild.remove();        // kill off the move line bubble
          }
        }
        thisElement.attributes[linePoints[0]].value = ((this.state.mousePosition.x - this.state.xC) / zoom).toFixed(4);
        thisElement.attributes[linePoints[1]].value = ((this.state.mousePosition.y - this.state.yC) / zoom).toFixed(4);
        console_log(enable_log, 'x: ' + ((this.state.mousePosition.x - this.state.xC) / zoom).toString() + ' / y: ' + ((this.state.mousePosition.y - this.state.yC) / zoom).toString())
      }
    }

    else if (cursorMode == drawMode.ARROW) {
      let linePoints
      if ((event.type == 'mousedown') || (svgInProgress == false)) {    // extra condition for line
        return;
      }
      let mainLine = thisGroup.children[0];
      this.updateMousePosition(event);
      if (svgInProgress == 'SHIFT') {
        let x1 = parseFloat(mainLine.attributes['x1'].value)
        let y1 = parseFloat(mainLine.attributes['y1'].value)
        let x2 = parseFloat(mainLine.attributes['x2'].value)
        let y2 = parseFloat(mainLine.attributes['y2'].value)
        // thisBubble set on mousedown -- except not here for some reason TBD
        if(!thisBubble) {thisBubble = mainLine.parentElement.lastChild.children['shift']}
        let cx = parseFloat(thisBubble.attributes['cx'].value)
        let cy = parseFloat(thisBubble.attributes['cy'].value)
        let cx2 = (this.state.mousePosition.x - this.state.xC) / zoom
        let cy2 = (this.state.mousePosition.y - this.state.yC) / zoom
        let dx = (cx - cx2)
        let dy = (cy2 - cy)
        thisBubble.attributes['cx'].value = cx2;      // translate the bubble
        thisBubble.attributes['cy'].value = cy2;
        mainLine.attributes['x1'].value = (x1 - dx).toFixed(4);    // correspondingly
        mainLine.attributes['y1'].value = (dy + y1).toFixed(4);
        mainLine.attributes['x2'].value = (x2 - dx).toFixed(4);    // translate mainLine
        mainLine.attributes['y2'].value = (dy + y2).toFixed(4);

      } else {
        linePoints = ['x2', 'y2'];          // preset for normal post-creation mode
        if (thisBubble != null) {       // look for bubble to denote just move THIS point only
          thisBubble.attributes['cx'].value = (this.state.mousePosition.x - this.state.xC) / zoom;     // translate the bubble
          thisBubble.attributes['cy'].value = (this.state.mousePosition.y - this.state.yC) / zoom;
          if (!isNumeric(thisBubble.id)) {       // presume either 'x1-y1' or 'x2-y2'
            linePoints = (thisBubble.id).split('-');      // this will result in ['x1', 'y1'] or  ['x2', 'y2'] used below
          }
        }
        mainLine.attributes[linePoints[0]].value = ((this.state.mousePosition.x - this.state.xC) / zoom).toFixed(4);
        mainLine.attributes[linePoints[1]].value = ((this.state.mousePosition.y - this.state.yC) / zoom).toFixed(4);
      }
      while (thisGroup.childElementCount > 1) {   // remove everything except the main line
        thisGroup.lastChild.remove();             // ///////////////////  VERY TEMPORARY METHOD
      }
      let thisX1 = thisElement.attributes['x1'].value;    // shorter references to original line's values
      let thisY1 = thisElement.attributes['y1'].value;
      let thisX2 = thisElement.attributes['x2'].value;
      let thisY2 = thisElement.attributes['y2'].value;
      let thisColor = thisElement.attributes['stroke'].value;
      let thisStrokeWidth = thisElement.attributes['stroke-width'].value;   // save mainLine attributes since NEW barbs
      let deltaX = thisX2 - thisX1;
      let deltaY = thisY2 - thisY1;
      let lineLength = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (lineLength == 0) {
        lineLength = 1
      }   // preempt divide by 0
      let dx = deltaX / lineLength;
      let dy = deltaY / lineLength;
      let barbLength;
      if (arrowFixed) {
        barbLength = arrowheadLength;
      } else {                              // either fixed pixel length or percentage
        barbLength = lineLength * arrowPercent / 100;
      }
      let pctX = parseFloat(thisX2) - (dx * barbLength);   //  baseline for barb trailing end
      let pctY = parseFloat(thisY2) - (dy * barbLength);
      let x3 = (pctX + barbLength * dy / 2).toFixed(4);
      let y3 = (pctY - barbLength * dx / 2).toFixed(4);
      let x4 = (pctX - barbLength * dy / 2).toFixed(4);
      let y4 = (pctY + barbLength * dx / 2).toFixed(4);

      let leftBarb = newElement(drawMode.LINE);
      leftBarb.setAttributeNS(null, 'x1', thisX2);       // start x of barbs
      leftBarb.setAttributeNS(null, 'y1', thisY2);      // start y of barbs
      leftBarb.setAttributeNS(null, 'x2', x3);      // end x
      leftBarb.setAttributeNS(null, 'y2', y3);      // end y
      leftBarb.setAttributeNS(null, 'stroke', thisColor);
      leftBarb.setAttributeNS(null, 'stroke-width', thisStrokeWidth);
      // thisGroup.appendChild(leftBarb);
      let rightBarb = newElement(drawMode.LINE);
      rightBarb.setAttributeNS(null, 'x1', thisX2);       // start x of barbs
      rightBarb.setAttributeNS(null, 'y1', thisY2);      // start y of barbs
      rightBarb.setAttributeNS(null, 'x2', x4);      // end x
      rightBarb.setAttributeNS(null, 'y2', y4);      // end y
      rightBarb.setAttributeNS(null, 'stroke', thisColor);
      rightBarb.setAttributeNS(null, 'stroke-width', thisStrokeWidth);
      // thisGroup.appendChild(rightBarb);

      if (arrowClosed) {
        let baseBarb = newElement(drawMode.POLYGON);
        let barbPoints = thisX2 + ',' + thisY2 + ' ' + x3 + ',' + y3 + ' ' + x4 + ',' + y4;
        baseBarb.setAttributeNS(null, 'points', barbPoints);
        baseBarb.setAttributeNS(null, 'stroke', thisColor);
        baseBarb.setAttributeNS(null, 'stroke-width', thisStrokeWidth);
        thisGroup.appendChild(baseBarb)
      }
      else {
        thisGroup.appendChild(leftBarb);
        thisGroup.appendChild(rightBarb);
      }
    }

    else if ((cursorMode === drawMode.CIRCLE) /*|| (cursorMode == 'bubble')*/) {
      //thisCircle = thisElement;             // first step toward generalizing SHIFT/SIZE handlers
      if ((event.type == 'mousedown') || (svgInProgress == false)) {
        return;         // //// this has been verified to actually occur
      }
      if (svgInProgress == 'SHIFT') {             // changing position of this element
        this.updateMousePosition(event);
        thisBubble.attributes['cx'].value = (this.state.mousePosition.x - this.state.xC) / zoom;     // translate the bubble
        thisBubble.attributes['cy'].value = (this.state.mousePosition.y - this.state.yC) / zoom;
        thisElement.attributes['cx'].value = ((this.state.mousePosition.x - this.state.xC) / zoom).toFixed(4);    // correspondingly translate thisElement
        thisElement.attributes['cy'].value = ((this.state.mousePosition.y - this.state.yC) / zoom).toFixed(4);
      } else {                                // either resizing or originally sizing
        //this.context.moveTo(this.state.mousePosition.x, this.state.mousePosition.y);
        let thisCircX = thisElement.attributes['cx'].value;
        let thisCircY = thisElement.attributes['cy'].value;
        this.updateMousePosition(event);

        let radius = length2points(thisCircX, thisCircY, (this.state.mousePosition.x - this.state.xC) / zoom, (this.state.mousePosition.y - this.state.yC) / zoom);
        thisElement.attributes['r'].value = radius.toFixed(4);
        if (thisBubble) {
          thisBubble = event.target
          switch (thisBubble.id) {
            case 'E':
              thisBubble.attributes['cx'].value = parseFloat(thisCircX) + radius
              break
            case 'S':
              thisBubble.attributes['cy'].value = parseFloat(thisCircY) + radius
              break
            case 'W':
              thisBubble.attributes['cx'].value = parseFloat(thisCircX) - radius
              break
            case 'N':
              thisBubble.attributes['cy'].value = parseFloat(thisCircY) - radius
              break
          }
        }
        let bubbles = event.target.parentElement.children
        if(bubbles['E']) {      // translate editing circle's bubbles
          bubbles['E'].attributes['cx'].value = parseFloat(thisCircX) + radius
          bubbles['S'].attributes['cy'].value = parseFloat(thisCircY) + radius
          bubbles['W'].attributes['cx'].value = parseFloat(thisCircX) - radius
          bubbles['N'].attributes['cy'].value = parseFloat(thisCircY) - radius
        }
      }
    }

    else if (cursorMode == drawMode.ELLIPSE) {
      if ((event.type == 'mousedown') || (svgInProgress == false)) {
        return;
      }
      if (svgInProgress == 'SHIFT') {             // changing position of this element
        this.updateMousePosition(event);
        thisBubble.attributes['cx'].value = (this.state.mousePosition.x - this.state.xC) / zoom;     // translate the bubble
        thisBubble.attributes['cy'].value = (this.state.mousePosition.y - this.state.yC) / zoom;
        thisElement.attributes['cx'].value = ((this.state.mousePosition.x - this.state.xC) / zoom).toFixed(4);    // correspondingly translate thisElement
        thisElement.attributes['cy'].value = ((this.state.mousePosition.y - this.state.yC) / zoom).toFixed(4);
      } else {                        // resizing: cursor NOW osculates ellipse as in circle, diagonally positioned
        let thisEllipseX = thisElement.attributes['cx'].value;
        let thisEllipseY = thisElement.attributes['cy'].value;

        this.updateMousePosition(event);

        thisElement.attributes['rx'].value = (Math.abs(thisEllipseX - (this.state.mousePosition.x - this.state.xC) / zoom) * 1.414).toFixed(4);
        thisElement.attributes['ry'].value = (Math.abs(thisEllipseY - (this.state.mousePosition.y - this.state.yC) / zoom) * 1.414).toFixed(4);
      }
    }

    else if (cursorMode == drawMode.DRAW) {
      if (svgInProgress == false) {
        return;
      }
      this.updateMousePosition(event);
      if (svgInProgress == 'SHIFT') {
        let shiftingPoints = thisElement.attributes['points'].value.trim();
        let splitShiftPoints = shiftingPoints.split(' ');
        if (thisBubble != null) {       // thisBubble set on mousedown
          let cx = parseFloat(thisBubble.attributes['cx'].value);   // old
          let cy = parseFloat(thisBubble.attributes['cy'].value);   // x, y
          let cx2 = (this.state.mousePosition.x - this.state.xC) / zoom;                       // new x
          let cy2 = (this.state.mousePosition.y - this.state.yC) / zoom;                       // , y
          let dx = (cx2 - cx)
          let dy = (cy2 - cy)
          thisBubble.attributes['cx'].value = (this.state.mousePosition.x - this.state.xC) / zoom;     // translate the bubble
          thisBubble.attributes['cy'].value = (this.state.mousePosition.y - this.state.yC) / zoom;

          // splitShiftPoints all need to be shifted by the deltas
          // so iterate over all points, in initially a very pedantic way
          let shiftedPoints = '';
          let j;      //iterator for decomposing x, y point lists
          let xPoints = [];
          let yPoints = [];
          for (j=0; j < splitShiftPoints.length; j++) {
            let thisXY = splitShiftPoints[j].split(',');
            xPoints[j] = (parseFloat(thisXY[0]) + dx).toFixed(4);
            yPoints[j] = (parseFloat(thisXY[1]) + dy).toFixed(4);
            shiftedPoints += xPoints[j] + ',' + yPoints[j] + ' '
          }
          for (let k = 0; k < splitShiftPoints.length; k++) {
            shiftingPoints += splitShiftPoints[k] + ' ';
          }
          thisElement.attributes['points'].value = shiftedPoints
        }
      }   // end of SHIFT draw case
      else {    // edit point by bubble
        let thisPoint = ((this.state.mousePosition.x - this.state.xC) / zoom).toFixed(4).toString()
          + ',' + ((this.state.mousePosition.y - this.state.yC) / zoom).toFixed(4).toString();
        let thesePoints = thisElement.attributes['points'].value.trim();
        let splitPoints = thesePoints.split(' ');
        if (thisBubble != null) {       // look for bubble to denote just move THIS point only
          // currently, no distinction is made between existing vertex and new point
          // however, this may change in the future JRF 23NOV15
          thisBubble.attributes['cx'].value = (this.state.mousePosition.x - this.state.xC) / zoom;     // translate the bubble
          thisBubble.attributes['cy'].value = (this.state.mousePosition.y - this.state.yC) / zoom;
          if (isNumeric(thisBubble.id)) {       // presume integer for now
            splitPoints[parseInt(thisBubble.id)] = thisPoint;   // replace this point
            thesePoints = '';
            for (let k = 0; k < splitPoints.length; k++) {
              thesePoints += splitPoints[k] + ' ';
            }
            thisElement.attributes['points'].value = thesePoints
          }
        }   // end of edit point case
        else {    // add new point at end during creation case
        let thesePoints = thisElement.attributes['points'].value;
        let thisPoint = ((this.state.mousePosition.x - this.state.xC) / zoom).toFixed(4).toString()
          + ',' + ((this.state.mousePosition.y - this.state.yC) / zoom).toFixed(4).toString() + ' ';
        thisElement.attributes['points'].value = thesePoints.concat(thisPoint);
        }   // end of new point at end case
      }
    }     // end of Draw case

    else if ((cursorMode == drawMode.CUBIC) || (cursorMode == drawMode.QUADRATIC)) {
      if ((event.type == 'mousedown') || (svgInProgress == false)) {    // extra condition for line
        return;
      }
      this.updateMousePosition(event);
      let thisDvalue = thisElement.attributes['d'].value;
      let thisCurveQuadratic = thisDvalue.indexOf('Q ') > 0;
      if (thisBubble != null) {       // look for bubble to denote just move THIS point only
        // currently, no distinction is made between existing vertex and new point
        // however, this may change in the future JRF 23NOV15
        let thisX = (this.state.mousePosition.x - this.state.xC) / zoom;
        let thisY = (this.state.mousePosition.y - this.state.yC) / zoom;
        let thisX2 = parseFloat(thisBubble.attributes['cx'].value)
        let thisY2 = parseFloat(thisBubble.attributes['cy'].value)
        console_log(enable_log, 'endpoints: [' + thisX + ', ' + thisY + '], [' + thisX2 + ', ' + thisY2 + ']')
        let dx = thisX - thisX2
        let dy = thisY - thisY2
        thisBubble.attributes['cx'].value = thisX;     // translate the bubble
        thisBubble.attributes['cy'].value = thisY;
        let theseCoords = getCurveCoords(thisDvalue);
        //#TODO: fix incremental mistracking of shift point, bubble no longer present
        if (thisBubble.id == 'shift') {
          console_log(enable_log, thisDvalue)
          console_log(enable_log, 'dx: ' + dx + ', dy: ' + dy)
          // tranlate each coordinate (array contains x, y, x, y, ... x, y
          for (let k = 0; k < theseCoords.length; k++) {
            theseCoords[k] = (dx + parseFloat(theseCoords[k])).toFixed(4)
            theseCoords[k + 1] = (dy + parseFloat(theseCoords[k + 1])).toFixed(4)
            k++
          }
          if (thisCurveQuadratic) {     //////// this is a kludge to make user the param names line up in getCurveCoords
            theseCoords[6] = theseCoords[4];    // populate template curve p2
            theseCoords[7] = theseCoords[5];    // coordinates from quadratic p2 values
          }
          thisElement.attributes['d'].value = getCurvePath(theseCoords[0], theseCoords[1], theseCoords[2], theseCoords[3],
            theseCoords[4], theseCoords[5], theseCoords[6], theseCoords[7]);    // responds to both C and Q curves
          console_log(enable_log, thisElement.attributes['d'].value)
        }
        //
        // worksheet data for quadratic and cubic curves is conformed to the same model
        // p1: [0,1], c1: [2,3], c2: [3,4], p2: [6,7]. Only one control point is used
        // for quadratic when actually rendered
        else {
          // process non-shift bubble
          if (thisCurveQuadratic) {     //////// this is a kludge to make user the param names line up in getCurveCoords
            theseCoords[6] = theseCoords[4];    // populate template curve p2
            theseCoords[7] = theseCoords[5];    // coordinates from quadratic p2 values
          }
          switch (thisBubble.id) {
            case 'p1':
              theseCoords[0] = thisX.toFixed(4);
              theseCoords[1] = thisY.toFixed(4);
              break;
            case 'p2':
              theseCoords[6] = thisX.toFixed(4);
              theseCoords[7] = thisY.toFixed(4);
              break;
            case 'c1':
              theseCoords[2] = thisX.toFixed(4);
              theseCoords[3] = thisY.toFixed(4);
              break;
            case 'c2':
              theseCoords[4] = thisX.toFixed(4);
              theseCoords[5] = thisY.toFixed(4);
              break;
          }
          if (thisCurveQuadratic) {
            theseCoords[4] = theseCoords[2];    // force quadratic curve control
            theseCoords[5] = theseCoords[3];    // points to be the same point
          }
          // 'd' is the string containing the path parameters; set it to the updated values
          thisElement.attributes['d'].value = getCurvePath(theseCoords[0], theseCoords[1], theseCoords[2], theseCoords[3],
            theseCoords[4], theseCoords[5], theseCoords[6], theseCoords[7]);    // responds to both C and Q curves
          // now set the lines for the control points; two lines (l1 and l2) whether cubic or quadratic
          thisElement.parentElement.lastChild.children['l1'].attributes['x1'].value = theseCoords[0];
          thisElement.parentElement.lastChild.children['l1'].attributes['y1'].value = theseCoords[1];
          thisElement.parentElement.lastChild.children['l1'].attributes['x2'].value = theseCoords[2];
          thisElement.parentElement.lastChild.children['l1'].attributes['y2'].value = theseCoords[3];

          thisElement.parentElement.lastChild.children['l2'].attributes['x1'].value = theseCoords[4];
          thisElement.parentElement.lastChild.children['l2'].attributes['y1'].value = theseCoords[5];
          thisElement.parentElement.lastChild.children['l2'].attributes['x2'].value = theseCoords[6];
          thisElement.parentElement.lastChild.children['l2'].attributes['y2'].value = theseCoords[7];

          thisElement.parentElement.lastChild.children['poly'].attributes['points'].value = getCurvePoints(theseCoords)
            + theseCoords[0] + ', ' + theseCoords[1];     // 'poly' is bounding polygon of endpoints and control points
        }
      } else {
        // defining initial curve as straight line, i.e., rubber-banding p2 until mouseup
        let thisX2 = (this.state.mousePosition.x - this.state.xC) / zoom;
        let thisY2 = (this.state.mousePosition.y - this.state.yC) / zoom;
        let thisD;
        let thisPathType = ' C ';              // set quadratic control point at midpoint, cubic's at 40% and 60% p1:p2
        if (cursorMode == drawMode.QUADRATIC) thisPathType = ' Q ';
        let theseCurvePoints = thisDvalue.split(thisPathType);      // isolate control point(s) and p2
        let thisP1 = theseCurvePoints[0].split('M ');               // isolate p1
        thisP1 = thisP1[1].split(', ');
        let thisX1 = parseInt(thisP1[0])
        let thisY1 = parseInt(thisP1[1])
        let dx = thisX1 - thisX2;
        let dy = thisY1 - thisY2;
        let theseControlPoints = theseCurvePoints[1].split(', ');              // get array of x,y,x,y(,x,y)
        if (thisPathType == ' Q ') {
          theseControlPoints[0] = (thisX1 - 0.4 * dx).toFixed(4);   // single control point
          theseControlPoints[1] = (thisY1 - 0.4 * dy).toFixed(4);   // for quadratic
          thisD = theseCurvePoints[0] + thisPathType + curvePoint(theseControlPoints[0], theseControlPoints[1]);
        } else {
          // if (cursorMode == drawMode.CUBIC)
          theseControlPoints[0] = (thisX1 - 0.4 * dx).toFixed(4);
          theseControlPoints[1] = (thisY1 - 0.4 * dy).toFixed(4);
          theseControlPoints[2] = (thisX1 - 0.6 * dx).toFixed(4);
          theseControlPoints[3] = (thisY1 - 0.6 * dy).toFixed(4);
          thisD = theseCurvePoints[0] + thisPathType + curvePoint(theseControlPoints[0], theseControlPoints[1]);
          thisD += curvePoint(theseControlPoints[2], theseControlPoints[3]);
          thisD += curvePoint(thisX2, thisY2);
          console_log(enable_log, 'p1: ' + thisP1[0] + ', ' + thisP1[1])
          console_log(enable_log, 'control points: ' + theseControlPoints[0] + ', ' + theseControlPoints[1] + ' ... ' + theseControlPoints[2] + ', ' + theseControlPoints[3])
          console_log(enable_log, 'p2: ' + thisX2 + ', ' + thisY2)
        }
        thisD += pathPoint(thisX2, thisY2);
        thisElement.attributes['d'].value = thisD;
      }
    }

    else if (cursorMode == "text") {    // translate
      if (svgInProgress == 'SHIFT') {
        this.updateMousePosition(event);
        if(!thisBubble) {
          thisBubble = event.target;
        }
        let dx = (this.state.mousePosition.x - this.state.xC) / zoom;
        let dy = (this.state.mousePosition.y - this.state.yC) / zoom;
        thisBubble.attributes['cx'].value = dx;     // translate the bubble
        thisBubble.attributes['cy'].value = dy;
        for (let i = 0; i < thisGroup.children.length; i++) {      // for any text lines in this group (skip bubble)
          if (thisGroup.children[i].tagName == 'text') {          // only shift text elements, not bubbles
            thisGroup.children[i].attributes['x'].value = dx.toFixed(4);    // translate each <text> element
            thisGroup.children[i].attributes['y'].value = (dy + (i * fontSize)).toFixed(4);
          } else {      // translate the bubble
            thisGroup.children[i].children[0].attributes['cx'].value = dx;    // translate each <text> element
            thisGroup.children[i].children[0].attributes['cy'].value = dy;
          }
        }
      }
    }
  }

  else if (cursorMode == drawMode.MOVE) {    // Revert to MOVE: this version assumes manipulating the transform <xlt> of the SVG via this.state.xC, this.state.yC

    if (svgInProgress == drawMode.MOVE) {

      let oldX = this.state.mousePosition.x;
      let oldY = this.state.mousePosition.y;
      this.updateMousePosition(event);
      //this.state.mousePosition.x = this.state.mousePosition.x;
      //this.state.mousePosition.y = this.state.mousePosition.y;
      this.state.xC = this.state.xC - (oldX - this.state.mousePosition.x);
      this.state.yC = this.state.yC - (oldY - this.state.mousePosition.y);
      this.zoom_trans(this.state.xC, this.state.yC, zoom);                   // effects the translation to this.state.xC, this.state.yC in the transform
    }
  }
  return event.preventDefault() && false;
};

SVGDraw.prototype.onSvgMouseUp = function (event) {
    if (!svgInProgress) {                       // i.e., if svgInProgress is not false
      event.preventDefault() 
      return false
    }

    if (svgInProgress == 'SHIFT') {       // this is also catching mouseUp from bubbles!!!
      // mouseup implies end of position shift or resize  ///// HELLO ///// ^^^^^^^
      svgInProgress = false;
      clearEditElement(thisGroup);
    } else if (svgInProgress == 'SIZE') {
      // mouseup implies end of position shift or resize
      svgInProgress = false;
      setElementMouseEnterLeave(thisElement.parentNode);   // this element is a SHIFT bubble
    } else {
      switch(cursorMode) {
        case drawMode.DRAW:
        case drawMode.CUBIC:
        case drawMode.QUADRATIC:
          svgInProgress = false;
          setElementMouseEnterLeave(thisGroup);
          break
        case drawMode.RECTANGLE:
        case drawMode.LINE:
        case drawMode.ARROW:
        case drawMode.CIRCLE:
        case drawMode.ELLIPSE:
          svgInProgress = false;
          setElementMouseEnterLeave(thisGroup);
    
          thisBubble = null;
          thisElement = null;
          thisGroup = null;
          break
        case drawMode.POLYGON:
        case drawMode.POLYLINE:
          if (thisBubble) {
            svgInProgress = false;
            setElementMouseEnterLeave(thisGroup);
    
            thisBubble = null;
            thisElement = null;
            thisGroup = null;
          }
          break
        case drawMode.TEXT:
          if (svgInProgress == false) {
            setElementMouseEnterLeave(thisGroup);
          }
          break
        case drawMode.MOVE: 
          svgInProgress = false
      }
    }

    thisSVGpoints = [];      // and clear the collector

    return false;
};

/*
 Consider the extension of Escape vs Enter key to terminate all element creation functions:
 Escape originally envisioned as abort key, but slightly perverted for text.
 Currently supported in text as function termination. Enter causes new line.
 Poly-s currently supported by Enter and/or double-click
 line; rectangle; circle; ellipse; cubic quadratic all now terminate on Enter, ABORT on Escape, including edited element
 */
SVGDraw.prototype.keyUpHandler = function () {
  return function (event) {
    if (event.keyCode == 0x14) {
      capsLock = !capsLock;
    }
  }
};

SVGDraw.prototype.keyHandler = function (event) {
  const keyCode = event.code;
  const inFocus = document.activeElement;

  switch (keyCode) {
    case KeyboardCode.SHIFT_LEFT:
    case KeyboardCode.SHIFT_RIGHT:
      thisKey = 'Shift';
      return;
    case KeyboardCode.CAPS_LOCK:
      capsLock = !capsLock;
      return;
    case KeyboardCode.META_LEFT:
    case KeyboardCode.META_RIGHT:
      thisKey = 'Meta';
      return;
    case KeyboardCode.B:              // looking for control-B to move mousentered group to "bottom"
      if (event.ctrlKey) {  // which is first in the SVG list
        if (thisGroup) {
          let cloneGroup = thisGroup.cloneNode(true);
          thisGroup.remove();
          clearEditElement(cloneGroup);
          svgLayer.firstChild.insertBefore(cloneGroup, svgLayer.firstChild.childNodes[1]);
        }
      }
    break;
    case KeyboardCode.T:              // looking for control-T to move mousentered group to "top"
      if (event.ctrlKey) {  // which is last in the SVG element list
        if (thisGroup) {
          let cloneGroup = thisGroup.cloneNode(true);
          thisGroup.remove();
          clearEditElement(cloneGroup);
          svgLayer.firstChild.appendChild(cloneGroup);
        }
      }
      break;
  }
  if ((cursorMode == drawMode.TEXT)) {
    event.preventDefault()
    updateSvgText(event);             // pass event or key
    return;
  }

  if (keyCode == KeyboardCode.ENTER) {    // added literal decimal value for chrome/safari
    switch (cursorMode) {
      case drawMode.POLYGON:
      case drawMode.POLYLINE:
      case drawMode.LINE:
      case drawMode.RECTANGLE:
      case drawMode.CIRCLE:
      case drawMode.ELLIPSE:
      case drawMode.CUBIC:
      case drawMode.QUADRATIC:
      case drawMode.DRAW:
        doMouseUp();
        return;
    }
  }

  if (
    keyCode == KeyboardCode.DELETE ||
    keyCode == KeyboardCode.BACKSPACE
  ) {
    if (event.shiftKey) {
      if (thisGroup) {
        let cloneGroup = thisGroup.cloneNode(true);
        thisGroup.remove();
        clearEditElement(cloneGroup);
        svgLayer.firstChild.appendChild(cloneGroup);
        clearLastGroup();
      }
      return;
    }

    if ((inFocus.tagName == 'BODY') || (inFocus.id == svgLayer.parentElement.id)) {
      return;
    }
  }
  if (KeyboardCode.ESC) {
    switch (cursorMode) {
      case drawMode.POLYGON, drawMode.POLYLINE:
        if (svgInProgress == cursorMode) {    // remove last point and reset previous point to dynamic
          deleteLastPoint(thisElement);
          return;
        }
    }
    return;
  }
};

function lookUpKey(event) {     // sort out the keyboard mess and return the key
  let eventKey = event.key;
  let thisKeyCode = event.keyCode;
  let Shifted = event.shiftKey;

  if (thisKeyCode == 0x14) {
    //var CapsLock = isCapsLockOn(event);
    capsLock = !capsLock;            // on keyDown and capsLock keyCode (= 20d or 0x14)
    return false;
  }
  let mapKey = _KEYCODE_MAP[thisKeyCode];   // from CapsLock.js, non-alphanumeric keys
  if (mapKey) {                             // existence mostly implies we caught one
    if (Shifted && _SHIFTMAP[mapKey]) {   // if there is a shifted version of this key
      return _SHIFTMAP[mapKey];             // and the shift key is down (not CapsLock)
    }
    return mapKey;                          // if not shift, return nominal key
  }
  if ((thisKeyCode > 0x2F) && (thisKeyCode < 0x3A)) {     // numeric key
    eventKey = String.fromCharCode(thisKeyCode);    // need mapping to us keyboard at minimum
    if (Shifted) {
      return _SHIFTMAP[eventKey];
    }
    return eventKey
  }
  if (((thisKeyCode > 0x3F) && (thisKeyCode < 0x5B)) || thisKeyCode == 0x20) {     // Alphabetic key (codes are upper case)
    eventKey = String.fromCharCode(thisKeyCode);    // need mapping to us keyboard at minimum
    if (capsLock) {
      if (isMac) {                          // for Apple, shiftKey does not affect CapsLock
        return eventKey.toUpperCase();      // so force CAPS on any Alpha
      } else {
        if (Shifted) {
          return eventKey.toLowerCase();    // shift and CapsLock implies lower case for Oranges
        } else {
          return eventKey.toUpperCase();    // do not invert sense of CapsLock
        }
      }
    } else {                                  // not caps lock
      if (Shifted) {
        return eventKey;
      }
      return eventKey.toLowerCase();
    }
  }
  return false;               // signal not printable
}

function doMouseUp() {
  svgInProgress = false;
  setElementMouseEnterLeave(thisGroup);
  //this.setCursorMode(drawMode.MOVE);

  thisBubble = null;
  thisElement = null;
  thisGroup = null;
}

SVGDraw.prototype.doubleClickHandler = function () {
  dblClick()
};

function dblClick() {
  if (
    cursorMode == drawMode.POLYGON ||
    cursorMode == drawMode.POLYLINE ||
    cursorMode == drawMode.TEXT
  ) {
    svgInProgress = false;
    switch (cursorMode) {
      case drawMode.POLYGON:
        deleteDuplicatePoints(thisElement);
        thisGroup.innerHTML = thisGroup.innerHTML.replace(drawMode.POLYLINE, drawMode.POLYGON).replace(drawMode.POLYLINE, drawMode.POLYGON);
        setElementMouseEnterLeave(thisGroup);
        break;
      case drawMode.POLYLINE:
        deleteDuplicatePoints(thisElement);
        setElementMouseEnterLeave(thisGroup);
        break;
    }
    if (cursorMode == drawMode.TEXT) {
      closeSvgText();
    }
    thisElement = null;
    thisGroup = null;
  }
}

SVGDraw.prototype.mouseWheelScrollHandler = function () {
  return function (event) {
    event.stopImmediatePropagation();
    event.stopPropagation();
    const deltaDiv = event.type == "DOMMouseScroll" // default for non-FireFox
      ? 100
      : 1000

    const delta = -parseInt(event.deltaY || -event.detail);
    const zoomDelta = delta / deltaDiv;
    const mousePosition = this._getMousePosition(event)
  
    this.state.mousePosition.x = mousePosition.x;      // fixed reference for mouse offset
    this.state.mousePosition.y = mousePosition.y;

    if (zoomDelta > 0) {
      this.zoomIn();
    } else {
      this.zoomOut();
    }
    return event.preventDefault() && false;
  }
};

function deleteDuplicatePoints(element) {
  let thesePoints = element.attributes['points'].value.trim();
  let splitPoints = thesePoints.split(' ');
  thesePoints = splitPoints[0] + ' ';
  for (let k = 1; k < splitPoints.length; k++) {
    // if (splitPoints[k] != splitPoints[k - 1]) {   // only keep this point
    //   thesePoints += splitPoints[k] + ' ';        // if it is "new"
    // }
    if (checkDuplicatePoints(splitPoints[k - 1], splitPoints[k])) {   // only keep this point
      thesePoints += splitPoints[k] + ' ';        // if it is "new"
    }
  }
  thisElement.attributes['points'].value = thesePoints;
}

function deleteLastPoint(element) {   // specific to <poly-> ESC key
  let thesePoints = element.attributes['points'].value.trim();
  let splitPoints = thesePoints.split(' ');
  thesePoints = splitPoints[0] + ' ';
  for (let k = 1; k < splitPoints.length - 1; k++) {
    if (splitPoints[k] != splitPoints[k - 1]) {   // only keep this point
      thesePoints += splitPoints[k] + ' ';        // if it is "new"
    }
  }
  thisElement.attributes['points'].value = thesePoints;
}

function checkDuplicatePoints (pxy, qxy) {    // return false if too close together
  let p = pxy.split(',')
  let q = qxy.split(',')
  const [px, py] = p
  const [qx, qy] = q

  if((Math.abs(px - qx) < 0.000001 * qx) && (Math.abs(py - qy) < 0.000001 * qy)){
    return false
  }
  return true
}

SVGDraw.prototype.apiSetMode = function(mode) {
  this.setCursorMode(mode)
}

function checkLeftoverElement() {       // this function is only called when svgInProgress is false (?)
  switch (cursorMode) {
    case drawMode.POLYLINE:
    case drawMode.POLYGON:
      // this seems to ONLY delete the last point, so disabled pending better treatment
//                    var thesePoints = thisElement.attributes['points'].value.trim();
//                    var splitPoints = thesePoints.split(' ');
//                    thesePoints = '';
//                    for (k = 0; k < splitPoints.length - 2; k++) {
//                        thesePoints += splitPoints[k] + ' ';
//                    }
//                    thisElement.attributes['points'].value = thesePoints;
      break;
//                    var thesePoints = thisElement.attributes['points'].value;
//                    var splitPoints = thesePoints.split(' ');
//                    thesePoints = '';
//                    for (k = 0; k < splitPoints.length - 2; k++) {
//                        thesePoints += splitPoints[k] + ' ';
//                    }
//                    thisElement.attributes['points'].value = thesePoints;
//                    break;
    case drawMode.CIRCLE:
      if (thisElement == null) return;
      if (((thisElement.attributes['cy'].value - thisElement.attributes['r'].value) < 0)     // off svgLayer
        || (thisElement.attributes['r'].value < 2))                                  // single click
      {
        clearLastGroup();
      }
      break;
    case drawMode.ELLIPSE:
      if (thisElement == null) return;
      if ((thisElement.attributes['cy'].value - thisElement.attributes['ry'].value) < 0) {
        clearLastGroup();
      }
      break;
    case drawMode.RECTANGLE:
      if (thisElement == null) return;
      if ((thisElement.attributes['height'].value) < 0) {
        clearLastGroup();
      }
      break;
    case drawMode.LINE:
      if ((thisElement.attributes['y2'].value) < 0) {
        clearLastGroup();
      }
      break;
    case 'text':
      finishTextGroup();
      break;
  }
}

function clearLastGroup() {
  const xlt = document.getElementById("xlt")

  if (xlt.childElementCount > 1) {              // don't remove the base image
    const group = xlt.lastChild
    group.removeEventListener('mouseenter', mouseEnterFunction); // disable mousenter on real element's containing group
    group.removeEventListener('mouseleave', mouseLeaveFunction); // disable mouseleaver on real element's containing group
    group.remove();
    waitElement = false;
  }
}

function clearThisGroup(group) {
  if (group) {
    clearEditElement(group);
    group.removeEventListener('mouseenter', mouseEnterFunction); // disable mouseenter on real element's containing group
    group.removeEventListener('mouseleave', mouseLeaveFunction); // disable mouseleaver on real element's containing group
    group.remove();
  }
}

function updateSvgText(event) {                       // modified to eliminate mousetrap
  thisKey = event.key;                            // this attribute only works for FireFox
  let thisKeyCode = event.keyCode;
  //if (thisKey == undefined) {                   // undefined if not FireFox
  thisKey = lookUpKey(event);     // consolidate
  if (thisElement == null) {      // this can occur if <text> element just completed and no new one started
    if (thisKeyCode == 8) {       // prevent Backspace from invoking BACK browser function
      event.preventDefault();
    }
    return false
  }
  if ((event.keyCode == 13) && (event.shiftKey)) {      // terminate this text block chain on Shift-Enter
    finishTextGroup();
    return false;
  }
  let text4svgValue;     // text4svg is string
  text4svgValue = text4svg.slice(0, text4svg.length - 1);   // remove text cursor (underscore)

  if (thisKeyCode > 31) {       // space or other printing character
    text4svg = text4svgValue + thisKey + '_';
  }
  if (thisKeyCode == 8) {
    text4svg = text4svgValue.slice(0, text4svgValue.length - 1) + '_';
    event.preventDefault();       // prevent Backspace from invoking BACK browser function
  }
  if (!thisKey && (thisKeyCode != 13) && (thisKeyCode != 8)) {
    return;
  }   // only pass printing keys, Delete, and Return/Enter
  thisElement.innerHTML = parseHTML(text4svg);           // this needs to be pair-parsed into ' '&nbsp;
  thisElement.attributes['stroke'].value = stroke;       // allow in-line whole line color/font/size over-ride
  thisElement.attributes['style'].value = 'font-family: ' + fontFamily + '; fill: ' + stroke + ';';    //  including fill
  thisElement.attributes['font-size'].value = fontSize;
  let nextX = thisElement.attributes['x'].value;
  let nextY = parseInt(thisElement.attributes['y'].value) + parseInt(fontSize);
  let nextLine = thisElement.cloneNode();
  if (event.keyCode == 13) {      // line feed on ENTER/CR -- termination on shift-Enter/Return already picked off
    thisElement.innerHTML = parseHTML(text4svgValue.slice(0, text4svgValue.length));   // remove cursor at end of line
    nextLine.attributes['x'].value = nextX;
    nextLine.attributes['y'].value = nextY;
    thisElement.parentElement.appendChild(nextLine);
    thisElement = nextLine;
    thisElement.innerHTML = '_';
    text4svg = '_';
    event.preventDefault();
  }
}

function parseHTML(spaceText) {         // morphs multiple spaces in string to HTML equivalent
  let result = spaceText.replace(/  /g, ' &nbsp;');   // two consecutive spaces become space+nonbreakingspace
  result = result.replace(/</g, '&lt;').replace(/>/g, '&gt');
  return result;

}

function finishTextGroup() {             // uses global variable thisGroup for <text>.parent
  // line/group is complete except for text cursor
  removeCursorFromSvgText();             // if thisElement is empty, it will disappear through this call
  if (!thisGroup) {
    return;
  }
  if (thisGroup.hasChildNodes()) {       // thisGroup may contain more that one text element, one for each line
    setElementMouseEnterLeave(thisGroup);   // if this group is to be persisted, set the mouse listeners for future edit
  } else {                                 // if no child nodes, it is empty and should be
    thisGroup.remove();                  // removed
  }
  closeSvgText();
  // checkLeftoverElement();         // //////////// does not consider <text> === useless
  thisGroup = null;
}

function removeCursorFromSvgText() {            //   ///////////  does this do enough?
  if (!thisElement) {
    return;
  }           // in case called again after end condition
  if (thisElement.parentElement) {               // check valid element
    if (thisElement.parentElement.lastChild.innerHTML == '_') {    // if ONLY underscore cursor
      thisElement.parentElement.lastChild.remove();                // remove the <text> element
      text4svg = '_';                                 // initialize for later
      thisElement = null;                             // kill the element
    } else {
      if (svgInProgress == 'text') {      //   ///////////////  newly added stronger condition
        thisElement.innerHTML = parseHTML(text4svg.slice(0, text4svg.length - 1));   // remove cursor at end of line
        if (thisElement.innerHTML == '') {
          thisElement.remove();
          thisElement = null;
        }
        if (thisGroup.lastChild.tagName == SVGType.GROUP) {        // this is to detect a leftover bubble
          thisGroup.lastChild.remove;
        }
      }
    }

  }
}

function closeSvgText() {
  text4svg = '_';
  thisSVGpoints = [];               // clear the container
  thisElement = null;
  svgInProgress = false;
}

function collectSVG(isVerbatim) {   // verbatim true includes all markup, false means stripped
  let clonedSVG = svgLayer.cloneNode(true);
  let thisXLT = clonedSVG.firstChild;

  if (!isVerbatim) {
    clonedSVG.removeAttribute('height');
    clonedSVG.removeAttribute('width');
    clonedSVG.firstChild.attributes['transform'].value = 'translate(0, 0) scale(1)';
    thisXLT.children['xltImage'].remove();
  }
  let thisG;
  let terminus = thisXLT.childElementCount;
  let i;
  for (i = 0; i < terminus; i++) {              // i will range over the remaining children count
    thisG = thisXLT.childNodes[i];              // probably should be firstChild since iteratively
    if (!isVerbatim) {    // new wrinkle for arrow and similar groups
      if (thisG.attributes.class) {
        thisG.removeAttribute('id');
      }
    }
  }
  return clonedSVG;        //  oops, this was too easy
}

function getBareSVG(noGroups) {   //  stripped
  const clonedSVG = svgLayer.cloneNode(true)

  clonedSVG.removeAttribute('height');
  clonedSVG.removeAttribute('width');
  clonedSVG.removeAttribute('id');

  const thisXLT = clonedSVG.firstChild;
  thisXLT.removeAttribute('id');
  thisXLT.removeAttribute('transform');
  thisXLT.children['xltImage'].remove();

  const terminus = thisXLT.childElementCount;
  const groups = [
    drawMode.ARROW,
    drawMode.CUBIC,
    drawMode.QUADRATIC,
    drawMode.TEXT
  ]

  for (let i = 0; i < terminus; i++) {              // i will range over the remaining children count
    const thisG = thisXLT.childNodes[i];              // probably should be firstChild since iteratively
    if (thisG.attributes.class) {
      stripElement(thisG)
      if (noGroups && !(groups.includes(thisG.attributes.class.value))) {
        thisG.outerHTML = thisG.innerHTML;
      }
    }
  }

  return clonedSVG
}

function stripElement(element) {
  if (element.hasChildNodes()) {
    for (let i = 0; i < element.childElementCount; i++) {
      stripElement(element.childNodes[i])
    }
  }

  element.removeAttribute('id');
  element.removeAttribute('stroke');
  element.removeAttribute('stroke-width');
  element.removeAttribute('stroke-opacity');
  element.removeAttribute('stroke-linecap');
  element.removeAttribute('fill');
  element.removeAttribute('fill-opacity');
  element.removeAttribute('font-family');
  element.removeAttribute('font-size');
  element.removeAttribute('style');

  return element
}

function console_log(logFlag, message) {
  if(logFlag) {
    console.log(message);
    return true
  }
  return false
}


export {
  drawMode,
  SVGDraw
}
