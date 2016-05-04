// construct svgLayer from container's attributes and data-attributes

/*
 Discussion/tradeoff issues with SVGDraw as of 03MAR2016 \\ was 17FEB2016:

 Priorities (JRF):
 0. FIXED BUG New text element eats last line of prior text element (?!?!?!?)!
 0.5 incorrect action on mouseleave: always reverts to MOVE through exitEditGroup
 0.7 repurpose ESC to remove last point vs whole element.
 1. FIXED BUG: polyline end point sometimes glitches to create new point.
 2. DONE-ish text shortcut/hotkey modification
 3. DONE mouseover on text for repositioning
 4. DONE text broken after integration of Mousetrap (just discovered in testing)
 5. DONE need encapsulated listener for image load complete, otherwise scaling faults, etc.
 6. DONE (a) below
 7. DONE (e) below -- crude straight replication of previous button-ology
 8. (f) below, f.v implemented; f.i/ii, f.vi
 9. (l) below
 10. (g) below
 11. DONE (o) below
 Features/Issues:
 a. DONE Scale and normalize image to container (only partially correct now)
 (aspect ratio compensation source to target svg)
 b. Explicit edit mode versus auto mouseenter
 c. Specific style parameters per svg element type
 d. DONE "Semantic" zoom applied to bubbles on creation (vis a vis real-time)
 e. DONE Tableau of function mode buttons/indicators
 (auto-build controls on invocation from div data- element)
 f. HOT-KEYS for: abort last individual point (e.g., escape)
 i. return cursor to previous point (what key/combination?)
 ii. escape at initial point aborts element? combine with (i)?
 iii. on edit of poly-element, only allow one reversion of currently edited point
 (use same mechanism?  i.e., stash reversion point on creation - no, this is a sequenced element)
 iv. abort last/current element (e.g., delete)
 v. finish current element (e.g., enter)
 vi. DONE: ^B to move current element to "bottom"; ^T to move current element to "top"
 (or Move [element] to the top function - harder to make sure it works)
 vii. enter/inhibit mouse"over" editing
 viii. SPACE held down to drag-pan
 g. DONE: Export svg markup (currently elements are partially corrupted - i.e., incomplete end tag)
 Packaging:
 verbatim
 style vs element segregation
 h. "Stacking" issues - tokenize elements for selection outside the image.
 i. After the fact grouping
 j. DONE Eliminate jQuery
 k. Color picker
 l. Measurement specifier and tool (caliper)
 m. +/- 90 degree text orientation
 n. DONE: ARROW super-element
 o. DONE: more graceful handling of text to screen input; e.g., hidden textbox
 */
var xC = 0;
var yC = 0;
var cursorMode = "MOVE";
var cursorColor;
var zoom;                 // set on initialization from baseZoom @ full image
var baseStrokeWidth = 1;
var baseBubbleRadius = 6;
// transform below to functions?
var strokeWidth;   //= (baseStrokeWidth / zoom).toString();    // dynamically recomputed with zoom (not this one)
var bubbleRadius;  //= (baseBubbleRadius / zoom).toString(); // and transcoded from/to string (may not be required)
var baseZoom;           // calculated from svg and image attributes
var maxZoom = 4;        // this is 4 pixels per source image pixel
var zoomDelta = 0.02;   // this can be altered to discriminate legacy firefox dommousescroll event
var svgLayer;
var svgImage;
var thisSvg = [];            // collect points as [x,y]
var svgOffset;              // set on document ready ////////// test against fully packaged code
var svgMenu;                // object built to be the element type selection and control menu


var isMac = /Mac/.test(navigator.platform);             // store whether we are running on a Mac
var capsLock = false;
var thisKey;
var firstKey;
var secondKey;
// converted to thisElement: var thisSvgText;            // pointer to svg text element currently being populated
var text4svg = '_';         // buffer replacing HTML input control previously used for text, prime with underscore cursor
var textHeight = 75;
var textFont = 'Verdana';
var arrowSize = 10;         // defalt arrow head size

var waitElement = false;   // interlock flag to prevent mouseenter mode change after selecting a create mode

var thisGroup;              // should be the parent of the current element

var savedCursorMode = cursorMode;

var thisElement;              // should be the current element

var thisBubble;             // the bubble mousedown-ed in the currently edited element

var svgInProgress = false;

var lastMouseX;
var lastMouseY;

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

function SVGDraw(containerID) {     // container:<svgLayer>:<xlt>:<svgImage>

  svgImage = new Image();
  thisSvg = [];            // collect points as [x,y]

  textHeight = 75;
  textFont = 'Verdana';


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

    strokeWidth = (baseStrokeWidth / zoom).toString();    // dynamically recomputed with zoom (not this one)
    bubbleRadius = (baseBubbleRadius / zoom).toString(); // and transcoded from/to string (may not be required)

    lastMouseX = baseZoom * svgImage.width / 2;         // center of image
    lastMouseY = baseZoom * svgImage.height / 2;
    // insert the svg base image into the transformable group <g id='xlt'>
    var xlt = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    xlt.setAttributeNS(null, 'id', 'xlt');
    xlt.setAttributeNS(null, 'transform', 'translate(0,0)scale(' + parseFloat(zoom) + ')');
    svgLayer.appendChild((xlt));
    var xltImage = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    xltImage.setAttributeNS(null, 'id', "xltImage");
    xltImage.setAttributeNS(null, 'x', "0");
    xltImage.setAttributeNS(null, 'y', "0");
    xltImage.setAttributeNS(null, 'width', svgImage.width.toString());
    xltImage.setAttributeNS(null, 'height', svgImage.height.toString());
    xltImage.setAttributeNS(null, 'preserveAspectRatio', "none");
    xltImage.setAttributeNS('http://www.w3.org/1999/xlink', 'href', svgImage.src);
    xlt.appendChild(xltImage);

    svgMenu = document.createElement('div');        // this lengthy, tedious section generates the controls needed
    svgMenu.setAttribute('id', 'svgMenu');
    containerID.parentElement.appendChild(svgMenu);
    var thisButton;
    thisButton = document.createElement('input');       // for now, inject the un-listed Delete Last Element button
    thisButton.setAttribute('type', 'button');
    thisButton.setAttribute('value', 'Clear Last Element');
    thisButton.setAttribute('onclick', "clearLastGroup()");
    svgMenu.appendChild(thisButton);
    var buttons = JSON.parse(containerID.attributes['data-buttons'].value).buttons;
    for (i = 0; i < buttons.length; i++) {                // these buttons explicitly enumerated in data-buttons
      thisButton = document.createElement('input');
      thisButton.setAttribute('type', 'button');
      thisButton.setAttribute('value', buttons[i].function.charAt(0).toUpperCase() + buttons[i].function.slice(1));
      thisButton.setAttribute('onclick', "this.blur(); setCursorMode('" + buttons[i].function + "');");
      svgMenu.appendChild(thisButton);
    }
    buildSVGmenu();       // populate the button-ology from the data element description (mostly)

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
    }
    else {
      self.mouseDownEvent = "mousedown";
      self.mouseMoveEvent = "mousemove";
      self.mouseUpEvent = "mouseup";

      svgLayer.ondblclick = self.doubleClickHandler();       // replace jquery reference

      svgLayer.onwheel = self.mouseWheelScrollHandler();        // replace jquery reference
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
  var self = this;
  return function (event) {
    self.updateMousePosition(event);
    if (svgInProgress != false && svgInProgress != cursorMode) {    // terminate in progress svg before continuing
      if (svgInProgress == 'SHIFT') {
        return;                       //  ///////// should these be returning false?
      }
      else {
        svgInProgress = cursorMode;       //  ??
        return;
      }
    }
    if (thisGroup) {
      if (thisGroup.childElementCount > 1 && cursorMode != 'text') {   // this is the case where there is a click on a mouseovered
        // thisGroup.lastChild.remove();
        clearEditElement(thisGroup);
        // setCursorMode(savedCursorMode);       // because we know specifically that we mouseentered an element
        return false;
      }
    }
    if (cursorMode == 'polygon') {     // mouseDown sets initial point, subsequent points set by mouseDown after mouseUp
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        savedCursorMode = cursorMode;     // plant this to prevent immediate post-creation clearing
        thisSvg[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];
        var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        var newGroupID = 'g' + (document.getElementById("xlt").childElementCount + 1).toString();
        group.setAttributeNS(null, 'id', newGroupID);
        thisGroup = group;
        document.getElementById("xlt").appendChild(group);
        var element = createElement('polyline');        //YES, I KNOW... polyline behavior mimics google maps better

        group.appendChild(element);
        thisElement = group.children[0];
        element.setAttributeNS(null, 'points', thisSvg[0][0].toFixed(2).toString()
          + ',' + thisSvg[0][1].toFixed(2).toString() + ' '
          + thisSvg[0][0].toFixed(2).toString()
          + ',' + thisSvg[0][1].toFixed(2).toString() + ' ');      // start x,y for both points initially
        svgInProgress = cursorMode;     // mark in progress
      }
      else {      // this is the fixation of this last point, so DON'T dissociate mouse move handler
        self.updateMousePosition(event);
        var thesePoints = thisElement.attributes['points'].value;   // to trim or not to trim?  if so, multiple implications here
        var thisPoint = ((lastMouseX - xC) / zoom).toFixed(2).toString()
          + ',' + ((lastMouseY - yC) / zoom).toFixed(2).toString() + ' ';
        thisElement.attributes['points'].value = thesePoints.concat(thisPoint);
      }
    }
    if (cursorMode == 'polyline') {    // mouseDown sets initial point, subsequent points set by mouseDown after mouseUp
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        savedCursorMode = cursorMode;     // plant this to prevent immediate post-creation clearing
        thisSvg[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];
        var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        thisGroup = group;
        var newGroupID = 'g' + (document.getElementById("xlt").childElementCount + 1).toString();
        group.setAttributeNS(null, 'id', newGroupID);
        document.getElementById("xlt").appendChild(group);
        var element = createElement('polyline');

        group.appendChild(element);
        thisElement = group.children[0];
        element.setAttributeNS(null, 'stroke-linecap', 'round');
        element.setAttributeNS(null, 'points', thisSvg[0][0].toFixed(2).toString()
          + ',' + thisSvg[0][1].toFixed(2).toString() + ' '
          + thisSvg[0][0].toFixed(2).toString()
          + ',' + thisSvg[0][1].toFixed(2).toString() + ' ');      // start x,y for both points initially
        svgInProgress = cursorMode;     // mark in progress
      }
      else {      // this is the fixation of this last point, so DON'T dissociate mouse move handler
        self.updateMousePosition(event);
        var thesePoints = thisElement.attributes['points'].value;
        var thisPoint = ((lastMouseX - xC) / zoom).toFixed(2).toString()
          + ',' + ((lastMouseY - yC) / zoom).toFixed(2).toString() + ' ';
        thisElement.attributes['points'].value = thesePoints.concat(thisPoint);
      }
    }
    if (cursorMode == 'rect') {     // mouseDown starts creation, after drag, mouseUp ends
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        savedCursorMode = cursorMode;     // plant this to prevent immediate post-creation clearing
        thisSvg[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];
        var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        var newGroupID = 'g' + (document.getElementById("xlt").childElementCount + 1).toString();
        group.setAttributeNS(null, 'id', newGroupID);
        document.getElementById("xlt").appendChild(group);
        var element = createElement('rect');

        group.appendChild(element);
        thisGroup = group;
        thisElement = group.children[0];
        element.setAttributeNS(null, 'x', thisSvg[0][0]);      // start x
        element.setAttributeNS(null, 'y', thisSvg[0][1]);      // start y
        element.setAttributeNS(null, 'width', 1);      // width x
        element.setAttributeNS(null, 'height', 1);      // height y
        svgInProgress = cursorMode;     // mark in progress
      }
