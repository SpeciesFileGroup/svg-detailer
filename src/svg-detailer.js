// construct svgLayer from container's attributes and data-attributes
/*
Revised version of svg-detailer/svgDraw 06MAR2020
 */
var xC = 0;
var yC = 0;
var cursorMode = "MOVE";
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
var svgOffset;              // set on document ready ////////// test against fully packaged code
var svgMenu;                // object built to be the element type selection and control menu


var isMac = /Mac/.test(navigator.platform);             // store whether we are running on a Mac
var capsLock = false;
var thisKey;
var firstKey;
var secondKey;
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

var savedCursorMode = cursorMode;

var thisElement;              // should be the current element

var thisBubble;             // the bubble mousedown-ed in the currently edited element

var svgInProgress = false;

var lastMouseX;
var lastMouseY;
var idCount = 0;

var enable_log  = false;    // default to NOT log debug output

// var logMouse = false;       // debug
// var logStatus = false;      // flags
// var logIndex = 0;           // limit counter for above
var _MAP = {
  8: 'backspace',
  9: 'tab',
  13: 'enter',
  16: 'shift',
  17: 'ctrl',
  18: 'alt',
  20: 'capslock',
  27: 'esc',
  32: 'space',
  33: 'pageup',
  34: 'pagedown',
  35: 'end',
  36: 'home',
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
  45: 'ins',
  46: 'del',
  91: 'meta',
  93: 'meta',
  224: 'meta'
};
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
var _drawModes = [
  'clear', 'polygon', 'polyline', 'line', 'arrow',
  'rectangle', 'circle', 'ellipse', 'cubic', 'quadratic',
  'draw', 'text', 'MOVE'
];

function SVGDraw(containerID) {     // container:<svgLayer>:<xlt>:<svgImage>

  svgImage = new Image();
  thisSVGpoints = [];            // collect points as [x,y]

  fontSize = 50;
  fontFamily = 'Verdana';


  savedCursorMode = cursorMode;

  var cWidth = parseInt(containerID.attributes['data-width'].value);        // this seems too explicit
  var cHeight = parseInt(containerID.attributes['data-height'].value);      // shouldn't this be inherited from parent?


  svgImage.src = containerID.attributes['data-image'].value;
  var self = this;      ////////////// prior "this" usages below converted to "self" through end of svgImage.onload fn
  svgImage.onload = function (event) {

    svgOffset = {
      top: containerID.offsetTop,   // .split('px')[0],
      left: containerID.offsetLeft  // .split('px')[0]
    };
    //indicateMode(cursorMode);

    xC = 0;
    yC = 0;
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
    containerID.appendChild(svgLayer);

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

    lastMouseX = baseZoom * svgImage.width / 2;         // center of image
    lastMouseY = baseZoom * svgImage.height / 2;
    // insert the svg base image into the transformable group <g id='xlt'>
    let xlt = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    xlt.setAttributeNS(null, 'id', 'xlt');
    xlt.setAttributeNS(null, 'transform', 'translate(0,0) scale(' + parseFloat(zoom) + ')');
    svgLayer.appendChild((xlt));
    let xltImage = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    xltImage.setAttributeNS(null, 'id', "xltImage");
    xltImage.setAttributeNS(null, 'x', "0");
    xltImage.setAttributeNS(null, 'y', "0");
    xltImage.setAttributeNS(null, 'width', svgImage.width.toString());
    xltImage.setAttributeNS(null, 'height', svgImage.height.toString());
    xltImage.setAttributeNS(null, 'preserveAspectRatio', "none");
    xltImage.setAttributeNS('http://www.w3.org/1999/xlink', 'href', svgImage.src);
    xlt.appendChild(xltImage);

    SVGDraw.prototype.buildSVGmenu(containerID);       // populate the button-ology from the data element description (mostly)

    document.onkeydown = self.keyHandler();   /////////////// This is probably tooo broad   /////////////////
    document.onkeyup = self.keyUpHandler();
    //Mousetrap.bind('enter', self.doubleClickHandler());     // invokes handler vs handler's returned function

    zoom_trans(0, 0, zoom);             //////////// IMPORTANT !!!!!!!!!!!

    setCursorMode('MOVE');

    self.renderFunction = self.updateSvgByElement;
    //self.touchSupported = Modernizr.touch;
    self.touchSupported = 'ontouchstart' in document.documentElement;   // thanks, Edd Turtle !
    self.containerID = containerID;
    self.lastMousePoint = {x: 0, y: 0};

    if (self.touchSupported) {
      self.mouseDownEvent = "touchstart";
      self.mouseMoveEvent = "touchmove";
      self.mouseUpEvent = "touchend";
    } else {
      self.mouseDownEvent = "mousedown";
      self.mouseMoveEvent = "mousemove";
      self.mouseUpEvent = "mouseup";

      svgLayer.ondblclick = self.doubleClickHandler();       // replace jquery reference

      // svgLayer.onwheel = self.mouseWheelScrollHandler();        // replace jquery reference
      /////////////////// TEMPORARILY SUPPRESS WHEEL SCROLL
    }
    svgLayer.onmousedown = self.onSvgMouseDown();       // replace jquery reference
    self.mouseMoveHandler = self.onSvgMouseMove;
    self.mouseUpHandler = self.onSvgMouseUp;

    svgLayer.onmouseup = self.mouseUpHandler();       // replace jquery reference

    svgLayer.onmousemove = self.mouseMoveHandler();       // replace jquery reference
  };
}