// now using mouseUp event to terminate rect
    }
    if (cursorMode == 'line') {     //  mouseDown starts creation, after, drag mouseUp ends
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        savedCursorMode = cursorMode;     // plant this to prevent immediate post-creation clearing
        thisSvg[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];
        var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        thisGroup = group;
        var newGroupID = 'g' + (document.getElementById("xlt").childElementCount + 1).toString();
        group.setAttributeNS(null, 'id', newGroupID);
        document.getElementById("xlt").appendChild(group);
        var element = createElement('line');

        group.appendChild(element);
        thisElement = group.children[0];
        element.setAttributeNS(null, 'x1', thisSvg[0][0]);      // start x
        element.setAttributeNS(null, 'y1', thisSvg[0][1]);      // start y
        element.setAttributeNS(null, 'x2', thisSvg[0][0]);      // end x
        element.setAttributeNS(null, 'y2', thisSvg[0][1]);      // end y
        svgInProgress = cursorMode;     // mark in progress
      }
      else {      // this is the terminus of this instance, so dissociate mouse move handler
        svgInProgress = false;
        setElementMouseoverOut(thisElement);
        unbindMouseHandlers(self);
      }
    }
    if (cursorMode == 'arrow') {     //  mouseDown starts creation, after, drag mouseUp ends
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        savedCursorMode = cursorMode;     // plant this to prevent immediate post-creation clearing
        thisSvg[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];
        var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        thisGroup = group;
        var newGroupID = 'g' + (document.getElementById("xlt").childElementCount + 1).toString();
        group.setAttributeNS(null, 'id', newGroupID);
        group.setAttributeNS(null, 'type', cursorMode);
        document.getElementById("xlt").appendChild(group);
        var element = createElement('line');

        group.appendChild(element);
        thisElement = group.children[0];
        element.setAttributeNS(null, 'x1', thisSvg[0][0]);      // start x
        element.setAttributeNS(null, 'y1', thisSvg[0][1]);      // start y
        element.setAttributeNS(null, 'x2', thisSvg[0][0]);      // end x
        element.setAttributeNS(null, 'y2', thisSvg[0][1]);      // end y
        svgInProgress = cursorMode;     // mark in progress
      }
      else {      // this is the terminus of this instance, so dissociate mouse move handler
        svgInProgress = false;
        setElementMouseoverOut(thisElement);
        unbindMouseHandlers(self);
      }
    }
    if (cursorMode == 'circle') {     // mouseDown    // modified to use common element for handlers
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        if (thisGroup != null) {      //  ////////////// ???
          clearEditElement(thisGroup);    // this group is the one with bubbles, to be obviated
        }
        savedCursorMode = cursorMode;     // plant this to prevent immediate post-creation clearing
        thisSvg[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];
        var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        var newGroupID = 'g' + (document.getElementById("xlt").childElementCount + 1).toString();
        group.setAttributeNS(null, 'id', newGroupID);
        document.getElementById("xlt").appendChild(group);
        var element = createElement(cursorMode);      // new generalized method

        group.appendChild(element);
        thisGroup = group;
        thisElement = group.children[0];     // this var is used to dynamically create the element
        element.setAttributeNS(null, 'cx', thisSvg[0][0]);      // start x
        element.setAttributeNS(null, 'cy', thisSvg[0][1]);      // start y
        element.setAttributeNS(null, 'r', 1);      // width x
        svgInProgress = cursorMode;     // mark in progress
      }
      // now using mouseup event exclusively to terminate circle
    }
    if (cursorMode == 'ellipse') {     // mouseDown
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        savedCursorMode = cursorMode;     // plant this to prevent immediate post-creation clearing
        thisSvg[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];
        var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        thisGroup = group;
        var newGroupID = 'g' + (document.getElementById("xlt").childElementCount + 1).toString();
        group.setAttributeNS(null, 'id', newGroupID);
        document.getElementById("xlt").appendChild(group);
        var element = createElement('ellipse');

        group.appendChild(element);
        thisElement = group.children[0];
        element.setAttributeNS(null, 'cx', thisSvg[0][0]);      // start x
        element.setAttributeNS(null, 'cy', thisSvg[0][1]);      // start y
        element.setAttributeNS(null, 'rx', 1);      // radius x
        element.setAttributeNS(null, 'ry', 1);      // radius y
        svgInProgress = cursorMode;     // mark in progress
      }
      else {      // this is the terminus of this instance, so dissociate mouse move handler
        svgInProgress = false;
        setElementMouseOverOut(thisElement);
        unbindMouseHandlers(self);
      }
    }
    if (cursorMode == 'draw') {     // mouseDown
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        savedCursorMode = cursorMode;     // plant this to prevent immediate post-creation clearing
        thisSvg[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];
        var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        thisGroup = group;
        var newGroupID = 'g' + (document.getElementById("xlt").childElementCount + 1).toString();
        group.setAttributeNS(null, 'id', newGroupID);
        document.getElementById("xlt").appendChild(group);
        //for (j = 0; j < thisSvg.length; j++) {              // for text mode there is only one
        var element = createElement('polyline');

        group.appendChild(element);
        thisElement = group.children[0];
        element.setAttributeNS(null, 'points', thisSvg[0][0].toFixed(2).toString()
          + ',' + thisSvg[0][1].toFixed(2).toString() + ' ');      // start x,y
        //}
        svgInProgress = cursorMode;     // mark in progress
      }
      else {      // this is the terminus of this instance, so dissociate mouse move handler
        svgInProgress = false;
        setMouseoverOut(thisElement);
        unbindMouseHandlers(self);
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
        thisSvg[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];
        var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        thisGroup = group;
        var newGroupID = 'g' + (document.getElementById("xlt").childElementCount + 1).toString();
        group.setAttributeNS(null, 'id', newGroupID);
        document.getElementById("xlt").appendChild(group);
        var element = createElement('path');

        group.appendChild(element);
        thisElement = group.children[0];
        var thisX = thisSvg[0][0];
        var thisY = thisSvg[0][1];
        element.setAttributeNS(null, 'd', getCurvePath(thisX, thisY, thisX, thisY, thisX, thisY, thisX, thisY));
        svgInProgress = cursorMode;     // mark in progress
      }
      else {      // this is the terminus of this instance, so dissociate mouse move handler
        svgInProgress = false;
        setElementMouseOverOut(thisElement);
        unbindMouseHandlers(self);
      }
    }
    if (cursorMode == "text") {     // mouseDown - could be initial click, revised position click, or preemie
      if (thisElement) {
        // removeCursorFromSvgText();    //  ////////// fix case of new <text>-click disrupts active <text> creation
        finishTextGroup();
        // setCursorMode("text");        // since above currently switches mode to MOVE
      }
      // if (thisGroup) {
      //   if (thisGroup.childElementCount > 1) {   // this is the case where there is a click on a mouseovered
      //     thisGroup.lastChild.remove();
      //     return false;
      //   }
      // }
      if (svgInProgress == false) {
        thisSvg[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];
        savedCursorMode = cursorMode;     // plant this to prevent immediate post-creation clearing
        var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        thisGroup = group;
        var newGroupID = 'g' + (document.getElementById("xlt").childElementCount + 1).toString();
        group.setAttributeNS(null, 'id', newGroupID);
        document.getElementById("xlt").appendChild(group);
        //for (j = 0; j < thisSvg.length; j++) {              // for text mode there is only one
        var element;
        element = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        //document.getElementById(group.id).appendChild(element);
        group.appendChild(element);
        // thisSvgText = group.children[0];
        thisElement = group.children[0];
        element.setAttributeNS(null, 'stroke', cursorColor);
        element.setAttributeNS(null, 'stroke-width', '1');
        element.setAttributeNS(null, 'stroke-opacity', '1.0');
        element.setAttributeNS(null, 'x', thisSvg[0][0]);      // start x
        element.setAttributeNS(null, 'y', thisSvg[0][1]);      // start y
        element.setAttributeNS(null, 'style', 'font-family: ' + textFont + '; fill: ' + cursorColor.toString() + ';');
        element.setAttributeNS(null, 'font-size', textHeight);
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
};

function pathPoint(x, y) {
  return parseInt(x) + ", " + parseInt(y);
}

function curvePoint(x, y) {
  return pathPoint(x, y) + ", ";
}

function getCurvePath(x1, y1, cx1, cy1, cx2, cy2, x2, y2) {
  if (cursorMode == 'cubic') {
    return "M " + pathPoint(x1, y1) + " C " + curvePoint(cx1, cy1)
      + curvePoint(cx2, cy2) + pathPoint(x2, y2);
  }
  else return "M " + pathPoint(x1, y1) + " Q " + curvePoint(cx1, cy1) + pathPoint(x2, y2);
}

function getCurveCoords(d) {
  var pieces = d.replace(/,/g, '').split(' ');
  var j = 0;
  var coords = [];
  for (var k = 0; k < pieces.length; k++) {
    if (isNumeric(pieces[k])) {   // bypass the curve type symbol
      coords[j] = pieces[k];
      j++;
    }
  }
  return coords;
}

function getCurvePoints(coords) {   // special bounding poly for curve
  return curvePoint(coords[0], coords[1]) + ' ' + curvePoint(coords[2], coords[3]) + ' '
    + curvePoint(coords[4], coords[5]) + ' ' + curvePoint(coords[6], coords[7]);
}

function createElement(type) {
  var element = document.createElementNS('http://www.w3.org/2000/svg', type);
  element.setAttributeNS(null, 'stroke', cursorColor);
  element.setAttributeNS(null, 'stroke-width', strokeWidth);
  element.setAttributeNS(null, 'stroke-opacity', '0.9');
  element.setAttributeNS(null, 'fill', '');
  element.setAttributeNS(null, 'fill-opacity', '0.0');
  element.setAttributeNS(null, 'stroke-linecap', 'round');
  return element;
}

function setMouseoverOut(element) {
  element.setAttributeNS(null, 'onmouseover', "this.attributes['stroke-width'].value = '" + 1.5 * strokeWidth + "';");
  element.setAttributeNS(null, 'onmouseout', "this.attributes['stroke-width'].value = " + strokeWidth + ";");
  return element;
}

function setElementMouseOverOut(group) {     // this actually sets the parent group's listeners
  if (group == null) {
    group = null;         //  debug catch point
  }
  group.setAttributeNS(null, 'onmouseenter', "setEditElement(this);");               // new reference method 14NOV
  group.setAttributeNS(null, 'onmouseleave', "clearEditElement(this);");      // global var
  return group;
}

function setEditElement(group) {    // add bubble elements to the group containing this element
  if (checkElementConflict(group)) {    // returns true if conflict
    return;
  }
  if (thisGroup == null) {    // no conflicts detected, so if thisGroup is null,
    thisGroup = group;        // there is probably no creation activity
  }
  //if (group.firstChild.tagName != cursorMode) {    // start editing an element not in the current mode
  savedCursorMode = cursorMode;   // don't wait for actual action on bubble
  if (group.firstChild) {
    if (group.firstChild.tagName != 'path') {
      if (group.attributes.type) {                   // type atribute existence
        cursorMode = group.attributes.type.value;
      }
      else {
        cursorMode = group.firstChild.tagName;
      }
    }
    else {                  // now that there are both cubic and quadratic curves, we must detect this one's type
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
  // var element = group.firstChild;                  // new method using createBubbleGroup
  var bubbleGroup = createBubbleGroup(group);      // since bubble groups are heterogeneous in structure
  group.appendChild(bubbleGroup);             // make the new bubble group in a no-id <g>
}

function clearEditElement(group) {   // given containing group; invoked by mouseleave, so order of statements reordered
  // if (checkElementConflict(group)) {
  //   return;                                 //  ///////////////  this logic is wrong when switching modes
  // }
  if (svgInProgress == 'SHIFT') {       // if we are shifting an element, do nothing
    return;
  }
  if (!group) {                         // if we are misassociated just back away . . .
    return;
  }
  if (waitElement) {
    return;
  }
  if (group.childNodes.length > 1) {   // do I have bubbles? i.e., is there more than just the golden chile?
    if ((group.lastChild.tagName == 'circle') || (group.lastChild.tagName == 'g')) { // poly- bubbles have a child group
      group.lastChild.remove();         // this is the group of bubbles (and maybe nested ones) if not just a SHIFT bubble
      // clearEditElement(group);
      thisBubble = null;
      setElementMouseOverOut(group);
      cursorMode = 'MOVE';    // was savedCursorMode;   // on exit of edit mode, restore
      indicateMode(cursorMode);
      svgInProgress = false;
      thisElement = null;
      thisGroup = null;
    }
    else {
      if (group.firstChild.tagName == 'text') {
        if (svgInProgress == 'text') {
          finishTextGroup();
        }
      }
    }
  }
  //group./*firstChild.*/attributes['onmouseenter'].value = "this.firstChild.attributes['stroke-width'].value = '" + 1.5 * strokeWidth + "'; setEditElement(this.firstChild);"    // replant the listener in the real element
  //setElementMouseOverOut(group);
  //cursorMode = 'MOVE';    // was savedCursorMode;   // on exit of edit mode, restore
  //indicateMode(cursorMode);
  //svgInProgress = false;
  //thisElement = null;
  //thisGroup = null;
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
    return true;
  }
  if (!svgInProgress) {
    return false;     // if no active element
  }
  if (svgInProgress != group.firstChild.tagName) {
    return true;     //  if we crossed another element
  }
  if (thisGroup != group) {
    return true;
  }
}

function exitEditPoint(group) {    // services mouseUp from SIZE/point bubble
  // reset all bubbles for this element
  //clearEditElement(group);
  //setEditElement(group);
  // above introduced glitch where repositioned point is dissociated and ends up at last point
  // so just recalculate the points instead
  //if (group.childElementCount > 1) {
  //  group.lastChild.remove();                        // eliminates all bubbles
  //  //group.appendChild(createBubbleGroup(group));    // reconstitutes new bubbles (clearly, this is done elswhere)
  //}
  while ((group.childElementCount > 1) && (group.lastChild.tagName = 'g')) {             // changed from group.childElementCount > 1
    group.lastChild.remove();                        // eliminates all bubbles
  }
  svgInProgress = false;  ///////////////
  thisBubble = null;
  //cursorMode = "MOVE";  //was savedCursorMode; ////////////// actually editing element unchains creation of this type
  setCursorMode("MOVE");
  setElementMouseOverOut(group);
}

function setMoveElement(bubble) {    // end of SHIFT leaves single bubble; should be removed on mouseleave of group
  //thisParent = element;                           // group containing real element and the bubbles group
  var group = bubble.parentNode.parentNode;          // set group for mousemove
  thisGroup = group;          // set group for mousemove
  thisElement = group.firstChild;
  thisBubble = group.lastChild.firstChild;      // this is the center/first bubble
  cursorMode = thisElement.tagName;
  thisGroup.attributes['onmouseenter'].value = ''; // disable mouseover on real circle's containing group
  var endK = group.lastChild.childElementCount;        // total bubbles, leave the first one
  for (var k = endK; k > 1; k--) {
    group.lastChild.lastChild.remove();      // remove resize bubbles from the end
  }
  group.attributes['onmouseenter'].value = '';    // turn off enter!
  //group.attributes['onmouseleave'].value = '';    // turn off leave!
  //group.setAttribute('onmouseout', 'clearEditElement(this);');      // as of right NOW
//  eliminated savedCursorMode = 'MOVE';
  svgInProgress = 'SHIFT';
}

function setSizeElement(bubble) {       // this sets up the single point functions
  //thisParent = element;                           // group containing real element and the bubbles group
  //thisElement = group.firstChild;    // this is the real element
  //cursorMode = group.firstChild.tagName;  // extract its tag
  thisBubble = bubble;
  var group = bubble.parentNode.parentNode;          // set group for mousemove
  thisGroup = group;
  thisElement = group.firstChild;    // this is the real element
  if (!((cursorMode == 'cubic') || (cursorMode == 'quadratic'))) {      // tagName will be 'path'
    cursorMode = thisElement.tagName;
  }
  group.attributes['onmouseenter'].value = ''; // disable mouseover on real element's containing group
  group.attributes['onmouseleave'].value = ''; // disable mouseleaver on real element's containing group
  if (!((cursorMode == 'cubic') || (cursorMode == 'quadratic'))) {      // tagName will be 'path'
    if (group.childElementCount > 1) {         // if more than one child, we have bubbles
      group.lastChild.remove();      // remove ALL bubbles, since we are going to drop into drag radius
    }
  }
//  eliminated savedCursorMode = 'MOVE';
  svgInProgress = 'SIZE';                     // so we have an active element, and it has been marked in progress
  // look for mousedown in handler for circle to transition to rubber band mode
}                                       // use mouseup or mousedown to terminate radius drag

function setPointElement(bubble) {    // this performs the inline substitution of the selected bubble coordinates
  if (thisBubble == bubble) {   // this condition implies we mouseDowned on the point we are changing
// breakpoint convenience point
  }
  thisBubble = bubble;
  var group = bubble.parentNode.parentNode;          // set group for mousemove
  thisGroup = group;
  thisElement = group.firstChild;    // this is the real element
  if (parseInt(bubble.id) == bubble.parentNode.childElementCount - 1) {   // last point/bubble?
    thisBubble = bubble;
  }
  bubble.parentNode.lastChild.remove(); // /////////// this is the fight place: remove insert point bubbles
  if (thisGroup.attributes.type) {
    cursorMode = thisGroup.attributes.type.value;
  }
  else {
    cursorMode = thisElement.tagName;
  }
  group.attributes['onmouseenter'].value = ''; // disable mouseover on real element's containing group
  group.attributes['onmouseleave'].value = ''; // disable mouseleave on real element's containing group
  bubble.attributes['onmousedown'].value = '';  // cascade to onSvgMouseDown
  //bubble.attributes['onmouseup'].value = '';  // calculate/populate insert point
  //if (group.childElementCount > 1) {         // if more than one child, we have bubbles
  //  group.lastChild.remove();      // remove ALL bubbles, since we are going to drop into drag point
  //}
//  eliminated savedCursorMode = 'MOVE';
  svgInProgress = 'POINT';                     // so we have an active element, and it has been marked in progress
  // look for mousedown in handler for circle to transition to rubber band mode
}                                       // use mouseup or mousedown to terminate radius drag

function setNewPointElement(bubble) {     // this inserts the new point into the <poly.. element
  if (thisBubble == bubble) {   // this condition implies we mouseDowned on the point we are INSERTING
    var BreakHere = true;    // /////////  VERY PRELIM
  }
  thisBubble = bubble;
  var group = bubble.parentNode.parentNode.parentNode;          // set group for mousemove handler
  thisGroup = group;
  thisElement = group.firstChild;    // this is the real element
  if (parseInt(bubble.id) == bubble.parentNode.childElementCount - 1) {
    thisBubble = bubble;
  }
  cursorMode = thisElement.tagName;
  group.attributes['onmouseenter'].value = ''; // disable mouseover on real element's containing group
  group.attributes['onmouseleave'].value = ''; // disable mouseleaver on real element's containing group
  bubble.attributes['onmousedown'].value = '';  // cascade to onSvgMouseDown
  thisElement.attributes['points'].value = insertNewPoint(thisElement, thisBubble);
  thisBubble.id = (parseInt(thisBubble.id) + 1).toString();   // ///////// seems to work, but...
  //group.lastChild.lastChild.removeChild();      // ///////// vaporize the intermediate newPointBubbles' group
// need mouseup on this bubble to reshfuffle bubbles -- now being handled by removing x.5 bubbles
//  bubble.attributes['onmouseup'].value = 'setEditElement(this.parentNode.parentNode);';
//  eliminated savedCursorMode = 'MOVE';
  svgInProgress = 'NEW';                     // so we have an active element, and it has been marked in progress
  // look for mousedown in handler for circle to transition to rubber band mode
}                                       // use mouseup or mousedown to terminate radius drag

function insertNewPoint(element, bubble) {     //this bubble's ID truncated is the point to insert AFTER
  var splitPoints = element.attributes['points'].value.trim().split(' ');
  var thesePoints = '';
  var insertionPoint = parseInt(bubble.id);
  var thisPoint = bubble.attributes['cx'].value + ',' + bubble.attributes['cy'].value;
  for (var k = 0; k < splitPoints.length; k++) {
    thesePoints += splitPoints[k] + ' ';
    if (k == insertionPoint) {
      thesePoints += thisPoint + ' ';
    }
  }
  return thesePoints;
}

function createBubbleGroup(group) {
  var svgAttrs = {};
  var thisX;
  var thisY;
  var splitPoints;
  var nextX;
  var nextY;
  var element = group.firstChild;
  svgAttrs = getModel(element.tagName);
  if (element.tagName != 'path') {    // /////// skip this step for path exception
    for (var key in svgAttrs) {     // collect basic (numeric) attributes for positioning and extent
      svgAttrs[key] = getAttributeValue(element, key);       // collect this numeric attribute
    }
  }
  var bubbleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  // var bubble;

  switch (element.tagName) {
    case 'circle':    // 1 relocation bubble, 4 compass-point resize bubbles (flagged SHIFT and SIZE respecively)
      var cx = svgAttrs['cx'];
      var cy = svgAttrs['cy'];
      var cr = svgAttrs['r'];
      bubbleGroup.appendChild(createShiftBubble(cx, cy));    // this is the center point of both bubble and circle
      bubbleGroup.appendChild(createSizeBubble(cr + cx, cy));    // this is the E resize point
      bubbleGroup.appendChild(createSizeBubble(cx, cr + cy));    // this is the S resize point
      bubbleGroup.appendChild(createSizeBubble(cx - cr, cy));    // this is the W resize point
      bubbleGroup.appendChild(createSizeBubble(cx, cy - cr));    // this is the N resize point
      return bubbleGroup;
    case 'ellipse':    // 1 relocation bubble, 4 compass-point resize bubbles (flagged SHIFT and SIZE respecively)
      var cx = svgAttrs['cx'];
      var cy = svgAttrs['cy'];
      var rx = svgAttrs['rx'];
      var ry = svgAttrs['ry'];
      bubbleGroup.appendChild(createShiftBubble(cx, cy));    // this is the center point of both bubble and circle
      bubbleGroup.appendChild(createSizeBubble(rx + cx, cy));    // this is the E resize point
      bubbleGroup.appendChild(createSizeBubble(cx, ry + cy));    // this is the S resize point
      bubbleGroup.appendChild(createSizeBubble(cx - rx, cy));    // this is the W resize point
      bubbleGroup.appendChild(createSizeBubble(cx, cy - ry));    // this is the N resize point
      return bubbleGroup;
    case 'rect':
      var x = svgAttrs['x'];
      var y = svgAttrs['y'];
      var w = svgAttrs['width'];
      var h = svgAttrs['height'];
      bubbleGroup.appendChild(createShiftBubble(x, y));     // this is the rectangle origin, anomalous as it may be
      bubbleGroup.appendChild(createSizeBubble(x + w, y + h));    // this is the resize point
      return bubbleGroup;
    case 'line':
      var x1 = svgAttrs['x1'];
      var y1 = svgAttrs['y1'];
      var x2 = svgAttrs['x2'];
      var y2 = svgAttrs['y2'];
      bubbleGroup.appendChild(createPointBubble(x1, y1, 'x1-y1'));     // this is the 1st line coordinate
      bubbleGroup.appendChild(createPointBubble(x2, y2, 'x2-y2'));    // this is the 2nd (terminal) line point
      return bubbleGroup;
    case 'path':           // this is a MAJOR EXCEPTION to the other cases, used for curve !! articulate for type !!
      var theseCurvePoints = element.attributes['d'].value;
      var thisCurveTypeQuadratic = theseCurvePoints.indexOf('Q ') > 0;
      var theseCoords = getCurveCoords(theseCurvePoints);       // stack control points after end points after helpers
      // fill out both control points in either case
      if (thisCurveTypeQuadratic) {          // if quadratic
        theseCoords[6] = theseCoords[4];  // replicate p2
        theseCoords[7] = theseCoords[5];  // into last coord set
        theseCoords[4] = theseCoords[2];          // for both control points
        theseCoords[5] = theseCoords[3];          // for control lines
      }
      //theseCoords[2] = ((parseInt(theseCoords[0]) + parseInt(theseCoords[6])) / 2).toFixed();   // set to
      //theseCoords[3] = ((parseInt(theseCoords[1]) + parseInt(theseCoords[7])) / 2).toFixed();   // mean point
      // create the lines between the control point(s) and the endpoints
      bubbleGroup.appendChild(createControlLine(theseCoords[0], theseCoords[1], theseCoords[2], theseCoords[3], 'l1'));
      bubbleGroup.appendChild(createControlLine(theseCoords[4], theseCoords[5], theseCoords[6], theseCoords[7], 'l2'));
      // create the "bounding" polygon  'poly'
      bubbleGroup.appendChild(createCurvePoly(theseCoords, 'poly'));
      bubbleGroup.appendChild(createCurveBubble(theseCoords[0], theseCoords[1], 'p1'));   // first endpoint
      bubbleGroup.appendChild(createCurveBubble(theseCoords[6], theseCoords[7], 'p2'));   // second endpoint
      bubbleGroup.appendChild(createCurveBubble(theseCoords[2], theseCoords[3], 'c1'));   // first control point
      if (!thisCurveTypeQuadratic) {
        bubbleGroup.appendChild(createCurveBubble(theseCoords[4], theseCoords[5], 'c2'));   // second control point
      }
      return bubbleGroup;
    case 'polygon':
    case 'polyline':      // create a parallel structure to the point attr, using its coords
      var thesePoints = element.attributes['points'].value.trim();      // trim to eliminate extraneous empty string
      splitPoints = thesePoints.split(' ');
      var thisPoint = splitPoints[0].split(',');   // prime the pump for iteration
      thisX = parseFloat(thisPoint[0]);
      thisY = parseFloat(thisPoint[1]);
      var nextPoint;                      // nextX,nextY these are used to bound and calculate the intermediate
      // insert new point bubbles in separate parallel group
      var newBubbleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      for (var k = 0; k < splitPoints.length; k++) {    // append this point and an intermediary point
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
        var thisID = (splitPoints.length - 1).toString() + '.5';
        newBubbleGroup.appendChild(createNewPointBubble(0.5 * (thisX + nextX), 0.5 * (thisY + nextY), thisID));
      }
      bubbleGroup.appendChild(newBubbleGroup);   // add the new point insertion bubbles
      return bubbleGroup;
    case 'text':
      thisX = svgAttrs['x'];
      thisY = svgAttrs['y'];
      bubbleGroup.appendChild(createShiftBubble(thisX, thisY));
      return bubbleGroup;
  }
}

function createShiftBubble(cx, cy) {
  var bubble = createBubbleStub(cx, cy);
  bubble.setAttributeNS(null, 'fill-opacity', '0.8');         // SHIFT bubble is slightly more opaque
  bubble.setAttributeNS(null, 'onmousedown', "setMoveElement(this);");
  bubble.setAttributeNS(null, 'onmouseup', "setElementMouseOverOut(this);");
  bubble.setAttributeNS(null, 'style', 'cursor:move;');
  return bubble;
}

function createSizeBubble(cx, cy, id) {
  var bubble = createBubbleStub(cx, cy);
  bubble.setAttributeNS(null, 'fill-opacity', '0.6');         // SIZE/POINT bubble is slightly less opaque
  bubble.setAttributeNS(null, 'onmousedown', "setSizeElement(this);");
  bubble.setAttributeNS(null, 'id', id);    // use this identifier to attach cursor in onSvgMouseMove
  return bubble;
}

function createPointBubble(cx, cy, id) {    // used for <poly...> vertices
  var bubble = createBubbleStub(cx, cy);
  bubble.setAttributeNS(null, 'fill-opacity', '0.6');         // SIZE/POINT bubble is slightly less opaque
  bubble.setAttributeNS(null, 'onmousedown', "setPointElement(this);");
  bubble.setAttributeNS(null, 'onmouseup', "exitEditPoint(thisGroup);");   // questionable reference
  bubble.setAttributeNS(null, 'id', id);    // use this identifier to attach cursor in onSvgMouseMove
                                            // will take the form: 'x1-y1', 'x2-y2' for <line>,
                                            // will take the form: '0', '13' for <poly-...>
  return bubble;
}

function createNewPointBubble(cx, cy, id) {    // used for <poly...> inter-vertex insert new point
  var bubble = createBubbleStub(cx, cy);
  bubble.setAttributeNS(null, 'r', bubbleRadius * 0.8);      // radius override for insertion point
  bubble.setAttributeNS(null, 'stroke', '#555555');     // not that great, use below
  bubble.setAttributeNS(null, 'stroke-opacity', '0.6');     // not that great, use below
  bubble.setAttributeNS(null, 'fill-opacity', '0.4');         // SIZE/POINT bubble is even less opaque
  bubble.setAttributeNS(null, 'onmousedown', "setNewPointElement(this);");
  bubble.setAttributeNS(null, 'onmouseup', 'exitEditPoint(thisGroup);');
  bubble.setAttributeNS(null, 'id', id);    // use this identifier to attach cursor in onSvgMouseMove
                                            // will take the form: '0.5', '23.5' for <poly-...>
  return bubble;
}

function createCurveBubble(cx, cy, id) {    // used for <path...> inter-vertex control point
  var bubble = createBubbleStub(cx, cy);
  bubble.setAttributeNS(null, 'r', bubbleRadius * 1.25);      // radius override for insertion point
  bubble.setAttributeNS(null, 'stroke', '#333333');     // not that great, use below
  bubble.setAttributeNS(null, 'stroke-opacity', '0.6');     // not that great, use below
  bubble.setAttributeNS(null, 'fill-opacity', '0.8');         // make these stand out
  bubble.setAttributeNS(null, 'onmousedown', "setSizeElement(this);");    //  ///////////  change?
  bubble.setAttributeNS(null, 'onmouseup', 'exitEditPoint(thisGroup);');
  bubble.setAttributeNS(null, 'id', id);    // use this identifier to attach cursor in onSvgMouseMove
                                            // will take the form: 'c1', 'c2' for <path-...>
  return bubble;
}

function createControlLine(x1, y1, x2, y2, id) {
  var line = createElement('line');
  line.setAttributeNS(null, 'x1', x1);
  line.setAttributeNS(null, 'y1', y1);
  line.setAttributeNS(null, 'x2', x2);
  line.setAttributeNS(null, 'y2', y2);
  line.setAttributeNS(null, 'id', id);
  line.setAttributeNS(null, 'stroke-width', '1');
  return line;
}

function createCurvePoly(coords) {        // used by createBubbleGroup.path
  var poly = createElement('polyline');
  poly.setAttributeNS(null, 'id', 'poly');
  poly.setAttributeNS(null, 'points', getCurvePoints(coords));
  poly.setAttributeNS(null, 'stroke-opacity', '0.0');
  return poly;
}

function createBubbleStub(offsetX, offsetY) {   // create same-size bubble
  var bubble = createElement('circle');      // this is constant, since it is a bubble
  //bubbleGroup.appendChild(bubble);    // delegate this to caller
  if (isNaN(offsetX)) {
    alert(offsetX);
  }
  if (isNaN(offsetY)) {
    alert(offsetY);
  }
  //thisCircle = group.children[0];     // this var is used to dynamically create the element
  bubble.setAttributeNS(null, 'cx', offsetX);      // start x
  bubble.setAttributeNS(null, 'cy', offsetY);      // start y
  bubble.setAttributeNS(null, 'r', bubbleRadius);      // radius
  bubble.setAttributeNS(null, 'fill', '#FFFFFF');
  bubble.setAttributeNS(null, 'stroke', '#222222');   // set scaffold attrs
  bubble.setAttributeNS(null, 'stroke-width', bubbleRadius * 0.25);
  //attrs.forEach
  return bubble;
}

function getAttributeValue(element, attr) {     // convert string numeric and truncate to one place after decimal
  return parseFloat(parseFloat(element.attributes[attr].value).toFixed(1));
}

function getModel(element) {            // by svg element type, return its salient model attributes for bubbles
  var ox = 0;
  var oy = 0;
  var p1 = 1;
  var p2 = 1;
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


function unbindMouseHandlers(self) {    //   /////////////  this routine and its usages should be excised
  if (self.event != 'mouseup') {
    return false;                 // ////// this is always happening
  }
  //$(document).unbind(self.mouseMoveEvent, self.mouseMoveHandler);   // unbinding on mouse UP
  //$(document).unbind(self.mouseUpEvent, self.mouseUpHandler);
// kill the linkage to the handler
//  self.mouseMoveHandler = null;
//  self.mouseUpHandler = null;
}

SVGDraw.prototype.onSvgMouseMove = function () {
  var self = this;
  return function (event) {

    self.renderFunction(event);
    event.preventDefault();
    return false;
  }
};

function length2points(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow((x1 - x2), 2) + (Math.pow((y1 - y2), 2)));
}

var Trig = {
  distanceBetween2Points: function (point1, point2) {

    var dx = point2.x - point1.x;
    var dy = point2.y - point1.y;
    return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
  },

  angleBetween2Points: function (point1, point2) {

    var dx = point2.x - point1.x;
    var dy = point2.y - point1.y;
    return Math.atan2(dx, dy);
  }
};

SVGDraw.prototype.updateMousePosition = function (event) {
  var target;
  if (this.touchSupported) {
    target = event.originalEvent.touches[0]
  }
  else {
    target = event;
  }
  var offset = svgOffset;    //  was this.canvas.offset();
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
      var thisPoint = ((lastMouseX - xC) / zoom).toFixed(2).toString()
        + ',' + ((lastMouseY - yC) / zoom).toFixed(2).toString();
      var thesePoints = thisElement.attributes['points'].value.trim();
      var splitPoints = thesePoints.split(' ');
      if (thisBubble != null) {       // look for bubble to denote just move THIS point only
        thisBubble.attributes['cx'].value = (lastMouseX - xC) / zoom;     // translate the bubble
        thisBubble.attributes['cy'].value = (lastMouseY - yC) / zoom;
        if (isNumeric(thisBubble.id)) {       // presume integer for now
          splitPoints[parseInt(thisBubble.id)] = thisPoint;
          thesePoints = '';
          for (var k = 0; k < splitPoints.length; k++) {
            thesePoints += splitPoints[k] + ' ';
          }
          thisElement.attributes['points'].value = thesePoints
        }
      }
      else {        // svgInProgress = 'polygon', so normal creation of element adding new point to end
        thesePoints = '';                               // clear thecollector
        for (k = 0; k < splitPoints.length - 1; k++) {  // reconstruct except for the last point
          thesePoints += splitPoints[k] + ' ';          // space delimiter at the end of each coordinate
        }
        thisPoint += ' ';
        thisElement.attributes['points'].value = thesePoints.concat(thisPoint);
      }
      //thisElement.attributes['stroke'].value = cursorColor;   ///// disabled due to unwanted side effects
    }
    else if (cursorMode == "polyline") {
      if (svgInProgress == false) {
        return;
      }
      this.updateMousePosition(event);
      var thisPoint = ((lastMouseX - xC) / zoom).toFixed(2).toString()
        + ',' + ((lastMouseY - yC) / zoom).toFixed(2).toString();
      var thesePoints = thisElement.attributes['points'].value.trim();
      var splitPoints = thesePoints.split(' ');
      if (thisBubble != null) {       // look for bubble to denote just move THIS point only
        // currently, no distinction is made between existing vertex and new point
        // however, this may change in the future JRF 23NOV15
        thisBubble.attributes['cx'].value = (lastMouseX - xC) / zoom;     // translate the bubble
        thisBubble.attributes['cy'].value = (lastMouseY - yC) / zoom;
        if (isNumeric(thisBubble.id)) {       // presume integer for now
          splitPoints[parseInt(thisBubble.id)] = thisPoint;   // replace this point
          thesePoints = '';
          for (var k = 0; k < splitPoints.length; k++) {
            thesePoints += splitPoints[k] + ' ';
          }
          thisElement.attributes['points'].value = thesePoints
        }
      }
      else {
        thesePoints = '';                               // clear the collector
        for (k = 0; k < splitPoints.length - 1; k++) {  // reconstruct except for the last point
          thesePoints += splitPoints[k] + ' ';          // space delimiter at the end of each coordinate
        }
        thisPoint += ' ';
        thisElement.attributes['points'].value = thesePoints.concat(thisPoint);
      }
      //thisElement.attributes['stroke'].value = cursorColor;   ///// disabled due to unwanted side effects
    }
    else if ((cursorMode == "rect") /*|| (cursorMode == 'bubble')*/) {
      //lastMouseX = this.lastMousePoint.x;
      //lastMouseY = this.lastMousePoint.y;
      if (/*(event.type == 'mousedown') || */(svgInProgress == false)) {
        return;
      }
      if (svgInProgress == 'SHIFT') {
        this.updateMousePosition(event);
        thisBubble.attributes['cx'].value = (lastMouseX - xC) / zoom;     // translate the bubble
        thisBubble.attributes['cy'].value = (lastMouseY - yC) / zoom;
        thisElement.attributes['x'].value = (lastMouseX - xC) / zoom;    // correspondingly translate thisElement
        thisElement.attributes['y'].value = (lastMouseY - yC) / zoom;
      }
      else {
        var thisRectX = thisElement.attributes['x'].value;
        var thisRectY = thisElement.attributes['y'].value;
        // var thisRectW = thisElement.attributes['width'].value;
        // var thisRectH = thisElement.attributes['height'].value;

        this.updateMousePosition(event);
        thisElement.attributes['width'].value = (lastMouseX - xC) / zoom - thisRectX;
        thisElement.attributes['height'].value = (lastMouseY - yC) / zoom - thisRectY;
        //thisElement.attributes['stroke'] = cursorColor;   ///// disabled due to unwanted side effects
      }
    }
    else if (cursorMode == "line") {
      lastMouseX = this.lastMousePoint.x;
      lastMouseY = this.lastMousePoint.y;
      if ((event.type == 'mousedown') || (svgInProgress == false)) {    // extra condition for line
        return;
      }
      this.updateMousePosition(event);
      var linePoints = ['x2', 'y2'];          // preset for normal post-creation mode
      if (thisBubble != null) {       // look for bubble to denote just move THIS point only
        thisBubble.attributes['cx'].value = (lastMouseX - xC) / zoom;     // translate the bubble
        thisBubble.attributes['cy'].value = (lastMouseY - yC) / zoom;
        if (!isNumeric(thisBubble.id)) {                 // presume either 'x1-y1' or 'x2-y2'
          linePoints = (thisBubble.id).split('-');      // this will result in ['x1', 'y1'] or  ['x2', 'y2'] used below
        }
      }
      thisElement.attributes[linePoints[0]].value = (lastMouseX - xC) / zoom;
      thisElement.attributes[linePoints[1]].value = (lastMouseY - yC) / zoom;
      //thisElement.attributes['stroke'] = cursorColor;   ///// disabled due to unwanted side effects
    }
    else if (cursorMode == 'arrow') {
      lastMouseX = this.lastMousePoint.x;
      lastMouseY = this.lastMousePoint.y;
      if ((event.type == 'mousedown') || (svgInProgress == false)) {    // extra condition for line
        return;
      }
      this.updateMousePosition(event);
      var linePoints = ['x2', 'y2'];          // preset for normal post-creation mode
      if (thisBubble != null) {       // look for bubble to denote just move THIS point only
        thisBubble.attributes['cx'].value = (lastMouseX - xC) / zoom;     // translate the bubble
        thisBubble.attributes['cy'].value = (lastMouseY - yC) / zoom;
        if (!isNumeric(thisBubble.id)) {       // presume either 'x1-y1' or 'x2-y2'
          linePoints = (thisBubble.id).split('-');      // this will result in ['x1', 'y1'] or  ['x2', 'y2'] used below
        }
      }
      thisElement.attributes[linePoints[0]].value = (lastMouseX - xC) / zoom;
      thisElement.attributes[linePoints[1]].value = (lastMouseY - yC) / zoom;
      while (thisGroup.childElementCount > 1) {
        thisGroup.lastChild.remove();             // ///////////////////  VERY TEMPORARY METHOD
      }
      var thisX1 = thisElement.attributes['x1'].value;    // shorter references to original line's values
      var thisY1 = thisElement.attributes['y1'].value;
      var thisX2 = thisElement.attributes['x2'].value;
      var thisY2 = thisElement.attributes['y2'].value;
      var thisColor = thisElement.attributes['stroke'].value;
      var deltaX = thisX2 - thisX1;
      var deltaY = thisY2 - thisY1;
      var lineLength = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      var dx = deltaX / lineLength;
      var dy = deltaY / lineLength;
      if (document.getElementById('arrowHeadPixels').checked) {
        barbLength = document.getElementById('arrowHeadLength').value;
      }
      else {
        var barbLength = lineLength * arrowSize/ 100;
      }
      var pctX = parseFloat(thisX2/* - deltaX / arrowSize*/) - (dx * barbLength);   //  baseline for barb trailing end
      var pctY = parseFloat(thisY2/* - deltaY / arrowSize*/) - (dy * barbLength);
      var x3 = pctX + barbLength * dy / 2;
      var y3 = pctY - barbLength * dx / 2;
      var x4 = pctX - barbLength * dy / 2;
      var y4 = pctY + barbLength * dx / 2;

      var leftBarb = createElement('line');
      thisGroup.appendChild(leftBarb);
      leftBarb.setAttributeNS(null, 'x1', thisX2);       // start x of barbs
      leftBarb.setAttributeNS(null, 'y1', thisY2);      // start y of barbs
      leftBarb.setAttributeNS(null, 'x2', x3);      // end x
      leftBarb.setAttributeNS(null, 'y2', y3);      // end y
      leftBarb.setAttributeNS(null, 'stroke', thisColor);
      var rightBarb = createElement('line');
      thisGroup.appendChild(rightBarb);
      rightBarb.setAttributeNS(null, 'x1', thisX2);       // start x of barbs
      rightBarb.setAttributeNS(null, 'y1', thisY2);      // start y of barbs
      rightBarb.setAttributeNS(null, 'x2', x4);      // end x
      rightBarb.setAttributeNS(null, 'y2', y4);      // end y
      rightBarb.setAttributeNS(null, 'stroke', thisColor);
      var baseBarb;
      if(document.getElementById('arrowHeadClosed').checked) {
        baseBarb = createElement('line');
        thisGroup.appendChild(baseBarb);
        baseBarb.setAttributeNS(null, 'x1', x3);       // start x of barbs base
        baseBarb.setAttributeNS(null, 'y1', y3);      // start y of barbs base
        baseBarb.setAttributeNS(null, 'x2', x4);      // end x
        baseBarb.setAttributeNS(null, 'y2', y4);      // end y
        baseBarb.setAttributeNS(null, 'stroke', thisColor);
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
        thisElement.attributes['cx'].value = (lastMouseX - xC) / zoom;    // correspondingly translate thisElement
        thisElement.attributes['cy'].value = (lastMouseY - yC) / zoom;
      }
      else {                                // either resizing or originally sizing
        //this.context.moveTo(lastMouseX, lastMouseY);
        var thisCircX = thisElement.attributes['cx'].value;
        var thisCircY = thisElement.attributes['cy'].value;
        this.updateMousePosition(event);
        lastMouseX = this.lastMousePoint.x;
        lastMouseY = this.lastMousePoint.y;
        var radius = length2points(thisCircX, thisCircY, (lastMouseX - xC) / zoom, (lastMouseY - yC) / zoom);
        thisElement.attributes['r'].value = radius;
        //thisElement.attributes['stroke'].value = cursorColor;   ///// disabled due to unwanted side effects
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
        thisElement.attributes['cx'].value = (lastMouseX - xC) / zoom;    // correspondingly translate thisElement
        thisElement.attributes['cy'].value = (lastMouseY - yC) / zoom;
      }
      else {                              // resizing: note cursor does not osculate ellipse as in circle; sorry.
        var thisEllipseX = thisElement.attributes['cx'].value;
        var thisEllipseY = thisElement.attributes['cy'].value;

        this.updateMousePosition(event);
        lastMouseX = this.lastMousePoint.x;
        lastMouseY = this.lastMousePoint.y;
        thisElement.attributes['rx'].value = Math.abs(thisEllipseX - (lastMouseX - xC) / zoom);
        thisElement.attributes['ry'].value = Math.abs(thisEllipseY - (lastMouseY - yC) / zoom);
      }
      //thisElement.attributes['stroke'].value = cursorColor;   ///// disabled due to unwanted side effects
    }
    else if (cursorMode == "draw") {
      if (svgInProgress == false) {
        return;
      }
      this.updateMousePosition(event);
      var thesePoints = thisElement.attributes['points'].value;
      var thisPoint = ((lastMouseX - xC) / zoom).toFixed(2).toString()
        + ',' + ((lastMouseY - yC) / zoom).toFixed(2).toString() + ' ';
      thisElement.attributes['points'].value = thesePoints.concat(thisPoint);
    }
    else if ((cursorMode == 'cubic') || (cursorMode == 'quadratic')) {
      lastMouseX = this.lastMousePoint.x;
      lastMouseY = this.lastMousePoint.y;
      if ((event.type == 'mousedown') || (svgInProgress == false)) {    // extra condition for line
        return;
      }
      this.updateMousePosition(event);
      var thisDvalue = thisElement.attributes['d'].value;
      var thisCurveQuadratic = thisDvalue.indexOf('Q ') > 0;
      if (thisBubble != null) {       // look for bubble to denote just move THIS point only
                                      // currently, no distinction is made between existing vertex and new point
                                      // however, this may change in the future JRF 23NOV15
        var thisX = (lastMouseX - xC) / zoom;
        var thisY = (lastMouseY - yC) / zoom;
        thisBubble.attributes['cx'].value = thisX;     // translate the bubble
        thisBubble.attributes['cy'].value = thisY;
        var theseCoords = getCurveCoords(thisDvalue);
        if (thisCurveQuadratic) {
          theseCoords[6] = theseCoords[4];    // populate cubic curve p2
          theseCoords[7] = theseCoords[5];    // coordinates from quadratic values
        }
        switch (thisBubble.id) {
          case 'p1':
            theseCoords[0] = thisX.toFixed();
            theseCoords[1] = thisY.toFixed();
            break;
          case 'p2':
            theseCoords[6] = thisX.toFixed();
            theseCoords[7] = thisY.toFixed();
            break;
          case 'c1':
            theseCoords[2] = thisX.toFixed();
            theseCoords[3] = thisY.toFixed();
            break;
          case 'c2':
            theseCoords[4] = thisX.toFixed();
            theseCoords[5] = thisY.toFixed();
            break;
        }
        if (thisCurveQuadratic) {    // populate cubic curve control points from quadratic values
          theseCoords[4] = theseCoords[2];
          theseCoords[5] = theseCoords[3];
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
      else {    // defining initial curve as straight line, i.e., rubber-banding p2 until mouseup
        var thisX2 = (lastMouseX - xC) / zoom;
        var thisY2 = (lastMouseY - yC) / zoom;
        var thisPathType = ' C ';              // set quadratic control point at midpoint, cubic's at p1 and p2
        if (cursorMode == 'quadratic')  thisPathType = ' Q ';
        var theseCurvePoints = thisDvalue.split(thisPathType);      // isolate control point(s) and p2
        var thisP1 = theseCurvePoints[0].split('M ');               // isolate p1
        thisP1 = thisP1[1].split(', ');
        var theseControlPoints = theseCurvePoints[1].split(', ');              // get array of x,y,x,y(,x,y)
        if (thisPathType == ' Q ') {
          theseControlPoints[0] = ((parseInt(thisP1[0]) + thisX2) / 2).toFixed();
          theseControlPoints[1] = ((parseInt(thisP1[1]) + thisY2) / 2).toFixed();
        }
        // else {
        //   theseControlPoints[0] = ((parseInt(thisP1[0]) + thisX2) / 3).toFixed();
        //   theseControlPoints[1] = ((parseInt(thisP1[1]) + thisY2) / 3).toFixed();
        //   theseControlPoints[2] = ((parseInt(thisP1[2]) + thisX2) / 1.5).toFixed();
        //   theseControlPoints[3] = ((parseInt(thisP1[3]) + thisY2) / 1.5).toFixed();
        // }
        var thisD = theseCurvePoints[0] + thisPathType + curvePoint(theseControlPoints[0], theseControlPoints[1]);
        if (cursorMode == 'cubic') {
          thisD += curvePoint(thisX2, thisY2);
        }
        thisD += pathPoint(thisX2, thisY2);
        thisElement.attributes['d'].value = thisD;
      }
    }
    else if (cursorMode == "text") {    // translate
      if (svgInProgress == 'SHIFT') {
        this.updateMousePosition(event);
        thisBubble.attributes['cx'].value = (lastMouseX - xC) / zoom;     // translate the bubble
        thisBubble.attributes['cy'].value = (lastMouseY - yC) / zoom;
        for (var i = 0; i < thisGroup.children.length; i++) {      // for any text lines in this group (skip bubble)
          if (thisGroup.children[i].tagName == 'text') {          // only shift text elements, not bubbles
            thisGroup.children[i].attributes['x'].value = (lastMouseX - xC) / zoom;    // translate each <text> element
            thisGroup.children[i].attributes['y'].value = ((lastMouseY - yC) / zoom) + (i * textHeight);
          }
          else {      // translate the bubble
            thisGroup.children[i].children[0].attributes['cx'].value = (lastMouseX - xC) / zoom;    // translate each <text> element
            thisGroup.children[i].children[0].attributes['cy'].value = ((lastMouseY - yC) / zoom)/* + (i * textHeight)*/;
          }
        }
      }
    }
  }
  else if (cursorMode == 'MOVE') {    // Revert to MOVE: this version assumes manipulating the transform <xlt> of the SVG via xC, yC

    if (svgInProgress == 'MOVE') {

      var oldX = this.lastMousePoint.x;
      var oldY = this.lastMousePoint.y;
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
  var self = this;
  return function (event) {
    if (!svgInProgress) {                       // i.e., if svgInProgress is not false
      return event.preventDefault() && false;
    }
    if (svgInProgress == 'SHIFT') {       // this is also catching mouseUp from bubbles!!!
      // mouseup implies end of position shift or resize  ///// HELLO ///// ^^^^^^^
      svgInProgress = false;
      clearEditElement(thisGroup);
    }
    else if (svgInProgress == 'SIZE') {
      // mouseup implies end of position shift or resize
      svgInProgress = false;
      setElementMouseOverOut(thisElement.parentNode);   // this element is a SHIFT bubble
    }
    else if (cursorMode == 'bubble') {      // /////// all assignments of cursorMode to bubble have been disabled
      svgInProgress = false;
    }
    else if (cursorMode == 'draw') {
      svgInProgress = false;
      setElementMouseOverOut(thisGroup);
      unbindMouseHandlers(self);
    }
    else if ((cursorMode == 'cubic') || (cursorMode == 'quadratic')) {
      svgInProgress = false;
      setElementMouseOverOut(thisGroup);
      unbindMouseHandlers(self);
    }
    else if ((cursorMode == "MOVE") /*&& (svgInProgress == cursorMode)*/) {
      svgInProgress = false;
      unbindMouseHandlers(self);
    }
    else if (cursorMode == 'rect') {
      svgInProgress = false;
      setElementMouseOverOut(thisGroup);
      unbindMouseHandlers(self);
      thisBubble = null;
      thisElement = null;
      thisGroup = null;
    }
    else if (cursorMode == 'line') {
      svgInProgress = false;
      setElementMouseOverOut(thisGroup);
      unbindMouseHandlers(self);
      thisBubble = null;
      thisElement = null;
      thisGroup = null;
    }
    else if (cursorMode == 'arrow') {
      svgInProgress = false;
      setElementMouseOverOut(thisGroup);
      unbindMouseHandlers(self);
      thisBubble = null;
      thisElement = null;
      thisGroup = null;
    }
    else if (cursorMode == 'polygon') {
      if (thisBubble == null) {

      }
      else {
        svgInProgress = false;
        setElementMouseOverOut(thisGroup);
        unbindMouseHandlers(self);
        thisBubble = null;
        thisElement = null;
        thisGroup = null;
      }
    }
    else if (cursorMode == 'polyline') {
      if (thisBubble == null) {

      }
      else {
        svgInProgress = false;
        setElementMouseOverOut(thisGroup);
        unbindMouseHandlers(self);
        thisBubble = null;
        thisElement = null;
        thisGroup = null;
      }
    }
    else if (cursorMode == 'circle') {
      //checkLeftoverElement();
      svgInProgress = false;
      setElementMouseOverOut(thisGroup);
      thisBubble = null;
      thisElement = null;
      thisGroup = null;
    }
    else if (cursorMode == 'ellipse') {
      //thisCircle = thisElement;   // patch/hack to have routine below happy
      //checkLeftoverElement();
      svgInProgress = false;
      setElementMouseOverOut(thisGroup);
      thisBubble = null;
      thisElement = null;
      thisGroup = null;
    }
    else if (cursorMode == "text") {    // focus on the text entry input since this fails in mouseDown
      //document.getElementById('text4svg').focus();        // control eliminated
      if (svgInProgress == false) {
        if (thisGroup.lastChild.tagName == 'circle') {
          // thisGroup.lastChild.remove();
          clearEditElement(group);
        }
        setElementMouseOverOut(thisGroup);
      }
    }
    thisSvg = [];      // and clear the collector
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
  var self = this;
  return function (event) {
    if (event.keyCode == 0x14) {
      capsLock = !capsLock;
    }
  }
};

SVGDraw.prototype.keyHandler = function () {
  var self = this;
  return function (event) {
    // event.preventDefault();
    // Due to browser differences from fireFox, use event.keyCode vs key since key is undefined in Chrome and Safari
    var thisKeyCode = event.keyCode;
    var inFocus = document.activeElement;
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
      case 0x42:              // looking for control-B to move mouseovered group to "bottom"
        if (event.ctrlKey) {  // which is first in the SVG list
          if (thisGroup) {
            var cloneGroup = thisGroup.cloneNode(true);
            thisGroup.remove();
            clearEditElement(cloneGroup);
            svgLayer.firstChild.insertBefore(cloneGroup, svgLayer.firstChild.childNodes[1]);
          }
        }
      case 0x54:              // looking for control-T to move mouseovered group to "top"
        if (event.ctrlKey) {  // which is last in the SVG element list
          if (thisGroup) {
            var cloneGroup = thisGroup.cloneNode(true);
            thisGroup.remove();
            clearEditElement(cloneGroup);
            svgLayer.firstChild.appendChild(cloneGroup);
          }
        }
      default:
        secondKey = null;
        firstKey = thisKey;
      //thisKey = event.key;
      //if (thisKey == 'Shift' || thisKey == 'Meta') {
      //  secondKey = firstKey;
      //  firstKey = thisKey;
      //  return;
    }
    if ((cursorMode == 'text') && ((inFocus.tagName == 'BODY') || (inFocus.id == svgLayer.parentElement.id))) {
      updateSvgText(event);             // pass event or key
      return;
    }
    //thisKey = event.key;
    //if (thisKey == 'Shift' || thisKey == 'Meta') {
    //secondKey = firstKey;
    //firstKey = thisKey;
    //}

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
        clearThisGroup(thisGroup);
        svgInProgress = false;
        setCursorMode('MOVE');
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
  var eventKey = event.key;
  var thisKeyCode = event.keyCode;
  var thisCharCode = event.charCode;
  var Shifted = event.shiftKey;
  var Control = event.ctrlKey;
  if (thisKeyCode == 0x14) {
    //var CapsLock = isCapsLockOn(event);
    capsLock = !capsLock;            // on keyDown and capsLock keyCode (= 20d or 0x14)
    return false;
  }
  var mapKey = _KEYCODE_MAP[thisKeyCode];   // from CapsLock.js, non-alphanumeric keys
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
      }
      else {
        if (Shifted) {
          return eventKey.toLowerCase();    // shift and CapsLock implies lower case for Oranges
        }
        else {
          return eventKey.toUpperCase();    // do not invert sense of CapsLock
        }
      }
    }
    else {                                  // not caps lock
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
  setElementMouseOverOut(thisGroup);
  setCursorMode('MOVE');
  unbindMouseHandlers(self);
  thisBubble = null;
  thisElement = null;
  thisGroup = null;
}

SVGDraw.prototype.doubleClickHandler = function () {
  var self = this;
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
        setElementMouseOverOut(thisGroup);
        break;
      case 'polyline':
        deleteDuplicatePoints(thisElement);
        setElementMouseOverOut(thisGroup);
        break;
    }
    if (cursorMode == 'text') {
      closeSvgText();
    }
    thisElement = null;
    thisGroup = null;
    unbindMouseHandlers(self);
  }
}

SVGDraw.prototype.mouseWheelScrollHandler = function () {
  var self = this;
  return function (event) {
    event.stopImmediatePropagation();
    event.stopPropagation();
    var deltaDiv = 1000;                              // default for non-FireFox
    if (event.type == "DOMMouseScroll") {
      deltaDiv = 100
    }   // adjust for FireFox
    //var delta = parseInt(event.originalEvent.wheelDelta || -event.originalEvent.detail);
    //lastMouseX = (event.originalEvent.clientX - svgOffset.left);      // fixed reference for mouse offset
    //lastMouseY = (event.originalEvent.clientY - svgOffset.top);
    var delta = -parseInt(event.deltaY || -event.detail);
    lastMouseX = (event.clientX - svgOffset.left);      // fixed reference for mouse offset
    lastMouseY = (event.clientY - svgOffset.top);
    var zoomDelta = delta / deltaDiv;
    if (zoomDelta > 0) {
      zoomIn();
    } else {
      zoomOut();
    }
    return event.preventDefault() && false;
  }
};

function deleteDuplicatePoints(element) {
  var thesePoints = element.attributes['points'].value.trim();
  var splitPoints = thesePoints.split(' ');
  thesePoints = splitPoints[0] + ' ';
  for (k = 1; k < splitPoints.length; k++) {
    if (splitPoints[k] != splitPoints[k - 1]) {   // only keep this point
      thesePoints += splitPoints[k] + ' ';        // if it is "new"
    }
  }
  thisElement.attributes['points'].value = thesePoints;
}

function deleteLastPoint(element) {   // specific to <poly->
  var thesePoints = element.attributes['points'].value.trim();
  var splitPoints = thesePoints.split(' ');
  thesePoints = splitPoints[0] + ' ';
  for (k = 1; k < splitPoints.length - 1; k++) {
    if (splitPoints[k] != splitPoints[k - 1]) {   // only keep this point
      thesePoints += splitPoints[k] + ' ';        // if it is "new"
    }
  }
  thisElement.attributes['points'].value = thesePoints;
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
  }
  else {
    cursorMode = mode.toLowerCase();
    if (cursorMode == 'text') {
      //document.getElementById("text4svg").removeAttribute('disabled');
      //document.getElementById("text4svg").focus();        // this control eliminated
    }
    if (mode == 'rectangle') {      // there are  few cases where the tagName of the element != cursorMode
      cursorMode = 'rect';          // also cubic and quadratic, whose tagName is path and draw which is polyline
    }
  }
  savedCursorMode = 'MOVE';      ////////////// eliminated but reinstated
  if (mode.toUpperCase() != 'MOVE') {
    waitElement = true;
  }
  indicateMode(mode);
  svgInProgress = false;

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
  var xlt = document.getElementById("xlt");
  if (xlt.childElementCount > 1) {              // don't remove the base image
    xlt.lastChild.remove();
  }
}

function clearThisGroup(group) {
  if (group) {
    group.remove();
  }
}

function inverseColor(color) {          // color is required to be string as #RRGGBB hexadecimal
  var red = makeHex8(color.slice(1, 3));
  var grn = makeHex8(color.slice(3, 5));
  var blu = makeHex8(color.slice(5, 7));
  return '#' + red + grn + blu;
}

function makeHex8(colorSegment) {       // colorSegment is 8 bit hex encoded string
  var izit = ((parseInt('0X' + colorSegment)) ^ 0xFF).toString(16);
  if (izit.length == 2) {
    return izit;
  }
  return '0' + izit;
}

function zoomIn() {
//            var zoomDelta = 0.05;
  if (zoom < maxZoom) {           // zoom of 1 is pixel-per-pixel on svgLayer
    var newZoom = zoom * ( 1.0 + zoomDelta);
    if (newZoom > maxZoom) {
      newZoom = maxZoom;
    }
    xC = lastMouseX - (lastMouseX - xC) * newZoom / zoom;
    yC = lastMouseY - (lastMouseY - yC) * newZoom / zoom;
    zoom_trans(xC, yC, newZoom);
    zoom = newZoom;
    bubbleRadius = (baseBubbleRadius / zoom).toString();
    document.getElementById('zoom').innerHTML = "Zoom:" + zoom.toFixed(3);
  }
}

function zoomOut() {
//            var zoomDelta = 0.05;
  if (zoom > baseZoom / 3) {
    var newZoom = zoom / (1.0 + zoomDelta);
    xC = lastMouseX - (lastMouseX - xC) * newZoom / zoom;
    yC = lastMouseY - (lastMouseY - yC) * newZoom / zoom;
    zoom_trans(xC, yC, newZoom);
    zoom = newZoom;
    bubbleRadius = (baseBubbleRadius / zoom).toString();
    document.getElementById('zoom').innerHTML = "Zoom:" + zoom.toFixed(3);
  }
}

function zoom_trans(x, y, factor) {
  var xlt = document.getElementById('xlt');         // DOM svg element g xlt
  var transform = 'translate(' + ((x)).toString() + ', ' + ((y)).toString() + ')scale(' + factor.toString() + ')';
  zoom = factor;
  xC = x;
  yC = y;
  xlt.attributes['transform'].value = transform;
  document.getElementById('zoom').innerHTML = "Zoom:" + zoom.toFixed(3);
}

function updateSvgText(event) {                       // modified to eliminate mousetrap
  thisKey = event.key;                            // this attribute only works for FireFox
  var thisKeyCode = event.keyCode;
  //if (thisKey == undefined) {                   // undefined if not FireFox
  thisKey = lookUpKey(event);     // consolidate
  if (cursorMode != 'text') {     // redundant, since we only get here from keyDown handler
    switch (event.keyCode) {
      case 13:                    // Enter
        dblClick();
        break;
    }
    return false;
  }
  //var text4svg = document.getElementById("text4svg");   // this control eliminated
  if (thisElement == null) {
    return false
  }
  if ((event.keyCode == 13) && (event.shiftKey)) {      // terminate this text block chain on Shift-Enter
    // setElementMouseOverOut(thisGroup);
    // removeCursorFromSvgText();
    // closeSvgText();
    // checkLeftoverElement();
    finishTextGroup();
    return false;
  }
  var text4svgValue;     // text4svg is string
  text4svgValue = text4svg.slice(0, text4svg.length - 1);   // remove text cursor (underscore)

  if (thisKeyCode > 31) {       // space or other printing character
    text4svg = text4svgValue + thisKey + '_';
  }
  if (thisKeyCode == 8) {
    text4svg = text4svgValue.slice(0, text4svgValue.length - 1) + '_';
    event.preventDefault();
  }
  if (!thisKey && (thisKeyCode != 13) && (thisKeyCode != 8)) {
    return;
  }   // only pass printing keys, Delete, and Return/Enter
  thisElement.innerHTML = parseHTML(text4svg);           // this needs to be pair-parsed into ' '&nbsp;
  thisElement.attributes['stroke'].value = cursorColor;       // allow in-line whole line color/font/size over-ride
  thisElement.attributes['style'].value = 'font-family: ' + textFont + '; fill: ' + cursorColor + ';';    //  including fill
  thisElement.attributes['font-size'].value = textHeight;
  var nextX = thisElement.attributes['x'].value;
  var nextY = parseInt(thisElement.attributes['y'].value) + parseInt(textHeight);
  var nextLine = thisElement.cloneNode();
  if (event.keyCode == 13) {      // line feed on ENTER/CR -- termination on shift-Enter/Return already picked off
    thisElement.innerHTML = parseHTML(text4svgValue.slice(0, text4svgValue.length));   // remove cursor at end of line
    //    var thisInverse = inverseColor(cursorColor);        // no longer used -- relocation bubble used now
    //    thisElement.attributes['onmouseover'] = 'this.attributes["stroke"].value = ' + thisInverse + ';';
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
  var result = spaceText.replace(/  /g, ' &nbsp;');   // two consecutive spaces become space+nonbreakingspace
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
    setElementMouseOverOut(thisGroup);   // if this group is to be persisted, set the mouse listeners for future edit
  }
  else {                                 // if no child nodes, it is empty and should be
    thisGroup.remove();                  // removed
    var BreakHere = true;
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
    }
    else {
      if (svgInProgress == 'text') {      //   ///////////////  newly added stronger condition
        thisElement.innerHTML = parseHTML(text4svg.slice(0, text4svg.length - 1));   // remove cursor at end of line
        if (thisElement.innerHTML == '') {
          thisElement.remove();
          thisElement = null;
          var BreakHere = true;
        }
        if (thisGroup.lastChild.tagName == 'g') {        // this is to detect a leftover bubble
          thisGroup.lastChild.remove;
          // clearEditElement(group);
          var BreakHere = true;
        }
      }
    }

  }
}

function closeSvgText() {
  //var text4svg = document.getElementById("text4svg");   // this control eliminated
  text4svg = '_';
  //text4svg.setAttribute('disabled', 'true');   // this control eliminated
  //text4svg.blur();                            // this control eliminated
  //thisSvgText = null;         // remove the target
  thisSvg = [];               // clear the container
  // setCursorMode('MOVE');
  thisElement = null;
  svgInProgress = false;
}

function setCursorColor(color) {
  cursorColor = color;
  document.getElementById('cursorColor').attributes['style'].value = 'background-color: ' + cursorColor;
}

function setUserColor(color) {          // only sets up the color for later selection
  var userColorTextbox = document.getElementById('setUserColor')
  userColorTextbox.attributes['style'].value = 'background-color: ' + color;
  userColorTextbox.blur();
}

function getUserColor() {
  return document.getElementById('userColor').value;

}

function indicateMode(mode) {
  var coverRect = mode;
  if (mode == 'rect') {
    coverRect = 'rectangle';        // replace anomalous rect with rectangle
  }
  document.getElementById("mode").textContent = coverRect.toUpperCase();
//            $("#zoom").html("Zoom:" + zoom.toFixed(3));
  document.getElementById('zoom').innerHTML = "Zoom:" + zoom.toFixed(3);
}