SVGDraw.prototype.onSvgMouseDown = function () {    // in general, start or stop element generation on mouseDOWN (true?)
  // BUT for PATH, line and MOVE, stop on mouseUP
  let self = this;
  return function (event) {
    self.updateMousePosition(event);
    if (svgInProgress != false && svgInProgress != cursorMode) {    // terminate in progress svg before continuing
      if (svgInProgress == 'SHIFT') {
        return;                       //  ///////// should these be returning false?
      } else {
        svgInProgress = cursorMode;       //  ??
        return;
      }
    }
    if (thisGroup) {
      if (thisGroup.childElementCount > 1 && cursorMode != 'text') {   // this is the case where there is a click on a mousentered
        // thisGroup.lastChild.remove();
        clearEditElement(thisGroup);
        // setCursorMode(savedCursorMode);       // because we know specifically that we mouseentered an element
        return false;
      }
    }
    if (cursorMode == 'polygon') {     // mouseDown sets initial point, subsequent points set by mouseDown after mouseUp
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        savedCursorMode = cursorMode;     // plant this to prevent immediate post-creation clearing
        thisSVGpoints[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];
        let group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        let newGroupID = 'g' + getIDcount().toString();
        group.setAttributeNS(null, 'id', newGroupID);
        group.setAttributeNS(null, 'class', cursorMode);
        thisGroup = group;
        document.getElementById("xlt").appendChild(group);
        let element = newElement('polyline');        //YES, I KNOW... polyline behavior mimics google maps better

        group.appendChild(element);
        thisElement = group.children[0];
        element.setAttributeNS(null, 'points', thisSVGpoints[0][0].toFixed(4).toString()
          + ',' + thisSVGpoints[0][1].toFixed(4).toString() + ' '
          + thisSVGpoints[0][0].toFixed(4).toString()
          + ',' + thisSVGpoints[0][1].toFixed(4).toString() + ' ');      // start x,y for both points initially
        svgInProgress = cursorMode;     // mark in progress
      } else {      // this is the fixation of this last point, so DON'T dissociate mouse move handler
        self.updateMousePosition(event);
        let thesePoints = thisElement.attributes['points'].value;   // to trim or not to trim?  if so, multiple implications here
        let thisPoint = ((lastMouseX - xC) / zoom).toFixed(4).toString()
          + ',' + ((lastMouseY - yC) / zoom).toFixed(4).toString() + ' ';
        thisElement.attributes['points'].value = thesePoints.concat(thisPoint);
      }
    }
    if (cursorMode == 'polyline') {    // mouseDown sets initial point, subsequent points set by mouseDown after mouseUp
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        savedCursorMode = cursorMode;     // plant this to prevent immediate post-creation clearing
        thisSVGpoints[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];
        let group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        thisGroup = group;
        let newGroupID = 'g' + getIDcount().toString();
        group.setAttributeNS(null, 'id', newGroupID);
        group.setAttributeNS(null, 'class', cursorMode);
        document.getElementById("xlt").appendChild(group);
        let element = newElement('polyline');

        group.appendChild(element);
        thisElement = group.children[0];
        element.setAttributeNS(null, 'stroke-linecap', 'round');
        element.setAttributeNS(null, 'points', thisSVGpoints[0][0].toFixed(4).toString()
          + ',' + thisSVGpoints[0][1].toFixed(4).toString() + ' '
          + thisSVGpoints[0][0].toFixed(4).toString()
          + ',' + thisSVGpoints[0][1].toFixed(4).toString() + ' ');      // start x,y for both points initially
        svgInProgress = cursorMode;     // mark in progress
      } else {      // this is the fixation of this last point, so DON'T dissociate mouse move handler
        self.updateMousePosition(event);
        let thesePoints = thisElement.attributes['points'].value;
        let thisPoint = ((lastMouseX - xC) / zoom).toFixed(4).toString()
          + ',' + ((lastMouseY - yC) / zoom).toFixed(4).toString() + ' ';
        thisElement.attributes['points'].value = thesePoints.concat(thisPoint);
      }
    }
    if (cursorMode == 'rect') {     // mouseDown starts creation, after drag, mouseUp ends
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        savedCursorMode = cursorMode;     // plant this to prevent immediate post-creation clearing
        thisSVGpoints[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];
        let group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        let newGroupID = 'g' + getIDcount().toString();
        group.setAttributeNS(null, 'id', newGroupID);
        group.setAttributeNS(null, 'class', cursorMode);
        document.getElementById("xlt").appendChild(group);
        let element = newElement('rect');

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
    if (cursorMode == 'line') {     //  mouseDown starts creation, after, drag mouseUp ends
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        savedCursorMode = cursorMode;     // plant this to prevent immediate post-creation clearing
        thisSVGpoints[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];
        let group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        thisGroup = group;
        let newGroupID = 'g' + getIDcount().toString();
        group.setAttributeNS(null, 'id', newGroupID);
        group.setAttributeNS(null, 'class', cursorMode);
        document.getElementById("xlt").appendChild(group);
        let element = newElement('line');

        group.appendChild(element);
        thisElement = group.children[0];
        element.setAttributeNS(null, 'x1', (thisSVGpoints[0][0]).toFixed(4));      // start x
        element.setAttributeNS(null, 'y1', (thisSVGpoints[0][1]).toFixed(4));      // start y
        element.setAttributeNS(null, 'x2', (thisSVGpoints[0][0]).toFixed(4));      // end x
        element.setAttributeNS(null, 'y2', (thisSVGpoints[0][1]).toFixed(4));      // end y
        svgInProgress = cursorMode;     // mark in progress
      } else {      // this is the terminus of this instance, so dissociate mouse move handler
        svgInProgress = false;
        setElementMouseEnterLeave(thisElement);
        // unbindMouseHandlers(self);
      }
    }
    if (cursorMode == 'arrow') {     //  mouseDown starts creation, after, drag mouseUp ends
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        savedCursorMode = cursorMode;     // plant this to prevent immediate post-creation clearing
        thisSVGpoints[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];
        let group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        thisGroup = group;
        let newGroupID = 'g' + getIDcount().toString();
        group.setAttributeNS(null, 'id', newGroupID);
        group.setAttributeNS(null, 'class', cursorMode);
        document.getElementById("xlt").appendChild(group);
        let element = newElement('line');

        group.appendChild(element);
        thisElement = group.children[0];
        element.setAttributeNS(null, 'x1', (thisSVGpoints[0][0]).toFixed(4));      // start x
        element.setAttributeNS(null, 'y1', (thisSVGpoints[0][1]).toFixed(4));      // start y
        element.setAttributeNS(null, 'x2', (thisSVGpoints[0][0]).toFixed(4));      // end x
        element.setAttributeNS(null, 'y2', (thisSVGpoints[0][1]).toFixed(4));      // end y
        svgInProgress = cursorMode;     // mark in progress
      } else {      // this is the terminus of this instance, so dissociate mouse move handler
        svgInProgress = false;
        setElementMouseEnterLeave(thisElement);
        // unbindMouseHandlers(self);
      }
    }
    if (cursorMode == 'circle') {     // mouseDown    // modified to use common element for handlers
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        if (thisGroup != null) {      //  ////////////// ???
          clearEditElement(thisGroup);    // this group is the one with bubbles, to be obviated
        }
        savedCursorMode = cursorMode;     // plant this to prevent immediate post-creation clearing
        thisSVGpoints[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];
        let group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        let newGroupID = 'g' + getIDcount().toString();
        group.setAttributeNS(null, 'id', newGroupID);
        group.setAttributeNS(null, 'class', cursorMode);
        document.getElementById("xlt").appendChild(group);
        let element = newElement(cursorMode);      // new generalized method

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
    if (cursorMode == 'ellipse') {     // mouseDown
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        savedCursorMode = cursorMode;     // plant this to prevent immediate post-creation clearing
        thisSVGpoints[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];
        let group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        thisGroup = group;
        let newGroupID = 'g' + getIDcount().toString();
        group.setAttributeNS(null, 'id', newGroupID);
        group.setAttributeNS(null, 'class', cursorMode);
        document.getElementById("xlt").appendChild(group);
        let element = newElement('ellipse');

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
    if (cursorMode == 'draw') {     // mouseDown
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        savedCursorMode = cursorMode;     // plant this to prevent immediate post-creation clearing
        thisSVGpoints[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];
        let group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        thisGroup = group;
        let newGroupID = 'g' + getIDcount().toString();
        group.setAttributeNS(null, 'id', newGroupID);
        group.setAttributeNS(null, 'class', cursorMode);
        document.getElementById("xlt").appendChild(group);
        //for (j = 0; j < thisSVGpoints.length; j++) {              // for text mode there is only one
        let element = newElement('polyline');

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
    if ((cursorMode == 'cubic') || (cursorMode == 'quadratic')) {     // mouseDown
                                                                      // The cubic Bezier curve requires non-symbolic integer values for its path parameters.
                                                                      // This will necessitate the dynamic reconstruction of the "d" attribute using parseInt
                                                                      // on each value.  The edit sister group will have 4 bubbles, ids: p1, c1, c2, p2 to decode
                                                                      // the control points' mousemove action.  Make control points the same as the endpoints initially,
                                                                      // then annotate with bubbles to shape the curve.  This is an extra step more than other elements.
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        savedCursorMode = cursorMode;     // plant this to prevent immediate post-creation clearing
        thisSVGpoints[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];
        let group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        thisGroup = group;
        let newGroupID = 'g' + getIDcount().toString();
        group.setAttributeNS(null, 'id', newGroupID);
        group.setAttributeNS(null, 'class', cursorMode);
        document.getElementById("xlt").appendChild(group);
        let element = newElement('path');

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
    if (cursorMode == "text") {     // mouseDown - could be initial click, revised position click, or preemie
      let group
      if (thisElement) {
        finishTextGroup();
      }
      if (svgInProgress == false) {
        thisSVGpoints[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];
        savedCursorMode = cursorMode;     // plant this to prevent immediate post-creation clearing
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
    if (cursorMode == 'MOVE') {     // mouseDown
      if (svgInProgress == false) {
        svgInProgress = cursorMode;
      }
    }
    waitElement = false;      //    ///////////   new code to allow creation start within extant element
    return event.preventDefault() && false;
  }
};        //// end of onSvgMouseDown

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
  if (cursorMode == 'cubic') {
    return "M " + pathPoint(x1, y1) + " C " + curvePoint(cx1, cy1) + curvePoint(cx2, cy2) + pathPoint(x2, y2);
  } else return "M " + pathPoint(x1, y1) + " Q " + curvePoint(cx1, cy1) + pathPoint(x2, y2);
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
    ;
    console_log(enable_log, group.attributes.class.value + ' ' + msg);
    thisGroup = group;        // there is probably no creation activity
  }
  //if (group.firstChild.tagName != cursorMode) {    // start editing an element not in the current mode
  savedCursorMode = cursorMode;   // don't wait for actual action on bubble
  if (group.firstChild) {
    if (group.firstChild.tagName != 'path') {
      if (group.attributes.class) {                   // class atribute existence
        cursorMode = group.attributes.class.value;
      } else {
        cursorMode = group.firstChild.tagName;
      }
    } else {                  // now that there are both cubic and quadratic curves, we must detect this one's class
      cursorMode = 'cubic';   // ///////// finesse path
      if (group.firstChild.attributes.d.value.indexOf('C ') == -1) {   // is the path quadratic because it's not cubic?
        cursorMode = 'quadratic';
      }
    }
  }
  svgInProgress = false;      //  ////////// we have set bubbles but no action taken yet
  indicateMode(cursorMode);
  //}
  if (group.childNodes.length > 1) {   // do I have bubbles? possibly? (might be text)
    if (group.lastChild.tagName == 'g') {
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
    if ((group.lastChild.tagName == 'circle') || (group.lastChild.tagName == 'g')) { // poly- bubbles have a child group
      group.lastChild.remove();         // this is the group of bubbles (and maybe nested ones) if not just a SHIFT bubble
      thisBubble = null;
      cursorMode = 'MOVE';    // was savedCursorMode;   // on exit of edit mode, restore
      indicateMode(cursorMode);
      svgInProgress = false;
      thisElement = null;
      thisGroup = null;
    } else {
      if (group.firstChild.tagName == 'text') {
        if (svgInProgress == 'text') {
          finishTextGroup();
        }
      }
    }
  }
  //group./*firstChild.*/attributes['onmouseenter'].value = "this.firstChild.attributes['stroke-width'].value = '" + 1.5 * strokeWidth + "'; setEditElement(this.firstChild);"    // replant the listener in the real element
  setElementMouseEnterLeave(group);
  cursorMode = 'MOVE';    // was savedCursorMode;   // on exit of edit mode, restore
  indicateMode(cursorMode);
  svgInProgress = false;
  thisElement = null;
  thisGroup = null;
//  eliminated savedCursorMode = 'MOVE';
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

function exitEditPoint(group) {    // services mouseUp from SIZE/point bubble
  // reset all bubbles for this element
  if (group == null) {
    console_log(enable_log, 'fault')
  }
  while ((group.childElementCount > 1) && (group.lastChild.tagName == 'g')) {             // changed from group.childElementCount > 1
    group.lastChild.remove();                        // eliminates all bubbles
  }
  svgInProgress = false;  ///////////////
  thisBubble = null;
  //cursorMode = "MOVE";  //was savedCursorMode; ////////////// actually editing element unchains creation of this class
  setCursorMode("MOVE");
  setElementMouseEnterLeave(group);
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
  //thisParent = element;                           // group containing real element and the bubbles group
  let group = bubble.parentNode.parentNode;          // set group for mousemove
  thisGroup = group;          // set group for mousemove
  thisElement = group.firstChild;
  thisBubble = group.lastChild.firstChild;      // this is the center/first bubble
  cursorMode = thisElement.tagName;
  if ((cursorMode == 'circle') || (cursorMode == 'ellipse'))
    {
      let endK = group.lastChild.childElementCount;        // total bubbles, leave the first one (thisElement)
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
  if (thisBubble == bubble) {   // this condition implies we mouseDowned on the point we are changing
// breakpoint convenience point
  }
  thisBubble = bubble;
  let group = bubble.parentNode.parentNode;          // set group for mousemove
  thisGroup = group;
  thisElement = group.firstChild;    // this is the real element
  if (parseInt(bubble.id) == bubble.parentNode.childElementCount - 1) {   // last point/bubble?
    thisBubble = bubble;
  }
  if (bubble.parentNode.lastChild.tagName == 'g') {
    bubble.parentNode.lastChild.remove(); // /////////// this is the right place: remove insert point bubbles
  }
  if (thisGroup.attributes.class) {
    cursorMode = thisGroup.attributes.class.value;
  } else {
    cursorMode = thisElement.tagName;
  }
  group.removeEventListener('mouseenter', mouseEnterFunction)
  group.removeEventListener('mouseleave', mouseLeaveFunction)
  // bubble.attributes['onmousedown'].value = '';  // cascade to onSvgMouseDown
  bubble.removeEventListener('mousedown', (event) => {
  })
  svgInProgress = 'POINT';                     // so we have an active element, and it has been marked in progress
  // look for mousedown in handler for circle to transition to rubber band mode
}                                       // use mouseup or mousedown to terminate radius drag

function setNewPointElement(bubble) {     // this inserts the new point into the <poly.. element
  if (thisBubble == bubble) {   // this condition implies we mouseDowned on the point we are INSERTING
    let BreakHere = true;    // /////////  VERY PRELIM
  }
  thisBubble = bubble;
  let group = bubble.parentNode.parentNode.parentNode;          // set group for mousemove handler
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
  let splitPoints = element.attributes['points'].value.trim().split(' ');
  let thesePoints = '';
  let insertionPoint = parseInt(bubble.id);
  let thisPoint = bubble.attributes['cx'].value + ',' + bubble.attributes['cy'].value;
  for (let k = 0; k < splitPoints.length; k++) {
    thesePoints += splitPoints[k] + ' ';
    if (k == insertionPoint) {
      thesePoints += thisPoint + ' ';
    }
  }
  return thesePoints;
}

function createBubbleGroup(group) {
  let svgAttrs = {};
  let thisX;
  let thisY;
  let splitPoints;
  let nextX;
  let nextY;
  if(!group) {
    console_log(enable_log, 'group arg null, thisGroup=' + thisGroup)
  }
  let element = group.firstChild;
  svgAttrs = getModel(element.tagName);
  if (element.tagName != 'path') {    // /////// skip this step for path exception
    for (let key in svgAttrs) {     // collect basic (numeric) attributes for positioning and extent
      svgAttrs[key] = getAttributeValue(element, key);       // collect this numeric attribute
    }
  }
  let bubbleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  // var bubble;

  switch (element.tagName) {
    case 'circle':    // 1 relocation bubble, 4 compass-point resize bubbles (flagged SHIFT and SIZE respecively)
      bubbleGroup.setAttributeNS(null, 'class', 'bubbles');
      let cx = svgAttrs['cx'];
      let cy = svgAttrs['cy'];
      let cr = svgAttrs['r'];
      bubbleGroup.appendChild(createShiftBubble(cx, cy, 'shift'));    // this is the center point of both bubble and circle
      bubbleGroup.appendChild(createSizeBubble(cr + cx, cy, 'E'));    // this is the E resize point
      bubbleGroup.appendChild(createSizeBubble(cx, cr + cy, 'S'));    // this is the S resize point
      bubbleGroup.appendChild(createSizeBubble(cx - cr, cy, 'W'));    // this is the W resize point
      bubbleGroup.appendChild(createSizeBubble(cx, cy - cr, 'N'));    // this is the N resize point
      return bubbleGroup;
    case 'ellipse':    // 1 relocation bubble, 4 compass-point resize bubbles (flagged SHIFT and SIZE respecively)
      cx = svgAttrs['cx'];
      cy = svgAttrs['cy'];
      let rx = svgAttrs['rx'];
      let ry = svgAttrs['ry'];
      bubbleGroup.appendChild(createShiftBubble(cx, cy, 'shift'));    // this is the center point of both bubble and circle
      bubbleGroup.appendChild(createSizeBubble((cx + rx * 0.707), (cy + ry * 0.707), 'SE'));    // this is the SE resize point
      bubbleGroup.appendChild(createSizeBubble((cx + rx * 0.707), (cy - ry * 0.707), 'NE'));    // this is the NE resize point
      bubbleGroup.appendChild(createSizeBubble((cx - rx * 0.707), (cy - ry * 0.707), 'NW'));    // this is the NW resize point
      bubbleGroup.appendChild(createSizeBubble((cx - rx * 0.707), (cy + ry * 0.707), 'SW'));    // this is the SW resize point
      return bubbleGroup;
    case 'rect':
      let x = svgAttrs['x'];
      let y = svgAttrs['y'];
      let w = svgAttrs['width'];
      let h = svgAttrs['height'];
      bubbleGroup.appendChild(createShiftBubble(x, y, 'shift'));     // this is the rectangle origin, anomalous as it may be
      bubbleGroup.appendChild(createSizeBubble(x + w, y + h));    // this is the resize point
      return bubbleGroup;
    case 'line':
      let x1 = svgAttrs['x1'];
      let y1 = svgAttrs['y1'];
      let x2 = svgAttrs['x2'];
      let y2 = svgAttrs['y2'];
      bubbleGroup.appendChild(createShiftBubble((x2 + x1) / 2, (y2 + y1) / 2, 'shift'));    // this is the move line point
      bubbleGroup.appendChild(createPointBubble(x1, y1, 'x1-y1'));     // this is the 1st line coordinate
      bubbleGroup.appendChild(createPointBubble(x2, y2, 'x2-y2'));    // this is the 2nd (terminal) line point
      return bubbleGroup;
    case 'path':           // this is a MAJOR EXCEPTION to the other cases, used for curve !! articulate for type !!
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
    case 'polygon':
    case 'polyline':      // create a parallel structure to the point attr, using its coords
      let thesePoints = element.attributes['points'].value.trim();      // trim to eliminate extraneous empty string
      splitPoints = thesePoints.split(' ');
      let thisPoint = splitPoints[0].split(',');   // prime the pump for iteration
      thisX = parseFloat(thisPoint[0]);
      thisY = parseFloat(thisPoint[1]);
      let xAve = 0;
      let yAve = 0;
      let nextPoint;                      // nextX,nextY these are used to bound and calculate the intermediate
      for (let k = 0; k < splitPoints.length; k++) {    // append this point and an intermediary point
        xAve += thisX;    // simple computation
        yAve += thisY;    // of center-ish point
        if (k < splitPoints.length - 1) {     // since we are looking ahead one point
          nextPoint = splitPoints[k + 1].split(',');     // only add intermediate point if we are not at the last point
          nextX = parseFloat(nextPoint[0]);
          nextY = parseFloat(nextPoint[1]);
          thisX = nextX;
          thisY = nextY;
        }
      }
      thisX = xAve / splitPoints.length;
      thisY = yAve / splitPoints.length;
      bubbleGroup.appendChild(createShiftBubble(thisX, thisY, 'shift'));

      // insert new point bubbles in separate parallel group
      let newBubbleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      thisX = parseFloat(thisPoint[0]);
      thisY = parseFloat(thisPoint[1]);
      for (let k = 0; k < splitPoints.length; k++) {    // append this point and an intermediary point
        //thisPoint  = splitPoints[k].split(',');
        bubbleGroup.appendChild(createPointBubble(thisX, thisY, k.toString()));   // add the vertex point
        if (k < splitPoints.length - 1) {     // since we are looking ahead one point
          nextPoint = splitPoints[k + 1].split(',');     // only add intermediate point if we are not at the last point
          nextX = parseFloat(nextPoint[0]);
          nextY = parseFloat(nextPoint[1]);
          newBubbleGroup.appendChild(createNewPointBubble(0.5 * (thisX + nextX), 0.5 * (thisY + nextY), k.toString() + '.5'));
          // ///////// watch for hierarchicial misplacement
          thisX = nextX;
          thisY = nextY;
        }
      }

      if (element.tagName == 'polygon') {       // additional step for polygon, since there is an implicit closure
        thisPoint = splitPoints[0].split(',');   // get the first point again
        thisX = parseFloat(thisPoint[0]);
        thisY = parseFloat(thisPoint[1]);
        let thisID = (splitPoints.length - 1).toString() + '.5';
        newBubbleGroup.appendChild(createNewPointBubble(0.5 * (thisX + nextX), 0.5 * (thisY + nextY), thisID));
      }
      bubbleGroup.appendChild(newBubbleGroup);   // add the new point insertion bubbles
      return bubbleGroup;
    case 'text':
      thisX = svgAttrs['x'];
      thisY = svgAttrs['y'];
      bubbleGroup.appendChild(createShiftBubble(thisX, thisY, 'shift'));
      return bubbleGroup;
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
  bubble.addEventListener('mouseup', (event) => {
    exitEditPoint(thisGroup)
  });
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
  bubble.addEventListener('mouseup', (event) => {
    exitEditPoint(thisGroup)
  });
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
  bubble.addEventListener('mouseup', (event) => {
    exitEditPoint(event.target.parentElement.parentElement)
  });
  bubble.setAttributeNS(null, 'id', id);    // use this identifier to attach cursor in onSvgMouseMove
                                            // will take the form: 'c1', 'c2' for <path-...>
  return bubble;
}

function createControlLine(x1, y1, x2, y2, id) {
  let line = newElement('line');
  line.setAttributeNS(null, 'x1', x1);
  line.setAttributeNS(null, 'y1', y1);
  line.setAttributeNS(null, 'x2', x2);
  line.setAttributeNS(null, 'y2', y2);
  line.setAttributeNS(null, 'id', id);
  line.setAttributeNS(null, 'stroke-width', '1');
  return line;
}

function createBoundsPoly(coords) {        // used by createBubbleGroup.path
  let poly = newElement('polyline');
  poly.setAttributeNS(null, 'id', 'poly');
  poly.setAttributeNS(null, 'points', getCurvePoints(coords));
  poly.setAttributeNS(null, 'stroke-opacity', '0.0');
  return poly;
}

function createBubbleStub(offsetX, offsetY) {   // create same-size bubble
  let bubble = newElement('circle');      // this is constant, since it is a bubble
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

function getModel(element) {            // by svg element type, return its salient model attributes for bubbles
  let ox = 0;
  let oy = 0;
  let p1 = 1;
  let p2 = 1;
  switch (element) {
    case 'polyline':
      return {
        'points': p1
      };
    case 'polygon':
      return {
        'points': p1
      };
    case 'rect':
      return {
        'x': ox, 'y': oy, 'width': p1, 'height': p2
      };
    case 'line':
      return {
        'x1': ox, 'y1': oy, 'x2': p1, 'y2': p2
      };
    case 'circle':
      return {
        'cx': ox, 'cy': oy, 'r': p1
      };
    case 'ellipse':
      return {
        'cx': ox, 'cy': oy, 'rx': p1, 'ry': p2
      };
    case 'path':    //  //////// only for curve !!!
      return {
        'x1': ox, 'y1': oy, 'xc1': p1, 'yc1': p2, 'xc2': p1, 'yc2': p2, 'x2': ox, 'y2': oy
      };
    case 'text':
      return {
        'x': ox, 'y': oy
      }
  }                   // end switch
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

SVGDraw.prototype.onSvgMouseMove = function () {
  let self = this;
  return function (event) {

    self.renderFunction(event);
    event.preventDefault();
    return false;
  }
};

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

SVGDraw.prototype.updateMousePosition = function (event) {
  let target;
  if (this.touchSupported) {
    target = event.originalEvent.touches[0]
  } else {
    target = event;
  }
  let offset = svgOffset;    //  was this.canvas.offset();
  this.lastMousePoint.x = target.pageX - offset.left;
  this.lastMousePoint.y = target.pageY - offset.top;
  lastMouseX = this.lastMousePoint.x;
  lastMouseY = this.lastMousePoint.y;
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

  if (cursorMode != "MOVE") {          // if we are not moving(dragging) the SVG check the known tags
    if ((cursorMode == "polygon") || ((cursorMode == 'polyline') && (svgInProgress == 'polygon'))) {
      if (svgInProgress == false) {
        return;
      }     // could be POINT or NEW or polygon
      this.updateMousePosition(event);
      if (svgInProgress == 'SHIFT') {
        let shiftPoint = ((lastMouseX - xC) / zoom).toFixed(4).toString()
          + ',' + ((lastMouseY - yC) / zoom).toFixed(4).toString();
        let shiftingPoints = thisElement.attributes['points'].value.trim();
        let splitShiftPoints = shiftingPoints.split(' ');
        if (thisBubble != null) {       // thisBubble set on mousedown
          let cx = parseFloat(thisBubble.attributes['cx'].value);   // old
          let cy = parseFloat(thisBubble.attributes['cy'].value);   // x, y
          let cx2 = (lastMouseX - xC) / zoom;                       // new x
          let cy2 = (lastMouseY - yC) / zoom;                       // , y
          let dx = (cx2 - cx);
          let dy = (cy2 - cy);
          thisBubble.attributes['cx'].value = (lastMouseX - xC) / zoom;     // translate the bubble
          thisBubble.attributes['cy'].value = (lastMouseY - yC) / zoom;

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
        let thisPoint = ((lastMouseX - xC) / zoom).toFixed(4).toString()
          + ',' + ((lastMouseY - yC) / zoom).toFixed(4).toString();
        let thesePoints = thisElement.attributes['points'].value.trim();
        let splitPoints = thesePoints.split(' ');
        if (thisBubble != null) {       // look for bubble to denote just move THIS point only
          thisBubble.attributes['cx'].value = (lastMouseX - xC) / zoom;     // translate the bubble
          thisBubble.attributes['cy'].value = (lastMouseY - yC) / zoom;
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

    else if (cursorMode == "polyline") {
      if (svgInProgress == false) {
        return;
      }
      this.updateMousePosition(event);
      if(svgInProgress == 'SHIFT') {
        let shiftPoint = ((lastMouseX - xC) / zoom).toFixed(4).toString()
          + ',' + ((lastMouseY - yC) / zoom).toFixed(4).toString();
        let shiftingPoints = thisElement.attributes['points'].value.trim();
        let splitShiftPoints = shiftingPoints.split(' ');
        if (thisBubble != null) {       // thisBubble set on mousedown
          let cx = parseFloat(thisBubble.attributes['cx'].value);   // old
          let cy = parseFloat(thisBubble.attributes['cy'].value);   // x, y
          let cx2 = (lastMouseX - xC) / zoom;                       // new x
          let cy2 = (lastMouseY - yC) / zoom;                       // , y
          let dx = (cx2 - cx)
          let dy = (cy2 - cy)
          thisBubble.attributes['cx'].value = (lastMouseX - xC) / zoom;     // translate the bubble
          thisBubble.attributes['cy'].value = (lastMouseY - yC) / zoom;

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
        let thisPoint = ((lastMouseX - xC) / zoom).toFixed(4).toString()
          + ',' + ((lastMouseY - yC) / zoom).toFixed(4).toString();
        let thesePoints = thisElement.attributes['points'].value.trim();
        let splitPoints = thesePoints.split(' ');
        if (thisBubble != null) {       // look for bubble to denote just move THIS point only
          thisBubble.attributes['cx'].value = (lastMouseX - xC) / zoom;     // translate the bubble
          thisBubble.attributes['cy'].value = (lastMouseY - yC) / zoom;
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

    else if (cursorMode == "rect") {
      if (svgInProgress == false) {
        return;
      }
      if (svgInProgress == 'SHIFT') {
        this.updateMousePosition(event);
        thisBubble.attributes['cx'].value = (lastMouseX - xC) / zoom;     // translate the bubble
        thisBubble.attributes['cy'].value = (lastMouseY - yC) / zoom;
        thisElement.attributes['x'].value = ((lastMouseX - xC) / zoom).toFixed(4);    // correspondingly translate thisElement
        thisElement.attributes['y'].value = ((lastMouseY - yC) / zoom).toFixed(4);
      } else {
        let thisRectX = thisElement.attributes['x'].value;
        let thisRectY = thisElement.attributes['y'].value;

        this.updateMousePosition(event);
        thisElement.attributes['width'].value = ((lastMouseX - xC) / zoom - thisRectX).toFixed(4);
        thisElement.attributes['height'].value = ((lastMouseY - yC) / zoom - thisRectY).toFixed(4);
        if (thisBubble) {
          thisBubble = event.target
          thisBubble.attributes['cx'].value = (lastMouseX - xC) / zoom;     // translate the bubble
          thisBubble.attributes['cy'].value = (lastMouseY - yC) / zoom;
        }
      }
    }

    else if (cursorMode == "line") {
      lastMouseX = this.lastMousePoint.x;
      lastMouseY = this.lastMousePoint.y;
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
        let cx2 = (lastMouseX - xC) / zoom
        let cy2 = (lastMouseY - yC) / zoom
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
          thisBubble.attributes['cx'].value = (lastMouseX - xC) / zoom;     // translate the bubble
          thisBubble.attributes['cy'].value = (lastMouseY - yC) / zoom;
          if (!isNumeric(thisBubble.id)) {                 // presume either 'x1-y1' or 'x2-y2'
            linePoints = (thisBubble.id).split('-');      // this will result in ['x1', 'y1'] or  ['x2', 'y2'] used below
          }
          if (thisGroup.lastChild.firstChild.id == 'shift') {
            thisGroup.lastChild.firstChild.remove();        // kill off the move line bubble
          }
        }
        thisElement.attributes[linePoints[0]].value = ((lastMouseX - xC) / zoom).toFixed(4);
        thisElement.attributes[linePoints[1]].value = ((lastMouseY - yC) / zoom).toFixed(4);
        console_log(enable_log, 'x: ' + ((lastMouseX - xC) / zoom).toString() + ' / y: ' + ((lastMouseY - yC) / zoom).toString())
      }
    }

    else if (cursorMode == 'arrow') {
      lastMouseX = this.lastMousePoint.x;
      lastMouseY = this.lastMousePoint.y;
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
        let cx2 = (lastMouseX - xC) / zoom
        let cy2 = (lastMouseY - yC) / zoom
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
          thisBubble.attributes['cx'].value = (lastMouseX - xC) / zoom;     // translate the bubble
          thisBubble.attributes['cy'].value = (lastMouseY - yC) / zoom;
          if (!isNumeric(thisBubble.id)) {       // presume either 'x1-y1' or 'x2-y2'
            linePoints = (thisBubble.id).split('-');      // this will result in ['x1', 'y1'] or  ['x2', 'y2'] used below
          }
        }
        mainLine.attributes[linePoints[0]].value = ((lastMouseX - xC) / zoom).toFixed(4);
        mainLine.attributes[linePoints[1]].value = ((lastMouseY - yC) / zoom).toFixed(4);
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

      let leftBarb = newElement('line');
      leftBarb.setAttributeNS(null, 'x1', thisX2);       // start x of barbs
      leftBarb.setAttributeNS(null, 'y1', thisY2);      // start y of barbs
      leftBarb.setAttributeNS(null, 'x2', x3);      // end x
      leftBarb.setAttributeNS(null, 'y2', y3);      // end y
      leftBarb.setAttributeNS(null, 'stroke', thisColor);
      leftBarb.setAttributeNS(null, 'stroke-width', thisStrokeWidth);
      // thisGroup.appendChild(leftBarb);
      let rightBarb = newElement('line');
      rightBarb.setAttributeNS(null, 'x1', thisX2);       // start x of barbs
      rightBarb.setAttributeNS(null, 'y1', thisY2);      // start y of barbs
      rightBarb.setAttributeNS(null, 'x2', x4);      // end x
      rightBarb.setAttributeNS(null, 'y2', y4);      // end y
      rightBarb.setAttributeNS(null, 'stroke', thisColor);
      rightBarb.setAttributeNS(null, 'stroke-width', thisStrokeWidth);
      // thisGroup.appendChild(rightBarb);

      if (arrowClosed) {
        let baseBarb = newElement('polygon');
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

    else if ((cursorMode == "circle") /*|| (cursorMode == 'bubble')*/) {
      //thisCircle = thisElement;             // first step toward generalizing SHIFT/SIZE handlers
      if ((event.type == 'mousedown') || (svgInProgress == false)) {
        return;         // //// this has been verified to actually occur
      }
      if (svgInProgress == 'SHIFT') {             // changing position of this element
        this.updateMousePosition(event);
        thisBubble.attributes['cx'].value = (lastMouseX - xC) / zoom;     // translate the bubble
        thisBubble.attributes['cy'].value = (lastMouseY - yC) / zoom;
        thisElement.attributes['cx'].value = ((lastMouseX - xC) / zoom).toFixed(4);    // correspondingly translate thisElement
        thisElement.attributes['cy'].value = ((lastMouseY - yC) / zoom).toFixed(4);
      } else {                                // either resizing or originally sizing
        //this.context.moveTo(lastMouseX, lastMouseY);
        let thisCircX = thisElement.attributes['cx'].value;
        let thisCircY = thisElement.attributes['cy'].value;
        this.updateMousePosition(event);
        lastMouseX = this.lastMousePoint.x;
        lastMouseY = this.lastMousePoint.y;
        let radius = length2points(thisCircX, thisCircY, (lastMouseX - xC) / zoom, (lastMouseY - yC) / zoom);
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

    else if (cursorMode == "ellipse") {
      lastMouseX = this.lastMousePoint.x;
      lastMouseY = this.lastMousePoint.y;
      if ((event.type == 'mousedown') || (svgInProgress == false)) {
        return;
      }
      if (svgInProgress == 'SHIFT') {             // changing position of this element
        this.updateMousePosition(event);
        thisBubble.attributes['cx'].value = (lastMouseX - xC) / zoom;     // translate the bubble
        thisBubble.attributes['cy'].value = (lastMouseY - yC) / zoom;
        thisElement.attributes['cx'].value = ((lastMouseX - xC) / zoom).toFixed(4);    // correspondingly translate thisElement
        thisElement.attributes['cy'].value = ((lastMouseY - yC) / zoom).toFixed(4);
      } else {                        // resizing: cursor NOW osculates ellipse as in circle, diagonally positioned
        let thisEllipseX = thisElement.attributes['cx'].value;
        let thisEllipseY = thisElement.attributes['cy'].value;

        this.updateMousePosition(event);
        lastMouseX = this.lastMousePoint.x;
        lastMouseY = this.lastMousePoint.y;
        thisElement.attributes['rx'].value = (Math.abs(thisEllipseX - (lastMouseX - xC) / zoom) * 1.414).toFixed(4);
        thisElement.attributes['ry'].value = (Math.abs(thisEllipseY - (lastMouseY - yC) / zoom) * 1.414).toFixed(4);
      }
    }

    else if (cursorMode == "draw") {
      if (svgInProgress == false) {
        return;
      }
      this.updateMousePosition(event);
      if(svgInProgress == 'SHIFT') {
        let shiftPoint = ((lastMouseX - xC) / zoom).toFixed(4).toString()
          + ',' + ((lastMouseY - yC) / zoom).toFixed(4).toString();
        let shiftingPoints = thisElement.attributes['points'].value.trim();
        let splitShiftPoints = shiftingPoints.split(' ');
        if (thisBubble != null) {       // thisBubble set on mousedown
          let cx = parseFloat(thisBubble.attributes['cx'].value);   // old
          let cy = parseFloat(thisBubble.attributes['cy'].value);   // x, y
          let cx2 = (lastMouseX - xC) / zoom;                       // new x
          let cy2 = (lastMouseY - yC) / zoom;                       // , y
          let dx = (cx2 - cx)
          let dy = (cy2 - cy)
          thisBubble.attributes['cx'].value = (lastMouseX - xC) / zoom;     // translate the bubble
          thisBubble.attributes['cy'].value = (lastMouseY - yC) / zoom;

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
        let thisPoint = ((lastMouseX - xC) / zoom).toFixed(4).toString()
          + ',' + ((lastMouseY - yC) / zoom).toFixed(4).toString();
        let thesePoints = thisElement.attributes['points'].value.trim();
        let splitPoints = thesePoints.split(' ');
        if (thisBubble != null) {       // look for bubble to denote just move THIS point only
          // currently, no distinction is made between existing vertex and new point
          // however, this may change in the future JRF 23NOV15
          thisBubble.attributes['cx'].value = (lastMouseX - xC) / zoom;     // translate the bubble
          thisBubble.attributes['cy'].value = (lastMouseY - yC) / zoom;
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
        let thisPoint = ((lastMouseX - xC) / zoom).toFixed(4).toString()
          + ',' + ((lastMouseY - yC) / zoom).toFixed(4).toString() + ' ';
        thisElement.attributes['points'].value = thesePoints.concat(thisPoint);
        }   // end of new point at end case
      }
    }     // end of Draw case

    else if ((cursorMode == 'cubic') || (cursorMode == 'quadratic')) {
      lastMouseX = this.lastMousePoint.x;
      lastMouseY = this.lastMousePoint.y;
      if ((event.type == 'mousedown') || (svgInProgress == false)) {    // extra condition for line
        return;
      }
      this.updateMousePosition(event);
      let thisDvalue = thisElement.attributes['d'].value;
      let thisCurveQuadratic = thisDvalue.indexOf('Q ') > 0;
      if (thisBubble != null) {       // look for bubble to denote just move THIS point only
        // currently, no distinction is made between existing vertex and new point
        // however, this may change in the future JRF 23NOV15
        let thisX = (lastMouseX - xC) / zoom;
        let thisY = (lastMouseY - yC) / zoom;
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
        let thisX2 = (lastMouseX - xC) / zoom;
        let thisY2 = (lastMouseY - yC) / zoom;
        let thisD;
        let thisPathType = ' C ';              // set quadratic control point at midpoint, cubic's at 40% and 60% p1:p2
        if (cursorMode == 'quadratic') thisPathType = ' Q ';
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
          // if (cursorMode == 'cubic')
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
        let dx = (lastMouseX - xC) / zoom;
        let dy = (lastMouseY - yC) / zoom;
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

  else if (cursorMode == 'MOVE') {    // Revert to MOVE: this version assumes manipulating the transform <xlt> of the SVG via xC, yC

    if (svgInProgress == 'MOVE') {

      let oldX = this.lastMousePoint.x;
      let oldY = this.lastMousePoint.y;
      this.updateMousePosition(event);
      //lastMouseX = this.lastMousePoint.x;
      //lastMouseY = this.lastMousePoint.y;
      xC = xC - (oldX - lastMouseX);
      yC = yC - (oldY - lastMouseY);
      zoom_trans(xC, yC, zoom);                   // effects the translation to xC, yC in the transform
    }
  }
  return event.preventDefault() && false;
};

SVGDraw.prototype.onSvgMouseUp = function (event) {
  let self = this;
  return function (event) {
    if (!svgInProgress) {                       // i.e., if svgInProgress is not false
      return event.preventDefault() && false;
    }
    if (svgInProgress == 'SHIFT') {       // this is also catching mouseUp from bubbles!!!
      // mouseup implies end of position shift or resize  ///// HELLO ///// ^^^^^^^
      svgInProgress = false;
      clearEditElement(thisGroup);
    } else if (svgInProgress == 'SIZE') {
      // mouseup implies end of position shift or resize
      svgInProgress = false;
      setElementMouseEnterLeave(thisElement.parentNode);   // this element is a SHIFT bubble
    } else if (cursorMode == 'bubble') {      // /////// all assignments of cursorMode to bubble have been disabled
      svgInProgress = false;
    } else if (cursorMode == 'draw') {
      svgInProgress = false;
      setElementMouseEnterLeave(thisGroup);
      // unbindMouseHandlers(self);
    } else if ((cursorMode == 'cubic') || (cursorMode == 'quadratic')) {
      svgInProgress = false;
      setElementMouseEnterLeave(thisGroup);
      // unbindMouseHandlers(self);
    } else if ((cursorMode == "MOVE") /*&& (svgInProgress == cursorMode)*/) {
      svgInProgress = false;
      // unbindMouseHandlers(self);
    } else if (cursorMode == 'rect') {
      svgInProgress = false;
      setElementMouseEnterLeave(thisGroup);
      // unbindMouseHandlers(self);
      thisBubble = null;
      thisElement = null;
      thisGroup = null;
    } else if (cursorMode == 'line') {
      svgInProgress = false;
      setElementMouseEnterLeave(thisGroup);
      // unbindMouseHandlers(self);
      thisBubble = null;
      thisElement = null;
      thisGroup = null;
    } else if (cursorMode == 'arrow') {
      svgInProgress = false;
      setElementMouseEnterLeave(thisGroup);
      // unbindMouseHandlers(self);
      thisBubble = null;
      thisElement = null;
      thisGroup = null;
    } else if (cursorMode == 'polygon') {
      if (thisBubble == null) {

      } else {
        svgInProgress = false;
        setElementMouseEnterLeave(thisGroup);
        // unbindMouseHandlers(self);
        thisBubble = null;
        thisElement = null;
        thisGroup = null;
      }
    } else if (cursorMode == 'polyline') {
      if (thisBubble == null) {

      } else {
        svgInProgress = false;
        setElementMouseEnterLeave(thisGroup);
        // unbindMouseHandlers(self);
        thisBubble = null;
        thisElement = null;
        thisGroup = null;
      }
    } else if (cursorMode == 'circle') {
      //checkLeftoverElement();
      svgInProgress = false;
      setElementMouseEnterLeave(thisGroup);
      thisBubble = null;
      thisElement = null;
      thisGroup = null;
    } else if (cursorMode == 'ellipse') {
      //thisCircle = thisElement;   // patch/hack to have routine below happy
      //checkLeftoverElement();
      svgInProgress = false;
      setElementMouseEnterLeave(thisGroup);
      thisBubble = null;
      thisElement = null;
      thisGroup = null;
    } else if (cursorMode == "text") {    // focus on the text entry input since this fails in mouseDown
      //document.getElementById('text4svg').focus();        // control eliminated
      if (svgInProgress == false) {
        if (thisGroup.lastChild.tagName == 'circle') {
          // thisGroup.lastChild.remove();
          clearEditElement(group);
        }
        setElementMouseEnterLeave(thisGroup);
      }
    }
    thisSVGpoints = [];      // and clear the collector
    //return event.preventDefault() && false;
    return false;
  };
  //return event.preventDefault() && false;
};

/*
 Consider the extension of Escape vs Enter key to terminate all element creation functions:
 Escape originally envisioned as abort key, but slightly perverted for text.
 Currently supported in text as function termination. Enter causes new line.
 Poly-s currently supported by Enter and/or double-click
 line; rectangle; circle; ellipse; cubic quadratic all now terminate on Enter, ABORT on Escape, including edited element
 */
SVGDraw.prototype.keyUpHandler = function () {
  let self = this;
  return function (event) {
    if (event.keyCode == 0x14) {
      capsLock = !capsLock;
    }
  }
};

SVGDraw.prototype.keyHandler = function () {
  let self = this;
  return function (event) {
    // event.preventDefault();
    // Due to browser differences from fireFox, use event.keyCode vs key since key is undefined in Chrome and Safari
    let thisKeyCode = event.keyCode;
    let inFocus = document.activeElement;
    switch (thisKeyCode) {
      case 16:                // shift
        thisKey = 'Shift';
        secondKey = firstKey;
        firstKey = thisKey;
        return;
      case 0x14:
        capsLock = !capsLock;
        return;
      case 91, 93:
        thisKey = 'Meta';
        secondKey = firstKey;
        firstKey = thisKey;
        return;
      case 0x52:              // looking to pick off ctrl-shift-R or shift-Apple-R
        if ((event.shiftKey) && ((event.ctrlKey) || (event.metaKey))) {
          location.reload(true);
        }
      case 0x42:              // looking for control-B to move mousentered group to "bottom"
        if (event.ctrlKey) {  // which is first in the SVG list
          if (thisGroup) {
            let cloneGroup = thisGroup.cloneNode(true);
            thisGroup.remove();
            clearEditElement(cloneGroup);
            svgLayer.firstChild.insertBefore(cloneGroup, svgLayer.firstChild.childNodes[1]);
          }
        }
      case 0x54:              // looking for control-T to move mousentered group to "top"
        if (event.ctrlKey) {  // which is last in the SVG element list
          if (thisGroup) {
            let cloneGroup = thisGroup.cloneNode(true);
            thisGroup.remove();
            clearEditElement(cloneGroup);
            svgLayer.firstChild.appendChild(cloneGroup);
          }
        }
      default:
        secondKey = null;
        firstKey = thisKey;
    }
    if ((cursorMode == 'text') && ((inFocus.tagName == 'BODY') || (inFocus.id == svgLayer.parentElement.id))) {
      updateSvgText(event);             // pass event or key
      return;
    }

    if ((event.key == 'Enter') || thisKeyCode == 13) {    // added literal decimal value for chrome/safari
      switch (cursorMode) {
        case 'polygon':
          dblClick();
          return;
        case 'polyline':
          dblClick();
          return;
        case 'line':
          doMouseUp();
          return;
        case 'rectangle':
          doMouseUp();
          return;
        case 'circle':
          doMouseUp();
          return;
        case 'ellipse':
          doMouseUp();
          return;
        case 'cubic':
          doMouseUp();
          return;
        case 'quadratic':
          doMouseUp();
          return;
        case 'draw':
          doMouseUp();
          return;
      }
    }
    if (((event.key == 'Delete') || event.key == 'Backspace') || (thisKeyCode == 0x2E) || (thisKeyCode == 0x08)) {
      if (event.shiftKey) {                     //                       Delete                  Backspage
        // clearThisGroup(thisGroup);
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
        event.preventDefault();
        return;
      }
    }
    if ((event.key == 'Escape') || (thisKeyCode == 27)) {
      switch (cursorMode) {
        case 'polygon', 'polyline':
          if (svgInProgress == cursorMode) {    // remove last point and reset previous point to dynamic
            deleteLastPoint(thisElement);
            return;
          }
      }
      return;
    }
  }
};

function lookUpKey(event) {     // sort out the keyboard mess and return the key
  let eventKey = event.key;
  let thisKeyCode = event.keyCode;
  let thisCharCode = event.charCode;
  let Shifted = event.shiftKey;
  let Control = event.ctrlKey;
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
  setCursorMode('MOVE');
  // unbindMouseHandlers(self);
  thisBubble = null;
  thisElement = null;
  thisGroup = null;
}

SVGDraw.prototype.doubleClickHandler = function () {
  let self = this;
  return function () {
    dblClick()
  }
};

function dblClick() {
  if ((cursorMode == 'polygon') || (cursorMode == 'polyline')) {
    svgInProgress = false;
    switch (cursorMode) {
      case 'polygon':
        deleteDuplicatePoints(thisElement);
        thisGroup.innerHTML = thisGroup.innerHTML.replace('polyline', 'polygon').replace('polyline', 'polygon');
        setElementMouseEnterLeave(thisGroup);
        break;
      case 'polyline':
        deleteDuplicatePoints(thisElement);
        setElementMouseEnterLeave(thisGroup);
        break;
    }
    if (cursorMode == 'text') {
      closeSvgText();
    }
    thisElement = null;
    thisGroup = null;
    // unbindMouseHandlers(self);
  }
}

SVGDraw.prototype.mouseWheelScrollHandler = function () {
  let self = this;
  return function (event) {
    event.stopImmediatePropagation();
    event.stopPropagation();
    let deltaDiv = 1000;                              // default for non-FireFox
    if (event.type == "DOMMouseScroll") {
      deltaDiv = 100
    }   // adjust for FireFox
    //var delta = parseInt(event.originalEvent.wheelDelta || -event.originalEvent.detail);
    //lastMouseX = (event.originalEvent.clientX - svgOffset.left);      // fixed reference for mouse offset
    //lastMouseY = (event.originalEvent.clientY - svgOffset.top);
    let delta = -parseInt(event.deltaY || -event.detail);
    lastMouseX = (event.clientX - svgOffset.left);      // fixed reference for mouse offset
    lastMouseY = (event.clientY - svgOffset.top);
    let zoomDelta = delta / deltaDiv;
    if (zoomDelta > 0) {
      zoomIn();
    } else {
      zoomOut();
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
  let px = p[0];
  let py = p[1];
  let qx = q[0];
  let qy = q[1];
  if((Math.abs(px - qx) < 0.000001 * qx) && (Math.abs(py - qy) < 0.000001 * qy)){
    return false
  }
  return true
}

function setCursorMode(mode) {      // detect current mode not completed prior to mode switch
  // if (true/*(cursorMode != mode) && (svgInProgress == cursorMode)*/) {        // iff switched mode while in progress
  //   svgInProgress = false;                                      // //////// does this ^ matter?
  if (thisElement) {
    checkLeftoverElement();     // look for dangling element, most likely off of svg image element ( - Y coord)
    clearEditElement(thisGroup);        //  TODO: make sure all cases complete
  }
  // }
  if (mode.toUpperCase() == 'MOVE') {
    cursorMode = mode;
    console_log(enable_log, '@setCursorMode1 cursorMode = ' + cursorMode)
  } else {
    cursorMode = mode.toLowerCase();
    if (cursorMode == 'text') {
      //document.getElementById("text4svg").removeAttribute('disabled');
      //document.getElementById("text4svg").focus();        // this control eliminated
    }
    if (mode == 'rectangle') {      // there are  few cases where the tagName of the element != cursorMode
      cursorMode = 'rect';          // also cubic and quadratic, whose tagName is path and draw which is polyline
      console_log(enable_log, '@setCursorMode2 cursorMode = ' + cursorMode)
    }
    if(mode == 'clear') {
      clearLastGroup();
      cursorMode = 'MOVE';
    }
    if(mode == 'reset') {
      zoom_trans(0, 0, baseZoom);
      cursorMode = 'MOVE';
    }
  }
  // cursorMode WILL BE set at this point
  savedCursorMode = 'MOVE';      ////////////// eliminated but reinstated
  if (cursorMode.toUpperCase() != 'MOVE') {
    waitElement = true;
    console_log(enable_log, '@setCursorMode3 waitElement = ' + cursorMode)
  }
  indicateMode(cursorMode);
  svgInProgress = false;
}
SVGDraw.prototype.apiSetMode = function(mode) {
  setCursorMode(mode)
}

function checkLeftoverElement() {       // this function is only called when svgInProgress is false (?)
  switch (cursorMode) {
    case 'polyline':
    case 'polygon':
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
    case 'circle':
      if (thisElement == null) return;
      if (((thisElement.attributes['cy'].value - thisElement.attributes['r'].value) < 0)     // off svgLayer
        || (thisElement.attributes['r'].value < 2))                                  // single click
      {
        clearLastGroup();       // this was a leftover
      }
      break;
    case 'ellipse':
      if (thisElement == null) return;
      if ((thisElement.attributes['cy'].value - thisElement.attributes['ry'].value) < 0) {
        clearLastGroup();       // this was a leftover
      }
      break;
    case 'rect':
      if (thisElement == null) return;
      if ((thisElement.attributes['height'].value) < 0) {
        clearLastGroup();       // this was a leftover
      }
      break;
    case 'line':
      if ((thisElement.attributes['y2'].value) < 0) {
        clearLastGroup();       // this was a leftover
      }
      break;
    case 'text':
      finishTextGroup();
      break;
  }
}

function clearLastGroup() {
  let xlt = document.getElementById("xlt");
  if (xlt.childElementCount > 1) {              // don't remove the base image
    let group = xlt.lastChild;
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
    // waitElement = false;   ]]*****************
  }
}

function inverseColor(color) {          // color is required to be string as #RRGGBB hexadecimal
  let red = makeHex8(color.slice(1, 3));
  let grn = makeHex8(color.slice(3, 5));
  let blu = makeHex8(color.slice(5, 7));
  return '#' + red + grn + blu;
}

function makeHex8(colorSegment) {       // colorSegment is 8 bit hex encoded string
  let izit = ((parseInt('0X' + colorSegment)) ^ 0xFF).toString(16);
  if (izit.length == 2) {
    return izit;
  }
  return '0' + izit;
}

function zoomIn() {
//            var zoomDelta = 0.05;
  if (zoom < maxZoom) {           // zoom of 1 is pixel-per-pixel on svgLayer
    let newZoom = zoom * (1.0 + zoomDelta);
    if (newZoom > maxZoom) {
      newZoom = maxZoom;
    }
    xC = lastMouseX - (lastMouseX - xC) * newZoom / zoom;
    yC = lastMouseY - (lastMouseY - yC) * newZoom / zoom;
    zoom_trans(xC, yC, newZoom);
    zoom = newZoom;
    bubbleRadius = (baseBubbleRadius / zoom).toString();
    document.getElementById('zoom').innerHTML = "Zoom:" + zoom.toFixed(4);
  }
}

function zoomOut() {
//            var zoomDelta = 0.05;
  if (zoom > baseZoom / 3) {
    let newZoom = zoom / (1.0 + zoomDelta);
    xC = lastMouseX - (lastMouseX - xC) * newZoom / zoom;
    yC = lastMouseY - (lastMouseY - yC) * newZoom / zoom;
    zoom_trans(xC, yC, newZoom);
    zoom = newZoom;
    bubbleRadius = (baseBubbleRadius / zoom).toString();
    document.getElementById('zoom').innerHTML = "Zoom:" + zoom.toFixed(4);
  }
}

function setZoom(scale) {
  xC = lastMouseX - (lastMouseX - xC) * scale / zoom;
  yC = lastMouseY - (lastMouseY - yC) * scale / zoom;
  zoom_trans(xC, yC, scale);
  zoom = scale;
}

function zoom_trans(x, y, scale) {
  let xlt = document.getElementById('xlt');         // DOM svg element g xlt
  let transform = 'translate(' + ((x)).toString() + ', ' + ((y)).toString() + ') scale(' + scale.toString() + ')';
  zoom = scale;
  xC = x;
  yC = y;
  xlt.attributes['transform'].value = transform;
  let zoomElement = document.getElementById('zoom');
  if(zoomElement) zoomElement.innerHTML = "Zoom:" + scale.toFixed(4);
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
    // setElementMouseEnterLeave(thisGroup);
    // removeCursorFromSvgText();
    // closeSvgText();
    // checkLeftoverElement();
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
    let BreakHere = true;
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
          let BreakHere = true;
        }
        if (thisGroup.lastChild.tagName == 'g') {        // this is to detect a leftover bubble
          thisGroup.lastChild.remove;
          // clearEditElement(group);
          let BreakHere = true;
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

function setStroke(color) {
  stroke = color;
  let  colorButton = document.getElementById('stroke');
  if (colorButton) {
    colorButton.attributes['style'].value = 'background-color: ' + stroke;
  }
}

function setUserColor(color) {          // only sets up the color for later selection
  let userColorCheckbox = document.getElementById('selectUserColor');
  userColorCheckbox.attributes['style'].value = 'background-color: ' + color;
  userColorCheckbox.blur();
}

function getUserColor() {
  return document.getElementById('userColor').value;

}

function indicateMode(mode) {
  let coverRect = mode;
  if (mode == 'rect') {
    coverRect = 'rectangle';        // replace anomalous rect with rectangle
  }
  let testMode = document.getElementById("mode")
  if(testMode) testMode.textContent = coverRect.toUpperCase();
  let testZoom = document.getElementById('zoom')
  if(testZoom) testZoom.innerHTML = "Zoom:" + zoom.toFixed(4);
}

function collectSVG(verbatim) {   // verbatim true includes all markup, false means stripped
  let clonedSVG = svgLayer.cloneNode(true);
  let thisXLT = clonedSVG.firstChild;
  if (!verbatim) {
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
    if (!verbatim) {    // new wrinkle for arrow and similar groups
      if (thisG.attributes.class) {
        thisG.removeAttribute('id');
      }
    }
  }
  return clonedSVG;        //  oops, this was too easy
};

function getBareSVG(noGroups) {   //  stripped
  let clonedSVG = svgLayer.cloneNode(true);
  clonedSVG.removeAttribute('height');
  clonedSVG.removeAttribute('width');
  clonedSVG.removeAttribute('id');
  // clonedSVG.firstChild.attributes['transform'].value = 'translate(0, 0) scale(1)';
  let thisXLT = clonedSVG.firstChild;
  thisXLT.removeAttribute('id');
  thisXLT.removeAttribute('transform');
  thisXLT.children['xltImage'].remove();
  let thisG, i;
  let terminus = thisXLT.childElementCount;
  let groups = ['arrow', 'cubic', 'quadratic', 'text'];
  for (i = 0; i < terminus; i++) {              // i will range over the remaining children count
    thisG = thisXLT.childNodes[i];              // probably should be firstChild since iteratively
    if (thisG.attributes.class) {
      stripElement(thisG);
      if(noGroups && !(groups.includes(thisG.attributes.class.value))) {
        thisG.outerHTML = thisG.innerHTML;
      }
    };
  }
  return clonedSVG;        //  oops, this was too easy
};

function stripElement(element) {
  if(element.hasChildNodes()) {
    let i;
    for (i=0; i<element.childElementCount; i++) {
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
  return element;
}

SVGDraw.prototype.apiShowSVG = function(verbatim) {
  svgMenu.children['textSVGorJSON'].textContent = collectSVG(verbatim).outerHTML;
};

SVGDraw.prototype.apiBareSVG = function(noGroups = true) {
  svgMenu.children['textSVGorJSON'].textContent = getBareSVG(noGroups).outerHTML;
};

SVGDraw.prototype.apiJsonSVG = function (verbatim) {      // package SVG into JSON object
  let clonedSVG = collectSVG(false).firstChild;     // strip off <svg...> </svg>
  clonedSVG.removeAttribute('id');
  clonedSVG.removeAttribute('transform');
  // clonedSVG.childNodes[0].remove();    // this was originally the image, now removed if !verbatim
  let JSONsvg = {
    "data": {
      "type": "svg",
      "attributes": clonedSVG.outerHTML
    }
  };
  svgMenu.children['textSVGorJSON'].textContent = JSON.stringify(JSONsvg);
  return JSONsvg;
};

// buildSVGmenu refactored into standalone integrated function
 SVGDraw.prototype.buildSVGmenu = function(containerID) {
   if(containerID.attributes['data-buttons']) {
     let buttons = JSON.parse(containerID.attributes['data-buttons'].value).buttons;
     svgMenu = document.createElement('div');        // this lengthy, tedious section generates the controls needed
     svgMenu.setAttribute('id', 'svgMenu');
     containerID.parentElement.appendChild(svgMenu);
     let thisButton, thisSpan, i;
     for (i = 0; i < buttons.length; i++) {                // these buttons explicitly enumerated in data-buttons
       let thisFunction = buttons[i].function;
       let thisValue = buttons[i].value;
       switch (thisFunction) {
         case 'clear':
         case 'polygon':
         case 'polyline':
         case 'line':
         case 'arrow':
         case 'rectangle':
         case 'circle':
         case 'ellipse':
         case 'quadratic':
         case 'cubic':
         case 'draw':
         case 'text':
         case 'MOVE':
         case 'reset':
           thisButton = document.createElement('input');
           thisButton.setAttribute('type', 'button');
           if(thisValue) {
             thisButton.setAttribute('value', thisValue);
           } else {
           thisButton.setAttribute('value', buttons[i].function.charAt(0).toUpperCase() + buttons[i].function.slice(1));
           }
           thisButton.setAttribute('id', 'b_' + buttons[i].function.toLowerCase());
           svgMenu.appendChild(thisButton);
           let thisMode = buttons[i].function;
           thisButton.addEventListener('click', (event) => {
             setCursorMode(thisMode)
           });
           break;
         case 'mode':
           thisSpan = document.createElement('span');      // mode/status display area
           thisSpan.setAttribute('id', 'mode');
           svgMenu.appendChild(thisSpan);
           break;
         case 'zoomin':
           thisButton = document.createElement('input');     // default ZOOM OUT button
           thisButton.setAttribute('type', 'button');
           thisButton.setAttribute('value', 'Zoom IN');
           thisButton.setAttribute('id', 'b_zoomin');
           svgMenu.appendChild(thisButton);
           thisButton.addEventListener('click', (event) => {
             thisButton.blur();
             zoomIn();
           });
           break;
         case 'zoom':
           thisButton = document.createElement('span');      // ZOOM display area
           thisButton.setAttribute('id', 'zoom');
           thisButton.setAttribute('innerHTML', ' Zoom:  ----');
           svgMenu.appendChild(thisButton);
           break;
         case 'zoomout':
           thisButton = document.createElement('input');     // default ZOOM OUT button
           thisButton.setAttribute('type', 'button');
           thisButton.setAttribute('value', 'Zoom OUT');
           thisButton.setAttribute('id', 'b_zoomout');
           svgMenu.appendChild(thisButton);
           thisButton.addEventListener('click', (event) => {
             thisButton.blur();
             zoomOut();
           });
           break;
         case 'fontsize':
           thisSpan = document.createElement('span');      // TEXT display area
           thisSpan.setAttribute('id', 'textBlock');
           svgMenu.appendChild(thisSpan);
           let thisFontSizeTitle = document.createElement('span');
           thisFontSizeTitle.innerHTML = ' Font Size: ';
           thisSpan.appendChild(thisFontSizeTitle);
           thisButton = document.createElement('input');     // default TEXT SIZE input
           thisButton.setAttribute('id', 'fontSize');
           thisButton.setAttribute('type', 'number');
           thisButton.setAttribute('min', '5');
           thisButton.setAttribute('step', '5');
           thisButton.setAttribute('max', '300');
           thisButton.setAttribute('style', 'width: 4em');
           thisButton.setAttribute('value', fontSize.toString());
           thisSpan.appendChild(thisButton);
           thisButton.addEventListener('change', (event) => {
             fontSize = parseInt(document.getElementById('fontSize').value)
           });
           break;
         case 'newline':
           svgMenu.appendChild(document.createElement('br'));
           thisSpan = document.createElement('span');
           thisSpan.innerHTML = 'Select color: ';
           svgMenu.appendChild(thisSpan);
           break;
         case 'colorselect':
           let colorSelect = {
             "buttons": [     // select this color buttons: Red/Green/Blue/Black/UserDefined/Selected
               {"color": "#FF0000"},
               {"color": "#00FF00"},
               {"color": "#0000FF"},
               {"color": "#000000"},
               {"color": "#666666"},
               {"color": "#FF0000"}
             ]
           };
           let j;
           for (j = 0; j < colorSelect.buttons.length; j++) {                // buttons explicitly enumerated in data-buttons
             if (j == 4) {                                  // insert the text area input after the first 4 color select buttons
               thisButton = document.createElement('input');
               thisButton.setAttribute('id', 'userColor');
               thisButton.setAttribute('type', 'text');
               thisButton.setAttribute('value', colorSelect.buttons[j].color);
               thisButton.setAttribute('style', 'width: 5em');
               svgMenu.appendChild(thisButton);
               thisButton.addEventListener('change', (event) => {
                 setUserColor(getUserColor());
                 thisButton.blur();
               });

               thisButton = document.createElement('input');   // add the user-defined color select button
               thisButton.setAttribute('id', 'selectUserColor');
               thisButton.setAttribute('type', 'button');
               thisButton.setAttribute('style', 'background-color: ' + colorSelect.buttons[j].color);
               svgMenu.appendChild(thisButton);
               thisButton.addEventListener('click', (event) => {
                 setStroke(getUserColor());
                 thisButton.blur();
               })
             }
             if (j < colorSelect.buttons.length - 2) {       // for the first four (0:3) color select buttons, just set table color
               thisButton = document.createElement('input');
               thisButton.setAttribute('type', 'button');
               thisButton.setAttribute('style', 'background-color: ' + colorSelect.buttons[j].color);
               svgMenu.appendChild(thisButton);
               let thisColor = colorSelect.buttons[j].color;
               thisButton.addEventListener('click', (event) => {
                 setStroke(thisColor);
                 thisButton.blur();
               })
             }
             if (j > colorSelect.buttons.length - 2) {   // insert the selected color block (5) (indicator only) as last
               let thisColorTitle = document.createElement('span');
               thisColorTitle.innerHTML = ' Selected Color >';
               svgMenu.appendChild(thisColorTitle);
               thisButton = document.createElement('input');
               thisButton.setAttribute('id', 'stroke');
               thisButton.setAttribute('type', 'button');
               thisButton.setAttribute('style', 'background-color: ' + colorSelect.buttons[j].color);
               svgMenu.appendChild(thisButton);
               stroke = colorSelect.buttons[j].color;   // set the stroke from the nominal button arrangement
             }
           }
           break;
         case 'arrowspecs':
           thisSpan = document.createElement('span');      // arrow display area
           thisSpan.setAttribute('id', 'arrowBlock');
           thisSpan.innerHTML += ' &nbsp;Arrowhead: Closed:';
           svgMenu.appendChild(thisSpan);

           thisButton = document.createElement('input');
           thisButton.setAttribute('id', 'arrowHeadClosed');
           thisButton.setAttribute('type', 'checkbox');
           thisButton.addEventListener('click', (event) => {
             arrowClosed = document.getElementById('arrowHeadClosed').checked
           });
           svgMenu.appendChild(thisButton);

           thisSpan = document.createElement('span');      // arrow display area
           thisSpan.innerHTML += ' &nbsp; Fixed:';
           svgMenu.appendChild(thisSpan);

           thisButton = document.createElement('input');
           thisButton.setAttribute('id', 'arrowHeadPixels');
           thisButton.setAttribute('type', 'checkbox');
           thisButton.addEventListener('click', (event) => {
             arrowFixed = document.getElementById('arrowHeadPixels').checked
           });
           svgMenu.appendChild(thisButton);

           thisSpan = document.createElement('span');      // arrow display area
           thisSpan.innerHTML += ' &nbsp; Length:';
           svgMenu.appendChild(thisSpan);

           thisButton = document.createElement('input');
           thisButton.setAttribute('id', 'arrowHeadLength');
           thisButton.setAttribute('type', 'number');
           thisButton.setAttribute('value', '50');
           thisButton.setAttribute('style', 'width: 4em');
           thisButton.addEventListener('change', (event) => {
             arrowheadLength = parseInt(document.getElementById('arrowHeadLength').value);
           });
           svgMenu.appendChild(thisButton);

           thisSpan = document.createElement('span');      // arrow display area
           thisSpan.innerHTML += ' &nbsp; Percent:';
           svgMenu.appendChild(thisSpan);

           thisButton = document.createElement('input');     // default TEXT SIZE input
           thisButton.setAttribute('id', 'arrowHeadPercent');
           thisButton.setAttribute('type', 'number');
           thisButton.setAttribute('min', '5');
           thisButton.setAttribute('step', '1');
           thisButton.setAttribute('max', '30');
           thisButton.setAttribute('style', 'width: 4em');
           thisButton.setAttribute('value', '10');
           thisButton.addEventListener('change', (event) => {
             arrowPercent = parseInt(document.getElementById('arrowHeadPercent').value)
           });
           svgMenu.appendChild(thisButton);

           break;

         case 'json':
           thisButton = document.createElement('input');
           thisButton.setAttribute('id', 'saveSVG');
           thisButton.setAttribute('type', 'button');
           thisButton.setAttribute('value', 'Extract SVG');
           svgMenu.appendChild(thisButton);
           thisButton.addEventListener('click', (event) => {
             thisButton.blur();
             SVGDraw.prototype.apiShowSVG(true);
           });

           thisButton = document.createElement('input');
           thisButton.setAttribute('id', 'plainSVG');
           thisButton.setAttribute('type', 'button');
           thisButton.setAttribute('value', 'Plain SVG');
           svgMenu.appendChild(thisButton);
           thisButton.addEventListener('click', (event) => {
             thisButton.blur();
             SVGDraw.prototype.apiShowSVG(false);
           });

           thisButton = document.createElement('input');
           thisButton.setAttribute('id', 'bareSVG');
           thisButton.setAttribute('type', 'button');
           thisButton.setAttribute('value', 'Bare SVG');
           svgMenu.appendChild(thisButton);
           thisButton.addEventListener('click', (event) => {
             thisButton.blur();
             SVGDraw.prototype.apiBareSVG();
           });

           thisButton = document.createElement('input');
           thisButton.setAttribute('id', 'svgJSON');
           thisButton.setAttribute('type', 'button');
           thisButton.setAttribute('value', 'JSON SVG');
           svgMenu.appendChild(thisButton);
           thisButton.addEventListener('click', (event) => {
             SVGDraw.prototype.apiJsonSVG(false);
           });

           thisButton = document.createElement('input');        // special function for tests
           thisButton.setAttribute('id', 'delHover');
           thisButton.setAttribute('type', 'button');
           thisButton.setAttribute('value', '?');
           svgMenu.appendChild(thisButton);
           thisButton.addEventListener('click', (event) => {
             SVGDraw.prototype.apiDeleteHover(thisGroup);
           });

           svgMenu.appendChild(document.createElement('br'))

           let thisTextArea = document.createElement('textarea');
           thisTextArea.setAttribute('id', 'textSVGorJSON');
           svgMenu.appendChild(thisTextArea);
           break;
       }
     }
  }

 };
function console_log(logFlag, message) {
  if(logFlag) {
    console.log(message);
    return true
  }
  return false
}
SVGDraw.prototype.apiFontSize = function(fontsize) {
  if(isNumeric(fontsize)) fontSize = fontsize
};
SVGDraw.prototype.apiFontFamily = function(font) {
  fontFamily = font
};
SVGDraw.prototype.apiArrowClosed = function(checked) {
  arrowClosed = checked
};
SVGDraw.prototype.apiArrowFixed = function(checked) {
  arrowFixed = checked
};
SVGDraw.prototype.apiArrowLength = function(length) {
  if(isNumeric(length)) {
    arrowheadLength = length
  }
};
SVGDraw.prototype.apiArrowPercent = function(percent) {
  if(isNumeric(percent)) {
    arrowPercent = percent
  }
};
SVGDraw.prototype.apiStroke = function(color) {
  setStroke(color);      // not completely safe, but there are many color variants
};
SVGDraw.prototype.apiStrokeWidth = function(pixels) {
  if(isNumeric(pixels)) strokeWidth = pixels
};
SVGDraw.prototype.apiStrokeOpacity = function(opacity) {
  if(opacity >= 0 && opacity <= 1) {
    strokeOpacity = opacity;
  }
};
SVGDraw.prototype.apiStrokeLinecap = function(style) {
  strokeLinecap = style
};
SVGDraw.prototype.apiFill = function(color) {
  fill = color;
};
SVGDraw.prototype.apiFillOpacity = function(opacity) {
  if(opacity >= 0 && opacity <= 1) {
    fillOpacity = opacity.toString();
  }
};
SVGDraw.prototype.apiZoomIn = function(){
  zoomIn()
};
SVGDraw.prototype.apiZoomOut = function(){
  zoomOut()
};
SVGDraw.prototype.apiSetZoom = function(scale){
  setZoom(scale)
};
SVGDraw.prototype.apiDeleteLast = function() {
  clearLastGroup();
};
SVGDraw.prototype.apiDeleteHover = function(group) {
  if(group) clearThisGroup(group)
};

export default SVGDraw