function collectSVG(verbatim) {   // verbatim true includes all markup, false means stripped
  var clonedSVG = svgLayer.cloneNode(true);
  var thisXLT = clonedSVG.firstChild;
  if (!verbatim) {
    clonedSVG.removeAttribute('height');
    clonedSVG.removeAttribute('width');
    clonedSVG.firstChild.attributes['transform'].value = 'translate(0, 0)scale(1)';
  }
  var innerElement;
  var thisG;
  var terminus = thisXLT.childElementCount;     // this will vary if we replace <g> elements when not "verbatim"
  var j = 1;                                    // this will be the indexer for <g> elements
  var k;
  for (i = 1; i < terminus; i++) {                // i will range over the original children count
    thisG = thisXLT.childNodes[j];              // probably should be firstChild since iteratively
    thisG.removeAttribute('onmouseenter');
    thisG.removeAttribute('onmouseleave');
    j++;                                        // index the next <g> in case we are verbatim-ish
    if (!verbatim) {    // new wrinkle for arrow and similar groups
      if (thisG.attributes.type) {
        thisG.removeAttribute('id');
      }
      else {
        j--;                                              // not verbatim, so back up to index the same <g>
        k = thisG.childElementCount;                     // save the number of children before it disappears
        innerElement = thisXLT.children[j].innerHTML;   // make a copy of the primitive SVG <element>(s) inside the <g>
        thisXLT.children[j].outerHTML = innerElement;  // replace the <g> with its content (e.g., may be multiple <text>s)
        j += k;                                       // adjust the <g> indexer to take into account the added element(s)
      }
    }
  }
  if (!verbatim) {                               // disable the image if not verbatim
    innerElement = thisXLT.firstChild.outerHTML.replace('<image', '<!--image').replace('/image>', '/image-->');
    thisXLT.firstChild.outerHTML = innerElement;    // this is done AFTER the other depopulation so accounting is easier
  }
  return clonedSVG;        //  oops, this was too easy
}

function showSVG(verbatim) {
  svgMenu.children['textSVGorJSON'].textContent = collectSVG(verbatim).outerHTML;
}

function jsonSVG(verbatim) {      // package SVG into JSON object
// specification is to return elements within a single group as text
// { "data": {
//      "type":  "svg",
//      "attributes": "<svg . . . the svg text . . . </svg>"
  var clonedSVG = collectSVG(false).firstChild;     // strip off <svg...> </svg>
  clonedSVG.removeAttribute('id');
  clonedSVG.removeAttribute('transform');
  clonedSVG.childNodes[0].remove();
  var JSONsvg = {
    "data": {
      "type": "svg",
      "attributes": clonedSVG.outerHTML
    }
  };
  svgMenu.children['textSVGorJSON'].textContent = JSON.stringify(JSONsvg);
  return JSONsvg;
}

function buildSVGmenu() {
  var thisButton;
  thisButton = document.createElement('input');     // default MOVE button
  //thisButton.setAttribute('id', 'btn_' + buttons[i].function);
  thisButton.setAttribute('type', 'button');
  thisButton.setAttribute('value', 'MOVE');
  thisButton.setAttribute('onclick', "setCursorMode('MOVE');");
  svgMenu.appendChild(thisButton);

  var thisSpan;
  thisSpan = document.createElement('span');      // mode/status display area
  thisSpan.setAttribute('id', 'mode');
  svgMenu.appendChild(thisSpan);

  thisButton = document.createElement('input');     // default ZOOM IN button
  thisButton.setAttribute('type', 'button');
  thisButton.setAttribute('value', 'Zoom IN');
  thisButton.setAttribute('onclick', "this.blur(); zoomIn();");
  svgMenu.appendChild(thisButton);

  thisButton = document.createElement('span');      // ZOOM display area
  thisButton.setAttribute('id', 'zoom');
  thisButton.setAttribute('innerHTML', ' Zoom:  ----');
  svgMenu.appendChild(thisButton);

  thisButton = document.createElement('input');     // default ZOOM OUT button
  thisButton.setAttribute('type', 'button');
  thisButton.setAttribute('value', 'Zoom OUT');
  thisButton.setAttribute('onclick', "this.blur(); zoomOut();");
  svgMenu.appendChild(thisButton);

  thisButton = document.createElement('input');     // default ZOOM OUT button
  thisButton.setAttribute('type', 'button');
  thisButton.setAttribute('value', 'Reset');
  thisButton.setAttribute('onclick', "this.blur(); zoom_trans(0, 0, baseZoom);");
  svgMenu.appendChild(thisButton);

  thisSpan = document.createElement('span');      // TEXT display area
  thisSpan.setAttribute('id', 'textBlock');
  //thisSpan.textContent = 'Text Size: ';
  svgMenu.appendChild(thisSpan);
  var thisTextsizeTitle = document.createElement('span');
  thisTextsizeTitle.innerHTML = 'Text Size: ';
  thisSpan.appendChild(thisTextsizeTitle);
  thisButton = document.createElement('input');     // default TEXT SIZE input
  thisButton.setAttribute('id', 'textSize');
  thisButton.setAttribute('type', 'number');
  thisButton.setAttribute('min', '5');
  thisButton.setAttribute('step', '5');
  thisButton.setAttribute('max', '300');
  thisButton.setAttribute('style', 'width: 4em');
  thisButton.setAttribute('value', '75');
  thisButton.setAttribute('onchange', 'textHeight=this.value; this.blur();');
  thisSpan.appendChild(thisButton);

  //thisButton = document.createElement('input');     // default TEXT input
  //thisButton.setAttribute('id', 'text4svg');        // this control eliminated
  //thisButton.setAttribute('type', 'text');
  //thisButton.setAttribute('disabled', 'true');
  //thisSpan.appendChild(thisButton);
  thisSpan.innerHTML += '<br>Select color: ';

  var colorSelect = {
    "buttons": [     // select this color buttons: Red/Green/Blue/Black/UserDefined/Selected
      {"color": "#FF0000"},
      {"color": "#00FF00"},
      {"color": "#0000FF"},
      {"color": "#000000"},
      {"color": "#666666"},
      {"color": "#FF0000"}
    ]
  };

  for (i = 0; i < colorSelect.buttons.length; i++) {                // buttons explicitly enumerated in data-buttons
    if (i == 4) {                                  // insert the text area input after the first 4 color select buttons
      thisButton = document.createElement('input');
      thisButton.setAttribute('id', 'userColor');
      thisButton.setAttribute('type', 'text');
      thisButton.setAttribute('value', colorSelect.buttons[i].color);
      thisButton.setAttribute('style', 'width: 5em');
      thisButton.setAttribute('onchange', "setUserColor(this.value); this.blur();");
      svgMenu.appendChild(thisButton);
      thisButton = document.createElement('input');   // add the user-defined color select button
      thisButton.setAttribute('id', 'setUserColor');
      thisButton.setAttribute('type', 'button');
      thisButton.setAttribute('style', 'background-color: ' + colorSelect.buttons[i].color);
      thisButton.setAttribute('onclick', "setCursorColor(getUserColor()); this.blur();");
      svgMenu.appendChild(thisButton);
    }
    if (i < colorSelect.buttons.length - 2) {       // for the first four color select buttons, just set table color
      thisButton = document.createElement('input');
      thisButton.setAttribute('type', 'button');
      thisButton.setAttribute('style', 'background-color: ' + colorSelect.buttons[i].color);
      thisButton.setAttribute('onclick', "setCursorColor('" + colorSelect.buttons[i].color + "'); this.blur();");
      svgMenu.appendChild(thisButton);
    }
    if (i > colorSelect.buttons.length - 2) {   // insert the selected color block (indicator only) as last
      var thisColorTitle = document.createElement('span');
      thisColorTitle.innerHTML = ' Selected Color >';
      svgMenu.appendChild(thisColorTitle);
      thisButton = document.createElement('input');
      thisButton.setAttribute('id', 'cursorColor');
      thisButton.setAttribute('type', 'button');
      thisButton.setAttribute('style', 'this.blur(); background-color: ' + colorSelect.buttons[i].color);
      svgMenu.appendChild(thisButton);
      cursorColor = colorSelect.buttons[i].color;   // set the cursorColor from the nominal button arrangement
    }
  }
  //thisSpan = document.createElement('span');    // removed control for cursor position indication
  //thisSpan.setAttribute('id', 'coords');
  //svgMenu.appendChild(thisSpan);

  thisButton = document.createElement('input');
  thisButton.setAttribute('id', 'svgArrow');
  thisButton.setAttribute('type', 'button');
  thisButton.setAttribute('value', 'Arrow line');
  thisButton.setAttribute('onclick', "setCursorMode('arrow'); this.blur();");
  svgMenu.appendChild(thisButton);

  thisSpan = document.createElement('span');      // arrow display area
  thisSpan.setAttribute('id', 'arrowBlock');

  thisSpan.innerHTML += ' &nbsp; Fixed:';
  thisButton = document.createElement('input');
  thisButton.setAttribute('id', 'arrowHeadPixels');
  thisButton.setAttribute('type', 'checkbox');
  thisButton.setAttribute('onclick', "this.blur();");
  thisSpan.appendChild(thisButton);

  thisSpan.innerHTML += ' &nbsp; Closed:';
  thisButton = document.createElement('input');
  thisButton.setAttribute('id', 'arrowHeadClosed');
  thisButton.setAttribute('type', 'checkbox');
  thisButton.setAttribute('onclick', "this.blur();");
  thisSpan.appendChild(thisButton);

  thisSpan.innerHTML += ' &nbsp; Length:';
  thisButton = document.createElement('input');
  thisButton.setAttribute('id', 'arrowHeadLength');
  thisButton.setAttribute('type', 'number');
  thisButton.setAttribute('value', '50');
  // thisButton.setAttribute('min', '5');
  // thisButton.setAttribute('step', '10');
  // thisButton.setAttribute('max', '150');
  thisButton.setAttribute('style', 'width: 4em');
  thisButton.setAttribute('onchange', 'this.blur();');
  thisSpan.appendChild(thisButton);

  thisSpan.innerHTML += ' &nbsp; Percent:';
  thisButton = document.createElement('input');     // default TEXT SIZE input
  thisButton.setAttribute('id', 'arrowHeadPercent');
  thisButton.setAttribute('type', 'number');
  thisButton.setAttribute('min', '5');
  thisButton.setAttribute('step', '1');
  thisButton.setAttribute('max', '30');
  thisButton.setAttribute('style', 'width: 4em');
  thisButton.setAttribute('value', '10');
  thisButton.setAttribute('onchange', 'this.blur(); arrowSize=this.value;');
  thisSpan.appendChild(thisButton);
  svgMenu.appendChild(thisSpan);

  thisButton = document.createElement('input');
  thisButton.setAttribute('id', 'saveSVG');
  thisButton.setAttribute('type', 'button');
  thisButton.setAttribute('value', 'Extract SVG');
  thisButton.setAttribute('onclick', 'this.blur(); showSVG(true);');
  svgMenu.appendChild(thisButton);

  thisButton = document.createElement('input');
  thisButton.setAttribute('id', 'plainSVG');
  thisButton.setAttribute('type', 'button');
  thisButton.setAttribute('value', 'Plain SVG');
  thisButton.setAttribute('onclick', 'this.blur(); showSVG(false);');
  svgMenu.appendChild(thisButton);

  thisButton = document.createElement('input');
  thisButton.setAttribute('id', 'svgJSON');
  thisButton.setAttribute('type', 'button');
  thisButton.setAttribute('value', 'JSON SVG');
  thisButton.setAttribute('onclick', 'this.blur(); jsonSVG(false);');
  svgMenu.appendChild(thisButton);


  svgMenu.innerHTML += '<br>';

  var thisTextArea = document.createElement('textarea');
  thisTextArea.setAttribute('id', 'textSVGorJSON');
  svgMenu.appendChild(thisTextArea);

}

