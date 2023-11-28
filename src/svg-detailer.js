import {
  drawMode,
  SVGType,
  KeyboardCode,
  _KEYCODE_MAP,
  _SHIFTMAP,
  BoardOptions
} from './constants/index.js'
import { EventEmitter, getModel, isMac } from './utils/index.js'
import { buildSVGMenu } from './utils/createToolbar.js'
import { drawLine } from './utils/shapes/index.js'

class SVGDraw extends EventEmitter {
  constructor(containerID, opts = {}) {
    super()

    this.containerElement = containerID
    this.configuration = {
      arrowClosed: false,
      arrowFixed: false,
      arrowPercent: 10, // default arrow head size 10 percent of arrow length in pixels
      arrowheadLength: 50,
      fontSize: 50,
      fontFamily: 'Verdana',
      stroke: '#000000',
      strokeWidth: 1,
      strokeOpacity: 0.9,
      fill: '',
      fillOpacity: 0.0,
      strokeLinecap: 'round',
      baseZoom: 0, // calculated from svg and image attributes
      maxZoom: 4,
      zoomDelta: 0.02, // this can be altered to discriminate legacy firefox dommousescroll event
      debugLog: opts.debugLog || false
    }

    this.state = {
      mousePosition: {
        x: 0,
        y: 0
      },
      xC: 0,
      yC: 0,
      zoom: 0,
      currentKey: undefined,
      currentGroup: undefined,
      currentElement: undefined,
      currentSVGPoints: [],
      currentBubble: undefined,
      bubbleRadius: undefined,
      baseBubbleRadius: 6,
      waitElement: false,
      svgInProgress: false,
      svgLayer: undefined,
      svgImage: undefined,
      cWidth: 0,
      cHeight: 0,
      groupIdCount: 0,
      capsLock: false,
      text: '_',
      cursorMode: drawMode.MOVE
    }

    this.state.cWidth = parseInt(
      opts.width || containerID.attributes['data-width'].value
    )
    this.state.cHeight = parseInt(
      opts.height || containerID.attributes['data-height'].value
    )

    this.handleMouseEnterFunction = this.mouseEnterFunction.bind(this)
    this.handleMouseLeaveFunction = this.mouseLeaveFunction.bind(this)
    this.handleMouseClickFunction = this.mouseClickFunction.bind(this)
    this.handleKeyHandler = this.keyHandler.bind(this)
    this.handleKeyUpHandler = this.keyUpHandler.bind(this)

    const svgLayer = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'svg'
    )
    svgLayer.setAttributeNS(null, 'id', 'svgLayer')
    svgLayer.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    svgLayer.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')
    svgLayer.setAttributeNS(null, 'version', '1.1')
    svgLayer.setAttributeNS(null, 'style', 'position: inherit;')
    svgLayer.setAttributeNS(null, 'width', this.state.cWidth)
    svgLayer.setAttributeNS(null, 'height', this.state.cHeight)

    this.containerElement.appendChild(svgLayer)
    this.state.svgLayer = svgLayer

    let xlt = document.createElementNS(
      'http://www.w3.org/2000/svg',
      SVGType.GROUP
    )

    this.xlt = xlt

    svgLayer.appendChild(xlt)

    this.state.currentSVGPoints = [] // collect points as [x,y]

    const imageSrc = opts.imageSrc || containerID.attributes['data-image'].value

    if (!imageSrc) {
      throw 'Missing image src'
    }
    this.loadImage(imageSrc)

    if (opts.svg) {
      this.apiLoadSVG(opts.svg)
    }

    buildSVGMenu(this)

    document.addEventListener('keydown', this.handleKeyHandler) /////////////// This is probably tooo broad   /////////////////
    document.addEventListener('keyup', this.handleKeyUpHandler)

    //this.zoom_trans(0, 0, this.configuration.baseZoom) //////////// IMPORTANT !!!!!!!!!!!

    this.updateCursorMode(drawMode.MOVE)

    this.renderFunction = this.updateSvgByElement
    this.touchSupported = 'ontouchstart' in document.documentElement // thanks, Edd Turtle !
    this.containerID = containerID
    this.state.mousePosition = { x: 0, y: 0 }

    if (!this.touchSupported) {
      this.state.svgLayer.addEventListener(
        'dblclick',
        this.doubleClickHandler.bind(this)
      )
    }

    this.state.svgLayer.addEventListener(
      'mousedown',
      this.onSvgMouseDown.bind(this)
    )
    this.state.svgLayer.addEventListener(
      'mouseup',
      this.onSvgMouseUp.bind(this)
    )
    this.state.svgLayer.addEventListener(
      'mousemove',
      this.onSvgMouseMove.bind(this)
    )
  }

  loadImage(src) {
    this.state.svgImage = new Image()
    this.state.svgImage.src = src
    this.state.svgImage.onload = () => {
      this.state.xC = 0
      this.state.yC = 0

      var cAR = this.state.cWidth / this.state.cHeight
      var iAR = this.state.svgImage.width / this.state.svgImage.height

      // scale to height if (similar aspect ratios AND image aspect ratio less than container's)
      // OR the image is tall and the container is wide)
      if (
        (((cAR >= 1 && iAR >= 1) || (cAR <= 1 && iAR <= 1)) && iAR <= cAR) ||
        (iAR <= 1 && cAR >= 1)
      ) {
        this.configuration.baseZoom =
          this.state.svgLayer.height.baseVal.value / this.state.svgImage.height // scale to height on condition desc in comment
      } else {
        this.configuration.baseZoom =
          this.state.svgLayer.width.baseVal.value / this.state.svgImage.width // otherwise scale to width
      }

      // strokeWidth = baseStrokeWidth.toString();    // NOT dynamically recomputed with zoom (not this one)
      this.state.bubbleRadius = (
        this.state.baseBubbleRadius / this.configuration.baseZoom
      ).toString() // and transcoded from/to string (may not be required)

      this.state.mousePosition.x =
        (this.configuration.baseZoom * this.state.svgImage.width) / 2 // center of image
      this.state.mousePosition.y =
        (this.configuration.baseZoom * this.state.svgImage.height) / 2
      // insert the svg base image into the transformable group <g id='xlt'>

      this.xlt.setAttributeNS(null, 'id', 'xlt')
      this.xlt.setAttributeNS(
        null,
        'transform',
        'translate(0,0) scale(' + parseFloat(this.configuration.baseZoom) + ')'
      )

      const xltImage = document.createElementNS(
        'http://www.w3.org/2000/svg',
        SVGType.IMAGE
      )
      xltImage.setAttributeNS(null, 'id', 'xltImage')
      xltImage.setAttributeNS(null, 'x', '0')
      xltImage.setAttributeNS(null, 'y', '0')
      xltImage.setAttributeNS(
        null,
        'width',
        this.state.svgImage.width.toString()
      )
      xltImage.setAttributeNS(
        null,
        'height',
        this.state.svgImage.height.toString()
      )
      xltImage.setAttributeNS(null, 'preserveAspectRatio', 'none')
      xltImage.setAttributeNS(
        'http://www.w3.org/1999/xlink',
        'href',
        this.state.svgImage.src
      )

      this.zoom_trans(0, 0, this.configuration.baseZoom) //////////// IMPORTANT !!!!!!!!!!!

      this.xltImage = xltImage
      this.xlt.prepend(xltImage)
    }
  }

  get currentMouseX() {
    return (this.state.mousePosition.x - this.state.xC) / this.state.zoom
  }

  get currentMouseY() {
    return (this.state.mousePosition.y - this.state.yC) / this.state.zoom
  }

  setCursorMode(mode) {
    this.state.cursorMode = mode
    this.emit('changemode', {
      mode: this.state.cursorMode
    })
  }

  updateCursorMode(mode) {
    if (this.state.currentElement) {
      this.checkLeftoverElement() // look for dangling element, most likely off of svg image element ( - Y coord)
      this.clearEditElement(this.state.currentGroup) //  TODO: make sure all cases complete
    }

    this.setCursorMode(mode)

    if (this.state.cursorMode !== drawMode.MOVE) {
      if (this.state.cursorMode === drawMode.TEXT) {
        //document.getElementById("text4svg").removeAttribute('disabled');
        //document.getElementById("text4svg").focus();        // this control eliminated
      }

      if (mode == drawMode.CLEAR) {
        this.clearLastGroup()
        this.state.cursorMode = drawMode.MOVE
      }

      if (mode == BoardOptions.RESET) {
        this.setZoom(this.configuration.baseZoom)
        this.state.cursorMode = drawMode.MOVE
      }

      this.state.waitElement = true
    }

    this.state.svgInProgress = false
  }

  exitEditPoint(group) {
    // services mouseUp from SIZE/point bubble
    while (
      group.childElementCount > 1 &&
      group.lastChild.tagName == SVGType.GROUP
    ) {
      // changed from group.childElementCount > 1
      group.lastChild.remove() // eliminates all bubbles
    }

    this.state.svgInProgress = false
    this.state.currentBubble = null

    this.updateCursorMode(drawMode.MOVE)
    this.setElementMouseEnterLeave(group)
  }

  getIDcount() {
    this.state.groupIdCount += 1

    return this.state.groupIdCount
  }

  zoom_trans(x, y, scale) {
    const transform = `translate(${x.toString()}, ${y.toString()}) scale(${scale.toString()})`

    this.state.zoom = scale
    this.state.xC = x
    this.state.yC = y

    this.xlt.attributes['transform'].value = transform
  }

  zoomIn() {
    const { zoomDelta, maxZoom } = this.configuration

    if (this.state.zoom < maxZoom) {
      // zoom of 1 is pixel-per-pixel on svgLayer
      let newZoom = this.state.zoom * (1.0 + zoomDelta)

      if (newZoom > maxZoom) {
        newZoom = maxZoom
      }

      this.setZoom(newZoom)
    }
  }

  zoomOut() {
    if (this.state.zoom > this.configuration.baseZoom / 3) {
      const scale = this.state.zoom / (1.0 + this.configuration.zoomDelta)

      this.setZoom(scale)
    }
  }

  setZoom(scale) {
    this.state.xC =
      this.state.mousePosition.x -
      ((this.state.mousePosition.x - this.state.xC) * scale) / this.state.zoom
    this.state.yC =
      this.state.mousePosition.y -
      ((this.state.mousePosition.y - this.state.yC) * scale) / this.state.zoom

    this.zoom_trans(this.state.xC, this.state.yC, scale)
    this.state.zoom = scale
    this.state.bubbleRadius = (
      this.state.baseBubbleRadius / this.state.zoom
    ).toString()
  }

  setStroke(color) {
    this.configuration.stroke = color
  }

  apiFontSize(fontsize) {
    if (isNumeric(fontsize)) {
      this.configuration.fontSize = fontsize
    }
  }

  apiFontFamily(font) {
    this.configuration.fontFamily = font
  }

  apiArrowClosed(checked) {
    this.arrowClosed = checked
  }

  apiArrowFixed(checked) {
    this.arrowFixed = checked
  }

  apiArrowLength(length) {
    if (isNumeric(length)) {
      this.configuration.arrowheadLength = length
    }
  }

  apiArrowPercent(percent) {
    if (isNumeric(percent)) {
      this.configuration.arrowPercent = percent
    }
  }

  apiStroke(color) {
    this.setStroke(color)
  }

  apiClearAll() {
    this.state.groupIdCount = 0
    const elements = [...this.xlt.querySelectorAll('g')]

    elements.forEach((el) => el.remove())
  }

  apiStrokeWidth(pixels) {
    if (isNumeric(pixels)) {
      this.configuration.strokeWidth = pixels
    }
  }

  apiStrokeOpacity(opacity) {
    if (opacity >= 0 && opacity <= 1) {
      this.configuration.strokeOpacity = opacity
    }
  }

  apiStrokeLinecap(style) {
    this.configuration.strokeLinecap = style
  }

  apiFill(color) {
    this.configuration.fill = color
  }

  apiFillOpacity(opacity) {
    if (opacity >= 0 && opacity <= 1) {
      this.configuration.fillOpacity = opacity.toString()
    }
  }

  apiZoomIn() {
    this.zoomIn()
  }

  apiZoomOut() {
    this.zoomOut()
  }

  apiSetZoom(scale) {
    this.setZoom(scale)
  }

  apiDeleteLast() {
    this.clearLastGroup()
  }

  apiDeleteHover(group) {
    if (group) {
      this.clearThisGroup(group)
    }
  }

  apiShowSVG(verbatim) {
    return collectSVG(verbatim, { svgLayer: this.state.svgLayer }).outerHTML
  }

  apiBareSVG(noGroups = true) {
    return getBareSVG(noGroups, { svgLayer: this.state.svgLayer }).outerHTML
  }

  apiJsonSVG(opts = { currentLayer: false }) {
    // package SVG into JSON object
    const clonedSVG = collectSVG(false, {
      svgLayer: this.state.svgLayer,
      currentLayer: opts.currentLayer
    }).firstChild // strip off <svg...> </svg>

    clonedSVG.removeAttribute('id')
    clonedSVG.removeAttribute('transform')

    const JSONsvg = {
      data: {
        type: 'svg',
        attributes: clonedSVG.outerHTML
      }
    }

    return JSONsvg
  }

  apiRemoveGroup(groupId) {
    const elements = [...this.xlt.querySelectorAll(`#${groupId}`)]

    elements.forEach((el) => this.removeShape(el))
  }

  apiRemoveLayer(layerId) {
    const elements = [...this.xlt.querySelectorAll(`[layer-id="${layerId}"]`)]

    elements.forEach((el) => this.removeShape(el))
  }

  removeShape(element) {
    element.remove()
  }

  lockShape(el) {
    const bubble = el.querySelector('.bubbles')

    this.removeGroupEvents(el)
    bubble?.remove()
    el.setAttribute('locked', 'true')
  }

  unlockShape(el) {
    this.setElementMouseEnterLeave(el)

    if (el.matches(':hover')) {
      this.handleMouseEnterFunction({ target: el })
    }
    el.setAttribute('locked', 'false')
  }

  unlockLayer(layerId) {
    const elements = [
      ...this.xlt.querySelectorAll(`[layer-id="${layerId}"][locked="true"]`)
    ]

    elements.forEach((el) => this.unlockShape(el))
  }

  unlockGroup(groupId) {
    const elements = [
      ...this.xlt.querySelectorAll(`#${groupId}[locked="true"]`)
    ]

    elements.forEach((el) => this.unlockShape(el))
  }

  lockLayer(layerId) {
    const elements = [
      ...this.xlt.querySelectorAll(`[layer-id="${layerId}"][locked="false"]`)
    ]

    elements.forEach((el) => this.lockShape(el))
  }

  lockGroup(groupId) {
    const elements = [
      ...this.xlt.querySelectorAll(`#${groupId}[locked="false"]`)
    ]

    elements.forEach((el) => this.lockShape(el))
  }

  apiLockLayer(layerId) {
    if (layerId) {
      this.lockLayer(layerId)
    }
  }

  apiLockGroup(groupId) {
    if (groupId) {
      this.lockGroup(groupId)
    }
  }

  apiUnlockGroup(groupId) {
    if (groupId) {
      this.unlockGroup(groupId)
    }
  }

  apiUnlockLayer(layerId) {
    if (layerId) {
      this.unlockLayer(layerId)
    }
  }

  apiLoadSVG(
    svg,
    {
      replace = false,
      layerId = Math.random().toString(36).substring(2, 8),
      lock = true,
      shapeClass = undefined,
      fill = undefined
    } = {}
  ) {
    const svgElement = document.createElementNS(
      'http://www.w3.org/2000/svg',
      SVGType.SVG
    )
    svgElement.innerHTML = svg

    const groupElement = svgElement.querySelector(SVGType.GROUP)
    const g = [...groupElement.querySelectorAll(SVGType.GROUP)]

    if (replace) {
      const previousGroups = this.xlt.querySelectorAll(SVGType.GROUP)

      previousGroups.forEach((g) => g.remove())
    }

    g.forEach((el) => {
      const shapeElement = el.firstChild

      el.setAttribute('id', `g${this.getIDcount()}`)
      el.setAttribute('layer-id', layerId)
      el.setAttribute('locked', lock)

      if (shapeClass) {
        shapeElement.classList.add(shapeClass)
      }

      if (fill) {
        shapeElement.setAttribute('fill', fill)
        shapeElement.setAttribute('fill-opacity', 1)
      }

      if (!lock) {
        this.setElementMouseEnterLeave(el)
      }

      this.xlt.appendChild(el)
    })

    return {
      layerId
    }
  }
}

function setPointsToElement(element, points) {
  element.setAttributeNS(
    null,
    'points',
    points[0][0].toFixed(4).toString() +
      ',' +
      points[0][1].toFixed(4).toString() +
      ' ' +
      points[0][0].toFixed(4).toString() +
      ',' +
      points[0][1].toFixed(4).toString() +
      ' '
  )
}

SVGDraw.prototype.onSvgMouseDown = function () {
  // in general, start or stop element generation on mouseDOWN (true?)
  this.updateMousePosition(event)

  if (
    this.state.svgInProgress &&
    this.state.svgInProgress !== this.state.cursorMode
  ) {
    // terminate in progress svg before continuing
    if (this.state.svgInProgress !== 'SHIFT') {
      this.state.svgInProgress = this.state.cursorMode //  ??
    }
    return
  }

  if (
    this.state.currentGroup?.childElementCount > 1 &&
    this.state.cursorMode != drawMode.TEXT
  ) {
    // this is the case where there is a click on a mousentered
    this.clearEditElement(this.state.currentGroup)
    return false
  }

  const [x, y] = [this.currentMouseX, this.currentMouseY]
  this.state.currentSVGPoints[0] = [x, y]

  if (this.state.cursorMode == drawMode.POLYGON) {
    // mouseDown sets initial point, subsequent points set by mouseDown after mouseUp
    if (this.state.svgInProgress == false) {
      // this is a new instance of this svg type (currently by definition)

      this.state.currentSVGPoints[0] = [this.currentMouseX, this.currentMouseY]
      let group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      let newGroupID = 'g' + this.getIDcount().toString()
      group.setAttributeNS(null, 'id', newGroupID)
      group.setAttributeNS(null, 'class', this.state.cursorMode)
      this.state.currentGroup = group
      this.xlt.appendChild(group)
      let element = newElement({
        tag: drawMode.POLYLINE,
        attributes: this.getSVGAttributes()
      }) //YES, I KNOW... polyline behavior mimics google maps better

      group.appendChild(element)
      this.state.currentElement = group.children[0]
      setPointsToElement(element, this.state.currentSVGPoints)
      this.state.svgInProgress = this.state.cursorMode // mark in progress
    } else {
      // this is the fixation of this last point, so DON'T dissociate mouse move handler
      this.updateMousePosition(event)
      let thesePoints = this.state.currentElement.attributes['points'].value // to trim or not to trim?  if so, multiple implications here
      let thisPoint =
        this.currentMouseX.toFixed(4).toString() +
        ',' +
        this.currentMouseY.toFixed(4).toString() +
        ' '
      this.state.currentElement.attributes['points'].value =
        thesePoints.concat(thisPoint)
    }
  }
  if (this.state.cursorMode == drawMode.POLYLINE) {
    // mouseDown sets initial point, subsequent points set by mouseDown after mouseUp
    if (this.state.svgInProgress == false) {
      // this is a new instance of this svg type (currently by definition)
      this.state.currentSVGPoints[0] = [this.currentMouseX, this.currentMouseY]
      let group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      this.state.currentGroup = group
      let newGroupID = 'g' + this.getIDcount().toString()
      group.setAttributeNS(null, 'id', newGroupID)
      group.setAttributeNS(null, 'class', this.state.cursorMode)
      this.xlt.appendChild(group)
      let element = newElement({
        tag: drawMode.POLYLINE,
        attributes: this.getSVGAttributes()
      })

      group.appendChild(element)
      this.state.currentElement = group.children[0]
      element.setAttributeNS(null, 'stroke-linecap', 'round')
      setPointsToElement(element, this.state.currentSVGPoints)
      this.state.svgInProgress = this.state.cursorMode // mark in progress
    } else {
      // this is the fixation of this last point, so DON'T dissociate mouse move handler
      this.updateMousePosition(event)
      let thesePoints = this.state.currentElement.attributes['points'].value
      let thisPoint =
        this.currentMouseX.toFixed(4).toString() +
        ',' +
        this.currentMouseY.toFixed(4).toString() +
        ' '
      this.state.currentElement.attributes['points'].value =
        thesePoints.concat(thisPoint)
    }
  }
  if (this.state.cursorMode == drawMode.RECTANGLE) {
    // mouseDown starts creation, after drag, mouseUp ends
    if (this.state.svgInProgress == false) {
      // this is a new instance of this svg type (currently by definition)
      this.state.currentSVGPoints[0] = [this.currentMouseX, this.currentMouseY]

      let group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      let newGroupID = 'g' + this.getIDcount().toString()
      group.setAttributeNS(null, 'id', newGroupID)
      group.setAttributeNS(null, 'class', this.state.cursorMode)
      this.xlt.appendChild(group)
      let element = newElement({
        tag: SVGType.RECT,
        attributes: this.getSVGAttributes()
      })

      group.appendChild(element)
      this.state.currentGroup = group
      this.state.currentElement = group.children[0]
      element.setAttributeNS(
        null,
        'x',
        this.state.currentSVGPoints[0][0].toFixed(4)
      ) // start x
      element.setAttributeNS(
        null,
        'y',
        this.state.currentSVGPoints[0][1].toFixed(4)
      ) // start y
      element.setAttributeNS(null, 'width', 1) // width x
      element.setAttributeNS(null, 'height', 1) // height y
      this.state.svgInProgress = this.state.cursorMode // mark in progress
    }
    // now using mouseUp event to terminate rect
  }
  if (this.state.cursorMode == drawMode.LINE) {
    //  mouseDown starts creation, after, drag mouseUp ends
    if (this.state.svgInProgress == false) {
      // this is a new instance of this svg type (currently by definition)

      this.state.svgInProgress = this.state.cursorMode // mark in progress

      const { element, group } = drawLine({
        x,
        y,
        mode: this.state.cursorMode,
        attributes: this.configuration
      })
      group.setAttributeNS(null, 'id', 'g' + this.getIDcount().toString())
      this.xlt.appendChild(group)
      this.state.currentElement = element
      this.state.currentGroup = group
    } else {
      // this is the terminus of this instance, so dissociate mouse move handler
      this.state.svgInProgress = false
      this.setElementMouseEnterLeave(this.state.currentElement)
      // unbindMouseHandlers(self);
    }
  }
  if (this.state.cursorMode == drawMode.ARROW) {
    //  mouseDown starts creation, after, drag mouseUp ends
    if (this.state.svgInProgress == false) {
      // this is a new instance of this svg type (currently by definition)
      const { element, group } = drawLine({
        x,
        y,
        mode: this.state.cursorMode,
        attributes: this.configuration
      })

      this.state.svgInProgress = this.state.cursorMode
      group.setAttributeNS(null, 'id', 'g' + this.getIDcount().toString())
      this.xlt.appendChild(group)
      this.state.currentElement = element
      this.state.currentGroup = group
    } else {
      // this is the terminus of this instance, so dissociate mouse move handler
      this.state.svgInProgress = false
      this.setElementMouseEnterLeave(this.state.currentElement)
      // unbindMouseHandlers(self);
    }
  }
  if (this.state.cursorMode == drawMode.CIRCLE) {
    // mouseDown    // modified to use common element for handlers
    if (this.state.svgInProgress == false) {
      // this is a new instance of this svg type (currently by definition)
      if (this.state.currentGroup != null) {
        //  ////////////// ???
        this.clearEditElement(this.state.currentGroup) // this group is the one with bubbles, to be obviated
      }
      this.state.currentSVGPoints[0] = [this.currentMouseX, this.currentMouseY]
      let group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      let newGroupID = 'g' + this.getIDcount().toString()
      group.setAttributeNS(null, 'id', newGroupID)
      group.setAttributeNS(null, 'class', this.state.cursorMode)
      this.xlt.appendChild(group)
      let element = newElement({
        tag: SVGType.CIRCLE,
        attributes: this.getSVGAttributes()
      }) // new generalized method

      group.appendChild(element)
      this.state.currentGroup = group
      this.state.currentElement = group.children[0] // this var is used to dynamically create the element
      element.setAttributeNS(
        null,
        'cx',
        this.state.currentSVGPoints[0][0].toFixed(4)
      ) // start x
      element.setAttributeNS(
        null,
        'cy',
        this.state.currentSVGPoints[0][1].toFixed(4)
      ) // start y
      element.setAttributeNS(null, 'r', 1) // width x
      this.state.svgInProgress = this.state.cursorMode // mark in progress
    }
    // now using mouseup event exclusively to terminate circle
  }
  if (this.state.cursorMode == drawMode.ELLIPSE) {
    // mouseDown
    if (this.state.svgInProgress == false) {
      // this is a new instance of this svg type (currently by definition)
      this.state.currentSVGPoints[0] = [this.currentMouseX, this.currentMouseY]
      let group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      this.state.currentGroup = group
      let newGroupID = 'g' + this.getIDcount().toString()
      group.setAttributeNS(null, 'id', newGroupID)
      group.setAttributeNS(null, 'class', this.state.cursorMode)
      this.xlt.appendChild(group)
      let element = newElement({
        tag: drawMode.ELLIPSE,
        attributes: this.getSVGAttributes()
      })

      group.appendChild(element)
      this.state.currentElement = group.children[0]
      element.setAttributeNS(
        null,
        'cx',
        this.state.currentSVGPoints[0][0].toFixed(4)
      ) // start x
      element.setAttributeNS(
        null,
        'cy',
        this.state.currentSVGPoints[0][1].toFixed(4)
      ) // start y
      element.setAttributeNS(null, 'rx', 1) // radius x
      element.setAttributeNS(null, 'ry', 1) // radius y
      this.state.svgInProgress = this.state.cursorMode // mark in progress
    } else {
      // this is the terminus of this instance, so dissociate mouse move handler
      this.state.svgInProgress = false
      this.setElementMouseEnterLeave(this.state.currentElement)
      // unbindMouseHandlers(self);
    }
  }
  if (this.state.cursorMode == drawMode.DRAW) {
    // mouseDown
    if (this.state.svgInProgress == false) {
      // this is a new instance of this svg type (currently by definition)
      this.state.currentSVGPoints[0] = [this.currentMouseX, this.currentMouseY]
      let group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      this.state.currentGroup = group
      let newGroupID = 'g' + this.getIDcount().toString()
      group.setAttributeNS(null, 'id', newGroupID)
      group.setAttributeNS(null, 'class', this.state.cursorMode)
      this.xlt.appendChild(group)
      //for (j = 0; j < thisSVGpoints.length; j++) {              // for text mode there is only one
      let element = newElement({
        tag: drawMode.POLYLINE,
        attributes: this.getSVGAttributes()
      })

      group.appendChild(element)
      this.state.currentElement = group.children[0]
      element.setAttributeNS(
        null,
        'points',
        this.state.currentSVGPoints[0][0].toFixed(4).toString() +
          ',' +
          this.state.currentSVGPoints[0][1].toFixed(4).toString() +
          ' '
      ) // start x,y
      //}
      this.state.svgInProgress = this.state.cursorMode // mark in progress
    } else {
      // this is the terminus of this instance, so dissociate mouse move handler
      this.state.svgInProgress = false
      setMouseoverOut(this.state.currentElement, {
        strokeWidth: this.configuration.strokeWidth
      })
      // unbindMouseHandlers(self);
    }
  }
  if (
    this.state.cursorMode == drawMode.CUBIC ||
    this.state.cursorMode == drawMode.QUADRATIC
  ) {
    // mouseDown
    // The cubic Bezier curve requires non-symbolic integer values for its path parameters.
    // This will necessitate the dynamic reconstruction of the "d" attribute using parseInt
    // on each value.  The edit sister group will have 4 bubbles, ids: p1, c1, c2, p2 to decode
    // the control points' mousemove action.  Make control points the same as the endpoints initially,
    // then annotate with bubbles to shape the curve.  This is an extra step more than other elements.
    if (this.state.svgInProgress == false) {
      // this is a new instance of this svg type (currently by definition)
      this.state.currentSVGPoints[0] = [this.currentMouseX, this.currentMouseY]
      let group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      this.state.currentGroup = group
      let newGroupID = 'g' + this.getIDcount().toString()
      group.setAttributeNS(null, 'id', newGroupID)
      group.setAttributeNS(null, 'class', this.state.cursorMode)
      this.xlt.appendChild(group)
      let element = newElement({
        tag: SVGType.PATH,
        attributes: this.getSVGAttributes()
      })

      group.appendChild(element)
      this.state.currentElement = group.children[0]
      let thisX = this.state.currentSVGPoints[0][0]
      let thisY = this.state.currentSVGPoints[0][1]
      element.setAttributeNS(
        null,
        'd',
        this.getCurvePath(
          thisX,
          thisY,
          thisX,
          thisY,
          thisX,
          thisY,
          thisX,
          thisY
        )
      )
      this.state.svgInProgress = this.state.cursorMode // mark in progress
    } else {
      // this is the terminus of this instance, so dissociate mouse move handler
      this.state.svgInProgress = false
      this.setElementMouseEnterLeave(this.state.currentElement)
      // unbindMouseHandlers(self);
    }
  }
  if (this.state.cursorMode == drawMode.TEXT) {
    // mouseDown - could be initial click, revised position click, or preemie
    let group
    if (this.state.currentElement) {
      this.finishTextGroup()
    }
    if (this.state.svgInProgress == false) {
      this.state.currentSVGPoints[0] = [this.currentMouseX, this.currentMouseY]
      group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      this.state.currentGroup = group
      let newGroupID = 'g' + this.getIDcount().toString()
      group.setAttributeNS(null, 'id', newGroupID)
      group.setAttributeNS(null, 'class', this.state.cursorMode)
      this.xlt.appendChild(group)
      //for (j = 0; j < thisSVGpoints.length; j++) {              // for text mode there is only one
      let element
      element = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      group.appendChild(element)
      this.state.currentElement = group.children[0]
      element.setAttributeNS(null, 'stroke', this.configuration.stroke)
      element.setAttributeNS(null, 'stroke-width', '1')
      element.setAttributeNS(null, 'stroke-opacity', '1.0')
      element.setAttributeNS(
        null,
        'x',
        this.state.currentSVGPoints[0][0].toFixed(4)
      ) // start x
      element.setAttributeNS(
        null,
        'y',
        this.state.currentSVGPoints[0][1].toFixed(4)
      ) // start y
      element.setAttributeNS(
        null,
        'style',
        'font-family: ' +
          this.configuration.fontFamily +
          '; fill: ' +
          this.configuration.stroke.toString() +
          ';'
      )
      element.setAttributeNS(null, 'font-size', this.configuration.fontSize)
      element.innerHTML = '_' // plant the text cursor   /////////////////
      this.state.svgInProgress = 'text' // mark in progress
    }
  }
  if (this.state.cursorMode == drawMode.MOVE) {
    // mouseDown
    if (!this.state.svgInProgress) {
      this.state.svgInProgress = this.state.cursorMode
    }
  }
  this.state.waitElement = false //    ///////////   new code to allow creation start within extant element
  return event.preventDefault() && false
} //// end of onSvgMouseDown

function pathPoint(x, y) {
  return parseInt(x) + ', ' + parseInt(y)
}

function curvePoint(x, y) {
  return pathPoint(x, y) + ' '
}

SVGDraw.prototype.getSVGAttributes = function () {
  return {
    stroke: this.configuration.stroke,
    'stroke-width': this.configuration.strokeWidth,
    'stroke-opacity': this.configuration.strokeOpacity,
    fill: this.configuration.fill,
    'fill-opacity': this.configuration.fillOpacity,
    'stroke-linecap': this.configuration.strokeLinecap
  }
}

SVGDraw.prototype.getCurvePath = function (x1, y1, cx1, cy1, cx2, cy2, x2, y2) {
  if (this.state.cursorMode == drawMode.CUBIC) {
    return (
      'M ' +
      pathPoint(x1, y1) +
      ' C ' +
      curvePoint(cx1, cy1) +
      curvePoint(cx2, cy2) +
      pathPoint(x2, y2)
    )
  }

  return (
    'M ' + pathPoint(x1, y1) + ' Q ' + curvePoint(cx1, cy1) + pathPoint(x2, y2)
  )
}

function getCurveCoords(d) {
  let pieces = d.replace(/,/g, '').split(' ')
  let j = 0
  let coords = []
  for (let k = 0; k < pieces.length; k++) {
    if (isNumeric(pieces[k])) {
      // bypass the curve type symbol
      coords[j] = pieces[k]
      j++
    }
  }
  return coords
}

function getCurvePoints(coords) {
  // special bounding poly for curve element
  return (
    curvePoint(coords[0], coords[1]) +
    ' ' +
    curvePoint(coords[2], coords[3]) +
    ' ' +
    curvePoint(coords[4], coords[5]) +
    ' ' +
    curvePoint(coords[6], coords[7])
  )
}

function newElement({ tag, attributes }) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag)

  Object.entries(attributes).forEach(([attr, value]) => {
    element.setAttributeNS(null, attr, value)
  })

  return element
}

function setMouseoverOut(element, { strokeWidth }) {
  element.setAttributeNS(
    null,
    'onmouseover',
    "this.attributes['stroke-width'].value = '" + 1.5 * strokeWidth + "';"
  )
  element.setAttributeNS(
    null,
    'onmouseout',
    "this.attributes['stroke-width'].value = " + strokeWidth + ';'
  )
  return element
}

SVGDraw.prototype.mouseEnterFunction = function (event) {
  let thisGroupID = this.state.currentGroup?.id || 'null'
  let thisElementTagName = this.state.currentElement?.tagName || 'null'
  let thisElementParent = this.state.currentElement?.parentElement.id || 'null'

  console_log(
    this.configuration.debugLog,
    'mouseenter' +
      ' eventTarget=' +
      event.target.id +
      ' thisGroup=' +
      thisGroupID +
      ' thisElement=' +
      thisElementTagName +
      ' parent=' +
      thisElementParent +
      ' ' +
      this.state.cursorMode +
      ' '
  )
  this.setEditElement(event.target)
}

SVGDraw.prototype.mouseLeaveFunction = function (event) {
  let thisGroupID = this.state.currentGroup?.id || 'null'
  let thisElementTagName = this.state.currentElement?.tagName || 'null'
  let thisElementParent = this.state.currentElement?.parentElement.id || 'null'

  console_log(
    this.configuration.debugLog,
    'mouseleave' +
      ' eventTarget=' +
      event.target.id +
      ' thisGroup=' +
      thisGroupID +
      ' thisElement=' +
      thisElementTagName +
      ' parent=' +
      thisElementParent +
      ' ' +
      this.state.cursorMode +
      ' '
  )
  this.clearEditElement(event.target)
}

SVGDraw.prototype.removeGroupEvents = function (group) {
  group.removeEventListener('mouseenter', this.handleMouseEnterFunction)
  group.removeEventListener('mouseleave', this.handleMouseLeaveFunction)
  group.removeEventListener('click', this.handleMouseClickFunction)
}

SVGDraw.prototype.addGroupEvents = function (group) {
  group.addEventListener('mouseenter', this.handleMouseEnterFunction)
  group.addEventListener('mouseleave', this.handleMouseLeaveFunction)
  group.addEventListener('click', this.handleMouseClickFunction)
}

SVGDraw.prototype.setElementMouseEnterLeave = function (group) {
  // this actually sets the parent group's listeners
  if (group == null || group == undefined) {
    group = null //  debug catch point
  }

  this.removeGroupEvents(group)
  this.addGroupEvents(group)

  return group
}

SVGDraw.prototype.mouseClickFunction = function (event) {
  const element = event.target.parentElement

  switch (this.state.cursorMode) {
    case drawMode.ERASER:
      this.emit('erase', element)
      this.removeShape(element)
  }
}

SVGDraw.prototype.setEditElement = function (group) {
  // add bubble elements to the group containing this element
  if (
    checkElementConflict(this.state.currentGroup, {
      group,
      waitElement: this.state.waitElement,
      svgInProgress: this.state.svgInProgress
    })
  ) {
    // returns true if conflict
    console_log(
      this.configuration.debugLog,
      'Element conflict: ' + group.attributes.class.value
    )
    return
  }
  console_log(this.configuration.debugLog, 'setEditElement no conflict')
  if (this.state.currentGroup == null) {
    // no conflicts detected, so if thisGroup is null,
    let msg = 'thisGroup is NULL'
    if (this.state.currentElement) {
      msg += ', thisElement = ' + this.state.currentElement.toString()
    }

    console_log(
      this.configuration.debugLog,
      group.attributes.class.value + ' ' + msg
    )
    this.state.currentGroup = group // there is probably no creation activity
  }
  //if (group.firstChild.tagName != this.state.cursorMode) {    // start editing an element not in the current mode
  if (group.firstChild) {
    if (group.firstChild.tagName != SVGType.PATH) {
      if (group.attributes.class) {
        // class atribute existence
        this.state.cursorMode = group.attributes.class.value
      } else {
        this.state.cursorMode = group.firstChild.tagName
      }
    } else {
      // now that there are both cubic and quadratic curves, we must detect this one's class
      this.state.cursorMode = drawMode.CUBIC // ///////// finesse path
      if (group.firstChild.attributes.d.value.indexOf('C ') == -1) {
        // is the path quadratic because it's not cubic?
        this.state.cursorMode = drawMode.QUADRATIC
      }
    }
  }
  this.state.svgInProgress = false //  ////////// we have set bubbles but no action taken yet

  //}
  if (group.childNodes.length > 1) {
    // do I have bubbles? possibly? (might be text)
    if (group.lastChild.tagName == SVGType.GROUP) {
      // group.lastChild.remove();         // this is the group of bubbles
      this.clearEditElement(group)
    }
  }
  const bubbleGroup = this.createBubbleGroup(group) // since bubble groups are heterogeneous in structure
  group.appendChild(bubbleGroup) // make the new bubble group in a no-id <g>
  console_log(
    this.configuration.debugLog,
    'setEditElement ' + group.id + ' ' + group.attributes.class.value
  )
  // group.removeEventListener('mouseleave', mouseLeaveFunction)
}

SVGDraw.prototype.clearEditElement = function (group) {
  // given containing group; invoked by mouseleave, so order of statements reordered
  let thisGroupID = this.state.currentGroup?.id || 'null'
  console_log(
    this.configuration.debugLog,
    'clearEditElement: svgInProgress=' +
      this.state.svgInProgress +
      ', group=' +
      group?.id +
      ', thisGroup=' +
      thisGroupID
  )
  if (this.state.svgInProgress == 'SHIFT') {
    // if we are shifting an element, do nothing
    return
  }
  if (!group) {
    // if we are misassociated just back away . . .
    console_log(
      this.configuration.debugLog,
      'clearEditElement: group argument null'
    )
    return
  }
  if (this.state.waitElement) {
    console_log(this.configuration.debugLog, 'clearEditElement: waitElement')
    return
  }
  if (this.state.currentGroup && thisGroupID != group.id) {
    // collision
    console_log(this.configuration.debugLog, 'clearEditElement: group conflict')
    return
  }
  if (group.childNodes.length > 1) {
    // do I have bubbles? i.e., is there more than just the golden chile?
    if (
      group.lastChild.tagName == drawMode.CIRCLE ||
      group.lastChild.tagName == 'g'
    ) {
      // poly- bubbles have a child group
      group.lastChild.remove() // this is the group of bubbles (and maybe nested ones) if not just a SHIFT bubble
      this.state.currentBubble = null
      this.state.cursorMode = drawMode.MOVE // was savedthis.state.cursorMode;   // on exit of edit mode, restore
      this.state.svgInProgress = false
      this.state.currentElement = null
      this.state.currentGroup = null
    } else {
      if (group.firstChild.tagName == SVGType.TEXT) {
        if (this.state.svgInProgress == drawMode.TEXT) {
          this.finishTextGroup()
        }
      }
    }
  }
  //group./*firstChild.*/attributes['onmouseenter'].value = "this.firstChild.attributes['stroke-width'].value = '" + 1.5 * strokeWidth + "'; setEditElement(this.firstChild);"    // replant the listener in the real element
  this.setElementMouseEnterLeave(group)
  this.setCursorMode(drawMode.MOVE) // was savedthis.state.cursorMode;   // on exit of edit mode, restore

  this.state.svgInProgress = false
  this.state.currentElement = null
  this.state.currentGroup = null
  //  eliminated savedthis.state.cursorMode = drawMode.MOVE;
}

function checkElementConflict(
  currentGroup,
  { group, waitElement, svgInProgress, debugLog }
) {
  // only invoked by mouseenter listeners
  /* consider potential values of:
   svgInProgress, one of the svg modes, plus move, shift, and size
   this.state.cursorMode, the selected (if not always indicated) creation / editing mode
   thisElement, nominally the active element - conflict with bubbles
   thisGroup, nominally the group of the active element
   */
  if (waitElement) {
    console_log(debugLog, 'checkElementConflict1: waitElement = ' + waitElement)
    return true
  }
  if (!svgInProgress) {
    console_log(
      debugLog,
      'checkElementConflict2: svgInProgress=' +
        svgInProgress +
        'thisGroup=' +
        group.id
    )
    return false // if no active element
  }
  if (svgInProgress == 'SHIFT') {
    console_log(
      debugLog,
      'checkElementConflict3: svgInProgress=' +
        svgInProgress +
        'thisGroup=' +
        group.id
    )

    return currentGroup.id != group.id
  }
  if (svgInProgress != group.firstChild.tagName) {
    /*     console_log(
      enable_log,
      'checkElementConflict4: svgInProgress=' +
        svgInProgress +
        ', thisElement=' +
        thisElement +
        ', group element=' +
        group.firstChild.tagName
    ) */
    return true //  if we crossed another element
  }
  if (currentGroup != group) {
    console_log(
      debugLog,
      'checkElementConflict5: svgInProgress=' +
        svgInProgress +
        ', thisGroup=' +
        currentGroup.id +
        ', group=' +
        group.id +
        ', group element=' +
        group.firstChild.tagName
    )
    return true
  }
}

SVGDraw.prototype.setShiftElement = function (bubble) {
  // end of SHIFT leaves single bubble; should be removed on mouseleave of group
  //thisParent = element;                           // group containing real element and the bubbles group
  if (!this.state.currentGroup) {
    this.state.currentGroup = bubble.parentNode.parentNode // set group for mousemove
  }
  this.state.currentElement = this.state.currentGroup.firstChild
  // thisBubble = group.lastChild.firstChild;      // this is the center/first bubble
  this.state.currentBubble =
    this.state.currentGroup.children[1].children['shift'] // this is the center/first bubble
  this.state.cursorMode = this.state.currentElement.tagName
  if (this.state.currentGroup.attributes.class) {
    this.state.cursorMode = this.state.currentGroup.attributes.class.value
  }
  //// presumption of ordering of shift bubble vs other bubbles: FIRST bubble is shift -- modified other code so TRUE
  let endK = this.state.currentGroup.lastChild.childElementCount // total bubbles, leave the first one
  for (let k = endK; k > 1; k--) {
    this.state.currentGroup.lastChild.lastChild.remove() // remove resize bubbles from the end
  }
  this.state.currentGroup.removeEventListener(
    'mouseenter',
    this.handleMouseEnterFunction
  )
  this.state.currentGroup.removeEventListener(
    'mouseleave',
    this.handleMouseLeaveFunction
  )
  this.state.svgInProgress = 'SHIFT'
  console_log(
    this.configuration.debugLog,
    'svgInProgress = SHIFT, this.state.cursorMode = ' + this.state.cursorMode
  )
}

SVGDraw.prototype.setSizeElement = function (bubble) {
  // end of SHIFT leaves single bubble; should be removed on mouseleave of group
  const group = bubble.parentNode.parentNode // set group for mousemove

  this.state.currentGroup = group // set group for mousemove
  this.state.currentElement = group.firstChild
  this.state.currentBubble = group.lastChild.firstChild // this is the center/first bubble
  this.state.cursorMode = this.state.currentElement.tagName

  if (
    this.state.cursorMode === drawMode.CIRCLE ||
    this.state.cursorMode === drawMode.ELLIPSE
  ) {
    const endK = group.lastChild.childElementCount // total bubbles, leave the first one (thisElement)

    for (let k = endK; k > 0; k--) {
      group.lastChild.lastChild.remove() // remove resize bubbles from the end
    }
  }

  this.state.svgInProgress = 'SIZE'

  console_log(
    this.configuration.debugLog,
    'svgInProgress = SIZE, this.state.cursorMode = ' +
      this.state.cursorMode +
      ' ' +
      this.state.currentElement.tagName
  )

  group.removeEventListener('mouseenter', this.handleMouseEnterFunction)
  group.removeEventListener('mouseleave', this.handleMouseLeaveFunction)
}

SVGDraw.prototype.setPointElement = function (bubble) {
  // this performs the inline substitution of the selected bubble coordinates
  const group = bubble.parentNode.parentNode // set group for mousemove

  this.state.currentBubble = bubble
  this.state.currentGroup = group
  this.state.currentElement = group.firstChild // this is the real element

  if (parseInt(bubble.id) == bubble.parentNode.childElementCount - 1) {
    // last point/bubble?
    this.state.currentBubble = bubble
  }
  if (bubble.parentNode.lastChild.tagName == SVGType.GROUP) {
    bubble.parentNode.lastChild.remove() // /////////// this is the right place: remove insert point bubbles
  }
  if (this.state.currentGroup.attributes.class) {
    this.state.cursorMode = this.state.currentGroup.attributes.class.value
  } else {
    this.state.cursorMode = this.state.currentElement.tagName
  }

  group.removeEventListener('mouseenter', this.handleMouseEnterFunction)
  group.removeEventListener('mouseleave', this.handleMouseLeaveFunction)

  this.state.svgInProgress = 'POINT' // so we have an active element, and it has been marked in progress
  // look for mousedown in handler for circle to transition to rubber band mode
} // use mouseup or mousedown to terminate radius drag

SVGDraw.prototype.setNewPointElement = function (bubble) {
  // this inserts the new point into the <poly.. element
  const group = bubble.parentNode.parentNode.parentNode // set group for mousemove handler

  this.state.currentBubble = bubble
  this.state.currentGroup = group
  this.state.currentElement = group.firstChild // this is the real element

  if (parseInt(bubble.id) == bubble.parentNode.childElementCount - 1) {
    this.state.currentBubble = bubble
  }

  this.state.cursorMode = this.state.currentElement.tagName
  group.removeEventListener('mouseenter', this.handleMouseEnterFunction) // disable mousenter on real element's containing group
  group.removeEventListener('mouseleave', this.handleMouseLeaveFunction) // disable mouseleaver on real element's containing group
  // bubble.attributes['onmousedown'].value = '';  // cascade to onSvgMouseDown
  this.state.currentElement.attributes['points'].value = insertNewPoint(
    this.state.currentElement,
    this.state.currentBubble
  )
  this.state.currentBubble.id = (
    parseInt(this.state.currentBubble.id) + 1
  ).toString() // ///////// seems to work, but...
  this.state.svgInProgress = 'NEW' // so we have an active element, and it has been marked in progress
  // look for mousedown in handler for circle to transition to rubber band mode
} // use mouseup or mousedown to terminate radius drag

function insertNewPoint(element, bubble) {
  //this bubble's ID truncated is the point to insert AFTER
  const { cx, cy } = bubble.attributes
  const insertionPoint = parseInt(bubble.id)
  const thisPoint = cx.value + ',' + cy.value
  const splitPoints = element.attributes['points'].value.trim().split(' ')

  let thesePoints = ''

  for (let k = 0; k < splitPoints.length; k++) {
    thesePoints += splitPoints[k] + ' '
    if (k == insertionPoint) {
      thesePoints += thisPoint + ' '
    }
  }
  return thesePoints
}

SVGDraw.prototype.createBubbleForCircle = function (
  bubbleGroup,
  { cx, cy, r }
) {
  bubbleGroup.setAttributeNS(null, 'class', 'bubbles')
  bubbleGroup.appendChild(this.createShiftBubble(cx, cy, 'shift')) // this is the center point of both bubble and circle
  bubbleGroup.appendChild(this.createSizeBubble(r + cx, cy, 'E')) // this is the E resize point
  bubbleGroup.appendChild(this.createSizeBubble(cx, r + cy, 'S')) // this is the S resize point
  bubbleGroup.appendChild(this.createSizeBubble(cx - r, cy, 'W')) // this is the W resize point
  bubbleGroup.appendChild(this.createSizeBubble(cx, cy - r, 'N')) // this is the N resize point

  return bubbleGroup
}

SVGDraw.prototype.createBubbleForEllipse = function (
  bubbleGroup,
  { cx, cy, rx, ry }
) {
  bubbleGroup.appendChild(this.createShiftBubble(cx, cy, 'shift')) // this is the center point of both bubble and circle
  bubbleGroup.appendChild(
    this.createSizeBubble(cx + rx * 0.707, cy + ry * 0.707, 'SE')
  ) // this is the SE resize point
  bubbleGroup.appendChild(
    this.createSizeBubble(cx + rx * 0.707, cy - ry * 0.707, 'NE')
  ) // this is the NE resize point
  bubbleGroup.appendChild(
    this.createSizeBubble(cx - rx * 0.707, cy - ry * 0.707, 'NW')
  ) // this is the NW resize point
  bubbleGroup.appendChild(
    this.createSizeBubble(cx - rx * 0.707, cy + ry * 0.707, 'SW')
  ) // this is the SW resize point

  return bubbleGroup
}

SVGDraw.prototype.createBubbleForRectangle = function (
  bubbleGroup,
  { x, y, width, height }
) {
  bubbleGroup.appendChild(this.createShiftBubble(x, y, 'shift')) // this is the rectangle origin, anomalous as it may be
  bubbleGroup.appendChild(this.createSizeBubble(x + width, y + height)) // this is the resize point

  return bubbleGroup
}

SVGDraw.prototype.createBubbleForLine = function (
  bubbleGroup,
  { x1, y1, x2, y2 }
) {
  bubbleGroup.appendChild(
    this.createShiftBubble((x2 + x1) / 2, (y2 + y1) / 2, 'shift')
  ) // this is the move line point
  bubbleGroup.appendChild(this.createPointBubble(x1, y1, 'x1-y1')) // this is the 1st line coordinate
  bubbleGroup.appendChild(this.createPointBubble(x2, y2, 'x2-y2')) // this is the 2nd (terminal) line point

  return bubbleGroup
}

SVGDraw.prototype.createBubbleForPath = function (bubbleGroup, element) {
  let theseCurvePoints = element.attributes['d'].value
  let thisCurveTypeQuadratic = theseCurvePoints.indexOf('Q ') > 0
  let theseCoords = getCurveCoords(theseCurvePoints) // stack control points after end points after helpers
  // fill out both control points in either case
  if (thisCurveTypeQuadratic) {
    // if quadratic
    theseCoords[6] = theseCoords[4] // replicate p2
    theseCoords[7] = theseCoords[5] // into last coord set
    theseCoords[4] = theseCoords[2] // for both control points
    theseCoords[5] = theseCoords[3] // for control lines
  }
  // calculate centroid for shift bubble
  let xn, yn
  if (thisCurveTypeQuadratic) {
    xn =
      parseFloat(theseCoords[0]) +
      parseFloat(theseCoords[2]) +
      parseFloat(theseCoords[6])
    yn =
      parseFloat(theseCoords[1]) +
      parseFloat(theseCoords[3]) +
      parseFloat(theseCoords[7])
    xn = (xn / 3).toFixed(4)
    yn = (yn / 3).toFixed(4) // this calculation is less wrong for quadratic ...
  } else {
    xn =
      parseFloat(theseCoords[0]) +
      parseFloat(theseCoords[2]) +
      parseFloat(theseCoords[4]) +
      parseFloat(theseCoords[6])
    yn =
      parseFloat(theseCoords[1]) +
      parseFloat(theseCoords[3]) +
      parseFloat(theseCoords[5]) +
      parseFloat(theseCoords[7])
    xn = (xn / 4).toFixed(4)
    yn = (yn / 4).toFixed(4)
  }
  // create the "bounding" polygon  'poly'
  bubbleGroup.appendChild(
    createBoundsPoly({
      coords: theseCoords,
      attributes: this.getSVGAttributes()
    })
  )
  bubbleGroup.appendChild(this.createShiftBubble(xn, yn, 'shift')) // this is the move element bubble
  // create the lines between the control point(s) and the endpoints
  bubbleGroup.appendChild(
    createControlLine({
      x1: theseCoords[0],
      y1: theseCoords[1],
      x2: theseCoords[2],
      y2: theseCoords[3],
      id: 'l1',
      attributes: this.getSVGAttributes()
    })
  )
  bubbleGroup.appendChild(
    createControlLine({
      x1: theseCoords[4],
      y1: theseCoords[5],
      x2: theseCoords[6],
      y2: theseCoords[7],
      id: 'l2',
      attributes: this.getSVGAttributes()
    })
  )
  bubbleGroup.appendChild(
    this.createCurveBubble(theseCoords[0], theseCoords[1], 'p1')
  ) // first endpoint
  bubbleGroup.appendChild(
    this.createCurveBubble(theseCoords[6], theseCoords[7], 'p2')
  ) // second endpoint
  bubbleGroup.appendChild(
    this.createCurveBubble(theseCoords[2], theseCoords[3], 'c1')
  ) // first control point

  if (!thisCurveTypeQuadratic) {
    bubbleGroup.appendChild(
      this.createCurveBubble(theseCoords[4], theseCoords[5], 'c2')
    ) // second control point
  }

  return bubbleGroup
}

SVGDraw.prototype.createBubbleForPolyline = function (bubbleGroup, element) {
  const thesePoints = element.attributes['points'].value.trim() // trim to eliminate extraneous empty string
  const splitPoints = thesePoints.split(' ')
  const thisPoint = splitPoints[0].split(',') // prime the pump for iteration
  let x = parseFloat(thisPoint[0])
  let y = parseFloat(thisPoint[1])
  let nextX
  let nextY

  let xAve = 0
  let yAve = 0
  let nextPoint
  // nextX,nextY these are used to bound and calculate the intermediate
  for (let k = 0; k < splitPoints.length; k++) {
    // append this point and an intermediary point
    xAve += x // simple computation
    yAve += y // of center-ish point
    if (k < splitPoints.length - 1) {
      // since we are looking ahead one point
      nextPoint = splitPoints[k + 1].split(',') // only add intermediate point if we are not at the last point
      nextX = parseFloat(nextPoint[0])
      nextY = parseFloat(nextPoint[1])
      x = nextX
      y = nextY
    }
  }
  x = xAve / splitPoints.length
  y = yAve / splitPoints.length
  bubbleGroup.appendChild(this.createShiftBubble(x, y, 'shift'))

  // insert new point bubbles in separate parallel group
  const newBubbleGroup = document.createElementNS(
    'http://www.w3.org/2000/svg',
    SVGType.GROUP
  )

  x = parseFloat(thisPoint[0])
  y = parseFloat(thisPoint[1])
  for (let k = 0; k < splitPoints.length; k++) {
    // append this point and an intermediary point
    //thisPoint  = splitPoints[k].split(',');
    bubbleGroup.appendChild(this.createPointBubble(x, y, k.toString())) // add the vertex point
    if (k < splitPoints.length - 1) {
      // since we are looking ahead one point
      nextPoint = splitPoints[k + 1].split(',') // only add intermediate point if we are not at the last point
      nextX = parseFloat(nextPoint[0])
      nextY = parseFloat(nextPoint[1])
      newBubbleGroup.appendChild(
        this.createNewPointBubble(
          0.5 * (x + nextX),
          0.5 * (y + nextY),
          k.toString() + '.5'
        )
      )
      // ///////// watch for hierarchicial misplacement
      x = nextX
      y = nextY
    }
  }

  if (element.tagName == drawMode.POLYGON) {
    // additional step for polygon, since there is an implicit closure
    const [pointX, pointY] = splitPoints[0].split(',') // get the first point again
    const id = (splitPoints.length - 1).toString() + '.5'

    x = parseFloat(pointX)
    y = parseFloat(pointY)

    newBubbleGroup.appendChild(
      this.createNewPointBubble(0.5 * (x + nextX), 0.5 * (y + nextY), id)
    )
  }

  bubbleGroup.appendChild(newBubbleGroup) // add the new point insertion bubbles

  return bubbleGroup
}

SVGDraw.prototype.createBubbleForText = function (bubbleGroup, { x, y }) {
  bubbleGroup.appendChild(this.createShiftBubble(x, y, 'shift'))

  return bubbleGroup
}

SVGDraw.prototype.createBubbleGroup = function (group) {
  if (!group) {
    console_log(
      this.configuration.debugLog,
      'group arg null, thisGroup=' + this.state.currentGroup
    )
  }

  const element = group.firstChild
  const svgAttrs = getModel(element.tagName)
  const bubbleGroup = document.createElementNS(
    'http://www.w3.org/2000/svg',
    SVGType.GROUP
  )

  bubbleGroup.classList.add('bubbles')

  if (element.tagName !== SVGType.PATH) {
    // /////// skip this step for path exception
    for (let key in svgAttrs) {
      // collect basic (numeric) attributes for positioning and extent
      svgAttrs[key] = getAttributeValue(element, key) // collect this numeric attribute
    }
  }

  switch (element.tagName) {
    case SVGType.CIRCLE: // 1 relocation bubble, 4 compass-point resize bubbles (flagged SHIFT and SIZE respecively)
      return this.createBubbleForCircle(bubbleGroup, svgAttrs)
    case SVGType.ELLIPSE: // 1 relocation bubble, 4 compass-point resize bubbles (flagged SHIFT and SIZE respecively)
      return this.createBubbleForEllipse(bubbleGroup, svgAttrs)
    case SVGType.RECT:
      return this.createBubbleForRectangle(bubbleGroup, svgAttrs)
    case SVGType.LINE:
      return this.createBubbleForLine(bubbleGroup, svgAttrs)
    case SVGType.PATH: // this is a MAJOR EXCEPTION to the other cases, used for curve !! articulate for type !!
      return this.createBubbleForPath(bubbleGroup, element)
    case drawMode.POLYGON:
    case drawMode.POLYLINE: // create a parallel structure to the point attr, using its coords
      return this.createBubbleForPolyline(bubbleGroup, element)
    case SVGType.TEXT:
      return this.createBubbleForText(bubbleGroup, svgAttrs)
  }
}

SVGDraw.prototype.createShiftBubble = function (cx, cy, id) {
  const bubble = this.createBubbleStub(cx, cy)

  bubble.setAttributeNS(null, 'r', this.state.bubbleRadius * 1.25) // radius override for SHIFT point
  bubble.setAttributeNS(null, 'stroke', '#004477') // override scaffold attrs
  bubble.setAttributeNS(null, 'fill-opacity', '1.0') // SHIFT bubble is slightly more opaque
  bubble.addEventListener('mousedown', () => {
    this.setShiftElement(bubble)
  })
  bubble.addEventListener('mouseup', () => {
    this.setElementMouseEnterLeave(bubble)
  })
  bubble.setAttributeNS(null, 'style', 'cursor:move;')
  bubble.setAttributeNS(null, 'id', id) // use this identifier to attach cursor in onSvgMouseMove

  return bubble
}

SVGDraw.prototype.createSizeBubble = function (cx, cy, id) {
  let bubble = this.createBubbleStub(cx, cy)
  bubble.setAttributeNS(null, 'fill-opacity', '0.6') // SIZE/POINT bubble is slightly less opaque
  bubble.addEventListener('mousedown', () => {
    this.setSizeElement(bubble)
  })
  // bubble.addEventListener('mouseup', (event) => { setElementMouseEnterLeave(bubble) });
  bubble.setAttributeNS(null, 'id', id) // use this identifier to attach cursor in onSvgMouseMove
  return bubble
}

SVGDraw.prototype.createPointBubble = function (cx, cy, id) {
  // used for <poly...> vertices
  const bubble = this.createBubbleStub(cx, cy)

  bubble.setAttributeNS(null, 'fill-opacity', '0.6') // SIZE/POINT bubble is slightly less opaque
  bubble.setAttributeNS(null, 'id', id) // use this identifier to attach cursor in onSvgMouseMove
  // will take the form: 'x1-y1', 'x2-y2' for <line>,
  // will take the form: '0', '13' for <poly-...>
  bubble.addEventListener('mousedown', () => {
    this.setPointElement(bubble)
  })
  /*   bubble.addEventListener('mouseup', (event) => {
    exitEditPoint(thisGroup)
  }); */
  return bubble
}

SVGDraw.prototype.createNewPointBubble = function (cx, cy, id) {
  // used for <poly...> inter-vertex insert new point
  const bubble = this.createBubbleStub(cx, cy)

  bubble.setAttributeNS(null, 'r', this.state.bubbleRadius * 0.8) // radius override for insertion point
  bubble.setAttributeNS(null, 'stroke', '#555555') // not that great, use below
  bubble.setAttributeNS(null, 'stroke-opacity', '0.6') // not that great, use below
  bubble.setAttributeNS(null, 'fill-opacity', '0.4') // SIZE/POINT bubble is even less opaque
  bubble.addEventListener('mousedown', () => {
    this.setNewPointElement(bubble)
  })
  /*   bubble.addEventListener('mouseup', (event) => {
    exitEditPoint(thisGroup)
  }); */
  bubble.setAttributeNS(null, 'id', id) // use this identifier to attach cursor in onSvgMouseMove
  // will take the form: '0.5', '23.5' for <poly-...>
  return bubble
}

SVGDraw.prototype.createCurveBubble = function (cx, cy, id) {
  // used for <path...> inter-vertex control point
  const bubble = this.createBubbleStub(cx, cy)
  // bubble.setAttributeNS(null, 'r', bubbleRadius * 0.8);      // radius override for control point
  bubble.setAttributeNS(null, 'stroke', '#333333') // not that great, use below
  bubble.setAttributeNS(null, 'stroke-opacity', '0.6') // not that great, use below
  bubble.setAttributeNS(null, 'fill-opacity', '0.8') // make these stand out
  bubble.addEventListener('mousedown', () => {
    this.setPointElement(bubble)
  })
  /*   bubble.addEventListener('mouseup', (event) => {
    exitEditPoint(event.target.parentElement.parentElement)
  }); */
  bubble.setAttributeNS(null, 'id', id) // use this identifier to attach cursor in onSvgMouseMove
  // will take the form: 'c1', 'c2' for <path-...>
  return bubble
}

function createControlLine({ x1, y1, x2, y2, id, attributes }) {
  const line = newElement({ tag: drawMode.LINE, attributes })

  line.setAttributeNS(null, 'x1', x1)
  line.setAttributeNS(null, 'y1', y1)
  line.setAttributeNS(null, 'x2', x2)
  line.setAttributeNS(null, 'y2', y2)
  line.setAttributeNS(null, 'id', id)
  line.setAttributeNS(null, 'stroke-width', '1')

  return line
}

function createBoundsPoly({ coords, attributes }) {
  // used by createBubbleGroup.path
  const poly = newElement({ tag: drawMode.POLYLINE, attributes })

  poly.setAttributeNS(null, 'id', 'poly')
  poly.setAttributeNS(null, 'points', getCurvePoints(coords))
  poly.setAttributeNS(null, 'stroke-opacity', '0.0')

  return poly
}

SVGDraw.prototype.createBubbleStub = function (offsetX, offsetY) {
  // create same-size bubble
  const bubble = newElement({
    tag: drawMode.CIRCLE,
    attributes: this.getSVGAttributes()
  }) // this is constant, since it is a bubble

  if (isNaN(offsetX)) {
    alert('offsetX: ' + offsetX.toString())
  }
  if (isNaN(offsetY)) {
    alert('offsetY: ' + offsetY.toString())
  }
  bubble.setAttributeNS(null, 'cx', offsetX) // start x
  bubble.setAttributeNS(null, 'cy', offsetY) // start y
  bubble.setAttributeNS(null, 'r', this.state.bubbleRadius) // radius
  bubble.setAttributeNS(null, 'fill', '#FFFFFF')
  bubble.setAttributeNS(null, 'stroke', '#222222') // set scaffold attrs
  bubble.setAttributeNS(null, 'stroke-width', this.state.bubbleRadius * 0.25)

  return bubble
}

function getAttributeValue(element, attr) {
  // convert string numeric and truncate to one place after decimal
  return parseFloat(parseFloat(element.attributes[attr].value).toFixed(1))
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n)
}

SVGDraw.prototype.onSvgMouseMove = function (event) {
  this.renderFunction(event)
  event.preventDefault()
  return false
}

function length2points(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
}

/* let Trig = {
  distanceBetween2Points: function (point1, point2) {
    let dx = point2.x - point1.x
    let dy = point2.y - point1.y
    return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2))
  },

  angleBetween2Points: function (point1, point2) {
    let dx = point2.x - point1.x
    let dy = point2.y - point1.y
    return Math.atan2(dx, dy)
  }
} */

SVGDraw.prototype._getMousePosition = function (event) {
  const rect = this.containerElement.getBoundingClientRect()

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
}

SVGDraw.prototype.updateMousePosition = function (event) {
  const target = this.touchSupported ? event.originalEvent.touches[0] : event

  this.state.mousePosition = this._getMousePosition(target)
}

SVGDraw.prototype.updateSvgByElement = function (event) {
  /*
   This section services updating of svg element thisElement from onSvgMouseMove

   The initial scheme prior to editing of elements was to dynamically update the current point
   of the currently being created thisElement. This point has been the latest or final point
   in the element, where <circle>, <ellipse>, <rect>angle, and <line> have only the initial
   point (set during onSvgMouseDown) and a final point/datum.

   The general scheme up to implementation of editing <line>/<polyline>/<polygon> element types
   has been to articulate thisElement through the svgInProgress state (SHIFT, SIZE, this.state.cursorMode)
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

  if (this.state.cursorMode != drawMode.MOVE) {
    // if we are not moving(dragging) the SVG check the known tags
    if (
      this.state.cursorMode === drawMode.POLYGON ||
      (this.state.cursorMode === drawMode.POLYLINE &&
        this.state.svgInProgress === drawMode.POLYGON)
    ) {
      if (this.state.svgInProgress == false) {
        return
      } // could be POINT or NEW or polygon
      this.updateMousePosition(event)
      if (this.state.svgInProgress == 'SHIFT') {
        let shiftingPoints =
          this.state.currentElement.attributes['points'].value.trim()
        let splitShiftPoints = shiftingPoints.split(' ')
        if (this.state.currentBubble != null) {
          // thisBubble set on mousedown
          let cx = parseFloat(this.state.currentBubble.attributes['cx'].value) // old
          let cy = parseFloat(this.state.currentBubble.attributes['cy'].value) // x, y
          let cx2 = this.currentMouseX // new x
          let cy2 = this.currentMouseY // , y
          let dx = cx2 - cx
          let dy = cy2 - cy
          this.state.currentBubble.attributes['cx'].value = this.currentMouseX // translate the bubble
          this.state.currentBubble.attributes['cy'].value = this.currentMouseY

          // splitShiftPoints all need to be shifted by the deltas
          // so iterate over all points, in initially a very pedantic way
          let shiftedPoints = ''
          let j //iterator for decomposing x, y point lists
          let xPoints = []
          let yPoints = []
          for (j = 0; j < splitShiftPoints.length; j++) {
            let thisXY = splitShiftPoints[j].split(',')
            xPoints[j] = (parseFloat(thisXY[0]) + dx).toFixed(4)
            yPoints[j] = (parseFloat(thisXY[1]) + dy).toFixed(4)
            shiftedPoints += xPoints[j] + ',' + yPoints[j] + ' '
          }
          for (let k = 0; k < splitShiftPoints.length; k++) {
            shiftingPoints += splitShiftPoints[k] + ' '
          }
          this.state.currentElement.attributes['points'].value = shiftedPoints
        }
      } else {
        let thisPoint =
          this.currentMouseX.toFixed(4).toString() +
          ',' +
          this.currentMouseY.toFixed(4).toString()
        let thesePoints =
          this.state.currentElement.attributes['points'].value.trim()
        let splitPoints = thesePoints.split(' ')
        if (this.state.currentBubble != null) {
          // look for bubble to denote just move THIS point only
          this.state.currentBubble.attributes['cx'].value = this.currentMouseX // translate the bubble
          this.state.currentBubble.attributes['cy'].value = this.currentMouseY
          if (isNumeric(this.state.currentBubble.id)) {
            // presume integer for now
            splitPoints[parseInt(this.state.currentBubble.id)] = thisPoint
            thesePoints = ''
            for (let k = 0; k < splitPoints.length; k++) {
              thesePoints += splitPoints[k] + ' '
            }
            this.state.currentElement.attributes['points'].value = thesePoints
          }
        } else {
          // svgInProgress = 'poly--', so normal creation of element adding new point to end
          thesePoints = '' // clear thecollector
          for (let k = 0; k < splitPoints.length - 1; k++) {
            // reconstruct except for the last point
            thesePoints += splitPoints[k] + ' ' // space delimiter at the end of each coordinate
          }
          thisPoint += ' '
          this.state.currentElement.attributes['points'].value =
            thesePoints.concat(thisPoint)
        }
      }
    } else if (this.state.cursorMode == drawMode.POLYLINE) {
      if (this.state.svgInProgress == false) {
        return
      }
      this.updateMousePosition(event)
      if (this.state.svgInProgress == 'SHIFT') {
        let shiftingPoints =
          this.state.currentElement.attributes['points'].value.trim()
        let splitShiftPoints = shiftingPoints.split(' ')
        if (this.state.currentBubble != null) {
          // thisBubble set on mousedown
          let cx = parseFloat(this.state.currentBubble.attributes['cx'].value) // old
          let cy = parseFloat(this.state.currentBubble.attributes['cy'].value) // x, y
          let cx2 = this.currentMouseX // new x
          let cy2 = this.currentMouseY // , y
          let dx = cx2 - cx
          let dy = cy2 - cy
          this.state.currentBubble.attributes['cx'].value = this.currentMouseX // translate the bubble
          this.state.currentBubble.attributes['cy'].value = this.currentMouseY

          // splitShiftPoints all need to be shifted by the deltas
          // so iterate over all points, in initially a very pedantic way
          let shiftedPoints = ''
          let j //iterator for decomposing x, y point lists
          let xPoints = []
          let yPoints = []
          for (j = 0; j < splitShiftPoints.length; j++) {
            let thisXY = splitShiftPoints[j].split(',')
            xPoints[j] = (parseFloat(thisXY[0]) + dx).toFixed(4)
            yPoints[j] = (parseFloat(thisXY[1]) + dy).toFixed(4)
            shiftedPoints += xPoints[j] + ',' + yPoints[j] + ' '
          }
          for (let k = 0; k < splitShiftPoints.length; k++) {
            shiftingPoints += splitShiftPoints[k] + ' '
          }
          this.state.currentElement.attributes['points'].value = shiftedPoints
        }
      } else {
        let thisPoint =
          this.currentMouseX.toFixed(4).toString() +
          ',' +
          this.currentMouseY.toFixed(4).toString()
        let thesePoints =
          this.state.currentElement.attributes['points'].value.trim()
        let splitPoints = thesePoints.split(' ')
        if (this.state.currentBubble != null) {
          // look for bubble to denote just move THIS point only
          this.state.currentBubble.attributes['cx'].value = this.currentMouseX // translate the bubble
          this.state.currentBubble.attributes['cy'].value = this.currentMouseY
          if (isNumeric(this.state.currentBubble.id)) {
            // presume integer for now
            splitPoints[parseInt(this.state.currentBubble.id)] = thisPoint // replace this point
            thesePoints = ''
            for (let k = 0; k < splitPoints.length; k++) {
              thesePoints += splitPoints[k] + ' '
            }
            this.state.currentElement.attributes['points'].value = thesePoints
          }
        } else {
          // svgInProgress = 'poly--', so normal creation of element adding new point to end
          thesePoints = '' // clear the collector
          for (let k = 0; k < splitPoints.length - 1; k++) {
            // reconstruct except for the last point
            thesePoints += splitPoints[k] + ' ' // space delimiter at the end of each coordinate
          }
          thisPoint += ' '
          this.state.currentElement.attributes['points'].value =
            thesePoints.concat(thisPoint)
        }
      }
    } else if (this.state.cursorMode == drawMode.RECTANGLE) {
      if (this.state.svgInProgress == false) {
        return
      }
      if (this.state.svgInProgress == 'SHIFT') {
        this.updateMousePosition(event)
        this.state.currentBubble.attributes['cx'].value = this.currentMouseX // translate the bubble
        this.state.currentBubble.attributes['cy'].value = this.currentMouseY
        this.state.currentElement.attributes['x'].value =
          this.currentMouseX.toFixed(4) // correspondingly translate thisElement
        this.state.currentElement.attributes['y'].value =
          this.currentMouseY.toFixed(4)
      } else {
        let thisRectX = this.state.currentElement.attributes['x'].value
        let thisRectY = this.state.currentElement.attributes['y'].value

        this.updateMousePosition(event)
        this.state.currentElement.attributes['width'].value = Math.max(
          1,
          (this.currentMouseX - thisRectX).toFixed(4)
        )
        this.state.currentElement.attributes['height'].value = Math.max(
          1,
          (this.currentMouseY - thisRectY).toFixed(4)
        )
        if (this.state.currentBubble) {
          this.state.currentBubble = event.target
          if (
            'cx' in this.state.currentBubble.attributes &&
            'cy' in this.state.currentBubble.attributes
          ) {
            this.state.currentBubble.attributes['cx'].value = this.currentMouseX // translate the bubble
            this.state.currentBubble.attributes['cy'].value = this.currentMouseY
          }
        }
      }
    } else if (this.state.cursorMode == drawMode.LINE) {
      let linePoints
      if (event.type == 'mousedown' || this.state.svgInProgress == false) {
        // extra condition for line
        console_log(
          this.configuration.debugLog,
          'this.state.cursorMode=line abort event:' +
            event.type +
            ' svgInProgress= ' +
            this.state.svgInProgress
        )
        return
      }
      if (this.state.svgInProgress == 'SHIFT') {
        this.updateMousePosition(event)
        let x1 = parseFloat(this.state.currentElement.attributes['x1'].value)
        let y1 = parseFloat(this.state.currentElement.attributes['y1'].value)
        let x2 = parseFloat(this.state.currentElement.attributes['x2'].value)
        let y2 = parseFloat(this.state.currentElement.attributes['y2'].value)
        // thisBubble set on mousedown
        let cx = parseFloat(this.state.currentBubble.attributes['cx'].value)
        let cy = parseFloat(this.state.currentBubble.attributes['cy'].value)
        let cx2 = this.currentMouseX
        let cy2 = this.currentMouseY
        let dx = cx - cx2
        let dy = cy2 - cy

        if (this.state.currentBubble) {
          this.state.currentBubble.attributes['cx'].value = cx2 // translate the bubble
          this.state.currentBubble.attributes['cy'].value = cy2
          this.state.currentElement.attributes['x1'].value = (x1 - dx).toFixed(
            4
          ) // correspondingly translate thisElement
          this.state.currentElement.attributes['y1'].value = (dy + y1).toFixed(
            4
          )
          this.state.currentElement.attributes['x2'].value = (x2 - dx).toFixed(
            4
          ) // correspondingly translate thisElement
          this.state.currentElement.attributes['y2'].value = (dy + y2).toFixed(
            4
          )
        }
      } else {
        // repositioning either line endpoint
        this.updateMousePosition(event)
        linePoints = ['x2', 'y2'] // preset for normal post-creation mode
        if (this.state.currentBubble != null) {
          // look for bubble to denote just move THIS point only
          this.state.currentBubble.attributes['cx'].value = this.currentMouseX // translate the bubble
          this.state.currentBubble.attributes['cy'].value = this.currentMouseY
          if (!isNumeric(this.state.currentBubble.id)) {
            // presume either 'x1-y1' or 'x2-y2'
            linePoints = this.state.currentBubble.id.split('-') // this will result in ['x1', 'y1'] or  ['x2', 'y2'] used below
          }
          if (this.state.currentGroup.lastChild.firstChild.id == 'shift') {
            this.state.currentGroup.lastChild.firstChild.remove() // kill off the move line bubble
          }
        }
        this.state.currentElement.attributes[linePoints[0]].value =
          this.currentMouseX.toFixed(4)
        this.state.currentElement.attributes[linePoints[1]].value =
          this.currentMouseY.toFixed(4)
        console_log(
          this.configuration.debugLog,
          'x: ' +
            this.currentMouseX.toString() +
            ' / y: ' +
            this.currentMouseY.toString()
        )
      }
    } else if (this.state.cursorMode == drawMode.ARROW) {
      let linePoints
      if (event.type == 'mousedown' || this.state.svgInProgress == false) {
        // extra condition for line
        return
      }
      let mainLine = this.state.currentGroup.children[0]
      this.updateMousePosition(event)
      if (this.state.svgInProgress == 'SHIFT') {
        let x1 = parseFloat(mainLine.attributes['x1'].value)
        let y1 = parseFloat(mainLine.attributes['y1'].value)
        let x2 = parseFloat(mainLine.attributes['x2'].value)
        let y2 = parseFloat(mainLine.attributes['y2'].value)
        // thisBubble set on mousedown -- except not here for some reason TBD
        if (!this.state.currentBubble) {
          this.state.currentBubble =
            mainLine.parentElement.lastChild.children['shift']
        }
        let cx = parseFloat(this.state.currentBubble.attributes['cx'].value)
        let cy = parseFloat(this.state.currentBubble.attributes['cy'].value)
        let cx2 = this.currentMouseX
        let cy2 = this.currentMouseY
        let dx = cx - cx2
        let dy = cy2 - cy
        this.state.currentBubble.attributes['cx'].value = cx2 // translate the bubble
        this.state.currentBubble.attributes['cy'].value = cy2
        mainLine.attributes['x1'].value = (x1 - dx).toFixed(4) // correspondingly
        mainLine.attributes['y1'].value = (dy + y1).toFixed(4)
        mainLine.attributes['x2'].value = (x2 - dx).toFixed(4) // translate mainLine
        mainLine.attributes['y2'].value = (dy + y2).toFixed(4)
      } else {
        linePoints = ['x2', 'y2'] // preset for normal post-creation mode
        if (this.state.currentBubble != null) {
          // look for bubble to denote just move THIS point only
          this.state.currentBubble.attributes['cx'].value = this.currentMouseX // translate the bubble
          this.state.currentBubble.attributes['cy'].value = this.currentMouseY
          if (!isNumeric(this.state.currentBubble.id)) {
            // presume either 'x1-y1' or 'x2-y2'
            linePoints = this.state.currentBubble.id.split('-') // this will result in ['x1', 'y1'] or  ['x2', 'y2'] used below
          }
        }
        mainLine.attributes[linePoints[0]].value = this.currentMouseX.toFixed(4)
        mainLine.attributes[linePoints[1]].value = this.currentMouseY.toFixed(4)
      }
      while (this.state.currentGroup.childElementCount > 1) {
        // remove everything except the main line
        this.state.currentGroup.lastChild.remove() // ///////////////////  VERY TEMPORARY METHOD
      }
      let thisX1 = this.state.currentElement.attributes['x1'].value // shorter references to original line's values
      let thisY1 = this.state.currentElement.attributes['y1'].value
      let thisX2 = this.state.currentElement.attributes['x2'].value
      let thisY2 = this.state.currentElement.attributes['y2'].value
      let thisColor = this.state.currentElement.attributes['stroke'].value
      let currentStrokeWidth =
        this.state.currentElement.attributes['stroke-width'].value // save mainLine attributes since NEW barbs
      let deltaX = thisX2 - thisX1
      let deltaY = thisY2 - thisY1
      let lineLength = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      if (lineLength == 0) {
        lineLength = 1
      } // preempt divide by 0
      let dx = deltaX / lineLength
      let dy = deltaY / lineLength
      let barbLength
      if (this.arrowFixed) {
        barbLength = this.configuration.arrowheadLength
      } else {
        // either fixed pixel length or percentage
        barbLength = (lineLength * this.configuration.arrowPercent) / 100
      }
      let pctX = parseFloat(thisX2) - dx * barbLength //  baseline for barb trailing end
      let pctY = parseFloat(thisY2) - dy * barbLength
      let x3 = (pctX + (barbLength * dy) / 2).toFixed(4)
      let y3 = (pctY - (barbLength * dx) / 2).toFixed(4)
      let x4 = (pctX - (barbLength * dy) / 2).toFixed(4)
      let y4 = (pctY + (barbLength * dx) / 2).toFixed(4)

      let leftBarb = newElement({
        tag: drawMode.LINE,
        attributes: this.getSVGAttributes()
      })
      leftBarb.setAttributeNS(null, 'x1', thisX2) // start x of barbs
      leftBarb.setAttributeNS(null, 'y1', thisY2) // start y of barbs
      leftBarb.setAttributeNS(null, 'x2', x3) // end x
      leftBarb.setAttributeNS(null, 'y2', y3) // end y
      leftBarb.setAttributeNS(null, 'stroke', thisColor)
      leftBarb.setAttributeNS(null, 'stroke-width', currentStrokeWidth)
      // thisGroup.appendChild(leftBarb);
      let rightBarb = newElement({
        tag: drawMode.LINE,
        attributes: this.getSVGAttributes()
      })
      rightBarb.setAttributeNS(null, 'x1', thisX2) // start x of barbs
      rightBarb.setAttributeNS(null, 'y1', thisY2) // start y of barbs
      rightBarb.setAttributeNS(null, 'x2', x4) // end x
      rightBarb.setAttributeNS(null, 'y2', y4) // end y
      rightBarb.setAttributeNS(null, 'stroke', thisColor)
      rightBarb.setAttributeNS(null, 'stroke-width', currentStrokeWidth)
      // thisGroup.appendChild(rightBarb);

      if (this.arrowClosed) {
        let baseBarb = newElement({
          tag: drawMode.POLYGON,
          attributes: this.getSVGAttributes()
        })
        let barbPoints =
          thisX2 + ',' + thisY2 + ' ' + x3 + ',' + y3 + ' ' + x4 + ',' + y4
        baseBarb.setAttributeNS(null, 'points', barbPoints)
        baseBarb.setAttributeNS(null, 'stroke', thisColor)
        baseBarb.setAttributeNS(null, 'stroke-width', currentStrokeWidth)
        this.state.currentGroup.appendChild(baseBarb)
      } else {
        this.state.currentGroup.appendChild(leftBarb)
        this.state.currentGroup.appendChild(rightBarb)
      }
    } else if (
      this.state.cursorMode ===
      drawMode.CIRCLE /*|| (this.state.cursorMode == 'bubble')*/
    ) {
      //thisCircle = thisElement;             // first step toward generalizing SHIFT/SIZE handlers
      if (event.type == 'mousedown' || this.state.svgInProgress == false) {
        return // //// this has been verified to actually occur
      }
      if (this.state.svgInProgress == 'SHIFT') {
        // changing position of this element
        this.updateMousePosition(event)
        this.state.currentBubble.attributes['cx'].value = this.currentMouseX // translate the bubble
        this.state.currentBubble.attributes['cy'].value = this.currentMouseY
        this.state.currentElement.attributes['cx'].value =
          this.currentMouseX.toFixed(4) // correspondingly translate thisElement
        this.state.currentElement.attributes['cy'].value =
          this.currentMouseY.toFixed(4)
      } else {
        // either resizing or originally sizing
        //this.context.moveTo(this.state.mousePosition.x, this.state.mousePosition.y);
        let thisCircX = this.state.currentElement.attributes['cx'].value
        let thisCircY = this.state.currentElement.attributes['cy'].value
        this.updateMousePosition(event)

        let radius = length2points(
          thisCircX,
          thisCircY,
          this.currentMouseX,
          this.currentMouseY
        )
        this.state.currentElement.attributes['r'].value = radius.toFixed(4)
        if (this.state.currentBubble) {
          this.state.currentBubble = event.target
          switch (this.state.currentBubble.id) {
            case 'E':
              this.state.currentBubble.attributes['cx'].value =
                parseFloat(thisCircX) + radius
              break
            case 'S':
              this.state.currentBubble.attributes['cy'].value =
                parseFloat(thisCircY) + radius
              break
            case 'W':
              this.state.currentBubble.attributes['cx'].value =
                parseFloat(thisCircX) - radius
              break
            case 'N':
              this.state.currentBubble.attributes['cy'].value =
                parseFloat(thisCircY) - radius
              break
          }
        }
        let bubbles = event.target.parentElement.children
        if (bubbles['E']) {
          // translate editing circle's bubbles
          bubbles['E'].attributes['cx'].value = parseFloat(thisCircX) + radius
          bubbles['S'].attributes['cy'].value = parseFloat(thisCircY) + radius
          bubbles['W'].attributes['cx'].value = parseFloat(thisCircX) - radius
          bubbles['N'].attributes['cy'].value = parseFloat(thisCircY) - radius
        }
      }
    } else if (this.state.cursorMode == drawMode.ELLIPSE) {
      if (event.type == 'mousedown' || this.state.svgInProgress == false) {
        return
      }
      if (this.state.svgInProgress == 'SHIFT') {
        // changing position of this element
        this.updateMousePosition(event)
        this.state.currentBubble.attributes['cx'].value = this.currentMouseX // translate the bubble
        this.state.currentBubble.attributes['cy'].value = this.currentMouseY
        this.state.currentElement.attributes['cx'].value =
          this.currentMouseX.toFixed(4) // correspondingly translate thisElement
        this.state.currentElement.attributes['cy'].value =
          this.currentMouseY.toFixed(4)
      } else {
        // resizing: cursor NOW osculates ellipse as in circle, diagonally positioned
        let thisEllipseX = this.state.currentElement.attributes['cx'].value
        let thisEllipseY = this.state.currentElement.attributes['cy'].value

        this.updateMousePosition(event)

        this.state.currentElement.attributes['rx'].value = (
          Math.abs(thisEllipseX - this.currentMouseX) * 1.414
        ).toFixed(4)
        this.state.currentElement.attributes['ry'].value = (
          Math.abs(thisEllipseY - this.currentMouseY) * 1.414
        ).toFixed(4)
      }
    } else if (this.state.cursorMode == drawMode.DRAW) {
      if (this.state.svgInProgress == false) {
        return
      }
      this.updateMousePosition(event)
      if (this.state.svgInProgress == 'SHIFT') {
        let shiftingPoints =
          this.state.currentElement.attributes['points'].value.trim()
        let splitShiftPoints = shiftingPoints.split(' ')
        if (this.state.currentBubble != null) {
          // thisBubble set on mousedown
          let cx = parseFloat(this.state.currentBubble.attributes['cx'].value) // old
          let cy = parseFloat(this.state.currentBubble.attributes['cy'].value) // x, y
          let cx2 = this.currentMouseX // new x
          let cy2 = this.currentMouseY // , y
          let dx = cx2 - cx
          let dy = cy2 - cy
          this.state.currentBubble.attributes['cx'].value = this.currentMouseX // translate the bubble
          this.state.currentBubble.attributes['cy'].value = this.currentMouseY

          // splitShiftPoints all need to be shifted by the deltas
          // so iterate over all points, in initially a very pedantic way
          let shiftedPoints = ''
          let j //iterator for decomposing x, y point lists
          let xPoints = []
          let yPoints = []
          for (j = 0; j < splitShiftPoints.length; j++) {
            let thisXY = splitShiftPoints[j].split(',')
            xPoints[j] = (parseFloat(thisXY[0]) + dx).toFixed(4)
            yPoints[j] = (parseFloat(thisXY[1]) + dy).toFixed(4)
            shiftedPoints += xPoints[j] + ',' + yPoints[j] + ' '
          }
          for (let k = 0; k < splitShiftPoints.length; k++) {
            shiftingPoints += splitShiftPoints[k] + ' '
          }
          this.state.currentElement.attributes['points'].value = shiftedPoints
        }
      } // end of SHIFT draw case
      else {
        // edit point by bubble
        let thisPoint =
          this.currentMouseX.toFixed(4).toString() +
          ',' +
          this.currentMouseY.toFixed(4).toString()
        let thesePoints =
          this.state.currentElement.attributes['points'].value.trim()
        let splitPoints = thesePoints.split(' ')
        if (this.state.currentBubble != null) {
          // look for bubble to denote just move THIS point only
          // currently, no distinction is made between existing vertex and new point
          // however, this may change in the future JRF 23NOV15
          this.state.currentBubble.attributes['cx'].value = this.currentMouseX // translate the bubble
          this.state.currentBubble.attributes['cy'].value = this.currentMouseY
          if (isNumeric(this.state.currentBubble.id)) {
            // presume integer for now
            splitPoints[parseInt(this.state.currentBubble.id)] = thisPoint // replace this point
            thesePoints = ''
            for (let k = 0; k < splitPoints.length; k++) {
              thesePoints += splitPoints[k] + ' '
            }
            this.state.currentElement.attributes['points'].value = thesePoints
          }
        } // end of edit point case
        else {
          // add new point at end during creation case
          let thesePoints = this.state.currentElement.attributes['points'].value
          let thisPoint =
            this.currentMouseX.toFixed(4).toString() +
            ',' +
            this.currentMouseY.toFixed(4).toString() +
            ' '
          this.state.currentElement.attributes['points'].value =
            thesePoints.concat(thisPoint)
        } // end of new point at end case
      }
    } // end of Draw case
    else if (
      this.state.cursorMode == drawMode.CUBIC ||
      this.state.cursorMode == drawMode.QUADRATIC
    ) {
      if (event.type == 'mousedown' || this.state.svgInProgress == false) {
        // extra condition for line
        return
      }
      this.updateMousePosition(event)
      let thisDvalue = this.state.currentElement.attributes['d'].value
      let thisCurveQuadratic = thisDvalue.indexOf('Q ') > 0
      if (this.state.currentBubble != null) {
        // look for bubble to denote just move THIS point only
        // currently, no distinction is made between existing vertex and new point
        // however, this may change in the future JRF 23NOV15
        let thisX = this.currentMouseX
        let thisY = this.currentMouseY
        let thisX2 = parseFloat(this.state.currentBubble.attributes['cx'].value)
        let thisY2 = parseFloat(this.state.currentBubble.attributes['cy'].value)
        console_log(
          this.configuration.debugLog,
          'endpoints: [' +
            thisX +
            ', ' +
            thisY +
            '], [' +
            thisX2 +
            ', ' +
            thisY2 +
            ']'
        )
        let dx = thisX - thisX2
        let dy = thisY - thisY2
        this.state.currentBubble.attributes['cx'].value = thisX // translate the bubble
        this.state.currentBubble.attributes['cy'].value = thisY
        let theseCoords = getCurveCoords(thisDvalue)
        //#TODO: fix incremental mistracking of shift point, bubble no longer present
        if (this.state.currentBubble.id == 'shift') {
          console_log(this.configuration.debugLog, thisDvalue)
          console_log(this.configuration.debugLog, 'dx: ' + dx + ', dy: ' + dy)
          // tranlate each coordinate (array contains x, y, x, y, ... x, y
          for (let k = 0; k < theseCoords.length; k++) {
            theseCoords[k] = (dx + parseFloat(theseCoords[k])).toFixed(4)
            theseCoords[k + 1] = (dy + parseFloat(theseCoords[k + 1])).toFixed(
              4
            )
            k++
          }
          if (thisCurveQuadratic) {
            //////// this is a kludge to make user the param names line up in getCurveCoords
            theseCoords[6] = theseCoords[4] // populate template curve p2
            theseCoords[7] = theseCoords[5] // coordinates from quadratic p2 values
          }
          this.state.currentElement.attributes['d'].value = this.getCurvePath(
            theseCoords[0],
            theseCoords[1],
            theseCoords[2],
            theseCoords[3],
            theseCoords[4],
            theseCoords[5],
            theseCoords[6],
            theseCoords[7]
          ) // responds to both C and Q curves
          console_log(
            this.configuration.debugLog,
            this.state.currentElement.attributes['d'].value
          )
        }
        //
        // worksheet data for quadratic and cubic curves is conformed to the same model
        // p1: [0,1], c1: [2,3], c2: [3,4], p2: [6,7]. Only one control point is used
        // for quadratic when actually rendered
        else {
          // process non-shift bubble
          if (thisCurveQuadratic) {
            //////// this is a kludge to make user the param names line up in getCurveCoords
            theseCoords[6] = theseCoords[4] // populate template curve p2
            theseCoords[7] = theseCoords[5] // coordinates from quadratic p2 values
          }
          switch (this.state.currentBubble.id) {
            case 'p1':
              theseCoords[0] = thisX.toFixed(4)
              theseCoords[1] = thisY.toFixed(4)
              break
            case 'p2':
              theseCoords[6] = thisX.toFixed(4)
              theseCoords[7] = thisY.toFixed(4)
              break
            case 'c1':
              theseCoords[2] = thisX.toFixed(4)
              theseCoords[3] = thisY.toFixed(4)
              break
            case 'c2':
              theseCoords[4] = thisX.toFixed(4)
              theseCoords[5] = thisY.toFixed(4)
              break
          }
          if (thisCurveQuadratic) {
            theseCoords[4] = theseCoords[2] // force quadratic curve control
            theseCoords[5] = theseCoords[3] // points to be the same point
          }
          // 'd' is the string containing the path parameters; set it to the updated values
          this.state.currentElement.attributes['d'].value = this.getCurvePath(
            theseCoords[0],
            theseCoords[1],
            theseCoords[2],
            theseCoords[3],
            theseCoords[4],
            theseCoords[5],
            theseCoords[6],
            theseCoords[7]
          ) // responds to both C and Q curves
          // now set the lines for the control points; two lines (l1 and l2) whether cubic or quadratic
          this.state.currentElement.parentElement.lastChild.children[
            'l1'
          ].attributes['x1'].value = theseCoords[0]
          this.state.currentElement.parentElement.lastChild.children[
            'l1'
          ].attributes['y1'].value = theseCoords[1]
          this.state.currentElement.parentElement.lastChild.children[
            'l1'
          ].attributes['x2'].value = theseCoords[2]
          this.state.currentElement.parentElement.lastChild.children[
            'l1'
          ].attributes['y2'].value = theseCoords[3]

          this.state.currentElement.parentElement.lastChild.children[
            'l2'
          ].attributes['x1'].value = theseCoords[4]
          this.state.currentElement.parentElement.lastChild.children[
            'l2'
          ].attributes['y1'].value = theseCoords[5]
          this.state.currentElement.parentElement.lastChild.children[
            'l2'
          ].attributes['x2'].value = theseCoords[6]
          this.state.currentElement.parentElement.lastChild.children[
            'l2'
          ].attributes['y2'].value = theseCoords[7]

          this.state.currentElement.parentElement.lastChild.children[
            'poly'
          ].attributes['points'].value =
            getCurvePoints(theseCoords) + theseCoords[0] + ', ' + theseCoords[1] // 'poly' is bounding polygon of endpoints and control points
        }
      } else {
        // defining initial curve as straight line, i.e., rubber-banding p2 until mouseup
        let thisX2 = this.currentMouseX
        let thisY2 = this.currentMouseY
        let thisD
        let thisPathType = ' C ' // set quadratic control point at midpoint, cubic's at 40% and 60% p1:p2
        if (this.state.cursorMode == drawMode.QUADRATIC) thisPathType = ' Q '
        let theseCurvePoints = thisDvalue.split(thisPathType) // isolate control point(s) and p2
        let thisP1 = theseCurvePoints[0].split('M ') // isolate p1
        thisP1 = thisP1[1].split(', ')
        let thisX1 = parseInt(thisP1[0])
        let thisY1 = parseInt(thisP1[1])
        let dx = thisX1 - thisX2
        let dy = thisY1 - thisY2
        let theseControlPoints = theseCurvePoints[1].split(', ') // get array of x,y,x,y(,x,y)
        if (thisPathType == ' Q ') {
          theseControlPoints[0] = (thisX1 - 0.4 * dx).toFixed(4) // single control point
          theseControlPoints[1] = (thisY1 - 0.4 * dy).toFixed(4) // for quadratic
          thisD =
            theseCurvePoints[0] +
            thisPathType +
            curvePoint(theseControlPoints[0], theseControlPoints[1])
        } else {
          // if (this.state.cursorMode == drawMode.CUBIC)
          theseControlPoints[0] = (thisX1 - 0.4 * dx).toFixed(4)
          theseControlPoints[1] = (thisY1 - 0.4 * dy).toFixed(4)
          theseControlPoints[2] = (thisX1 - 0.6 * dx).toFixed(4)
          theseControlPoints[3] = (thisY1 - 0.6 * dy).toFixed(4)
          thisD =
            theseCurvePoints[0] +
            thisPathType +
            curvePoint(theseControlPoints[0], theseControlPoints[1])
          thisD += curvePoint(theseControlPoints[2], theseControlPoints[3])
          thisD += curvePoint(thisX2, thisY2)
          console_log(
            this.configuration.debugLog,
            'p1: ' + thisP1[0] + ', ' + thisP1[1]
          )
          console_log(
            this.configuration.debugLog,
            'control points: ' +
              theseControlPoints[0] +
              ', ' +
              theseControlPoints[1] +
              ' ... ' +
              theseControlPoints[2] +
              ', ' +
              theseControlPoints[3]
          )
          console_log(
            this.configuration.debugLog,
            'p2: ' + thisX2 + ', ' + thisY2
          )
        }
        thisD += pathPoint(thisX2, thisY2)
        this.state.currentElement.attributes['d'].value = thisD
      }
    } else if (this.state.cursorMode == 'text') {
      // translate
      if (this.state.svgInProgress == 'SHIFT') {
        this.updateMousePosition(event)
        if (!this.state.currentBubble) {
          this.state.currentBubble = event.target
        }
        let dx = this.currentMouseX
        let dy = this.currentMouseY
        this.state.currentBubble.attributes['cx'].value = dx // translate the bubble
        this.state.currentBubble.attributes['cy'].value = dy
        for (let i = 0; i < this.state.currentGroup.children.length; i++) {
          // for any text lines in this group (skip bubble)
          if (this.state.currentGroup.children[i].tagName == 'text') {
            // only shift text elements, not bubbles
            this.state.currentGroup.children[i].attributes['x'].value =
              dx.toFixed(4) // translate each <text> element
            this.state.currentGroup.children[i].attributes['y'].value = (
              dy +
              i * this.configuration.fontSize
            ).toFixed(4)
          } else {
            // translate the bubble
            this.state.currentGroup.children[i].children[0].attributes[
              'cx'
            ].value = dx // translate each <text> element
            this.state.currentGroup.children[i].children[0].attributes[
              'cy'
            ].value = dy
          }
        }
      }
    }
  } else if (this.state.cursorMode == drawMode.MOVE) {
    // Revert to MOVE: this version assumes manipulating the transform <xlt> of the SVG via this.state.xC, this.state.yC

    if (this.state.svgInProgress == drawMode.MOVE) {
      let oldX = this.state.mousePosition.x
      let oldY = this.state.mousePosition.y
      this.updateMousePosition(event)
      //this.state.mousePosition.x = this.state.mousePosition.x;
      //this.state.mousePosition.y = this.state.mousePosition.y;
      this.state.xC = this.state.xC - (oldX - this.state.mousePosition.x)
      this.state.yC = this.state.yC - (oldY - this.state.mousePosition.y)
      this.zoom_trans(this.state.xC, this.state.yC, this.state.zoom) // effects the translation to this.state.xC, this.state.yC in the transform
    }
  }
  return event.preventDefault() && false
}

SVGDraw.prototype.onSvgMouseUp = function (event) {
  if (!this.state.svgInProgress) {
    // i.e., if svgInProgress is not false
    event.preventDefault()
    return false
  }

  if (this.state.svgInProgress == 'SHIFT') {
    // this is also catching mouseUp from bubbles!!!
    // mouseup implies end of position shift or resize  ///// HELLO ///// ^^^^^^^
    this.state.svgInProgress = false
    this.clearEditElement(this.state.currentGroup)
  } else if (this.state.svgInProgress == 'SIZE') {
    // mouseup implies end of position shift or resize
    this.state.svgInProgress = false
    this.setElementMouseEnterLeave(this.state.currentElement.parentNode) // this element is a SHIFT bubble
  } else {
    switch (this.state.cursorMode) {
      case drawMode.DRAW:
      case drawMode.CUBIC:
      case drawMode.QUADRATIC:
        this.state.svgInProgress = false
        this.setElementMouseEnterLeave(this.state.currentGroup)
        break
      case drawMode.RECTANGLE:
      case drawMode.LINE:
      case drawMode.ARROW:
      case drawMode.CIRCLE:
      case drawMode.ELLIPSE:
        this.state.svgInProgress = false
        this.setElementMouseEnterLeave(this.state.currentGroup)
        this.state.currentBubble = null
        this.state.currentElement = null
        this.state.currentGroup = null
        break
      case drawMode.POLYGON:
      case drawMode.POLYLINE:
        if (this.state.currentBubble) {
          this.state.svgInProgress = false
          this.setElementMouseEnterLeave(this.state.currentGroup)

          this.state.currentBubble = null
          this.state.currentElement = null
          this.state.currentGroup = null
        }
        break
      case drawMode.TEXT:
        if (this.state.svgInProgress == false) {
          this.setElementMouseEnterLeave(this.state.currentGroup)
        }
        break
      case drawMode.MOVE:
        this.state.svgInProgress = false
    }
  }

  this.state.currentSVGPoints = [] // and clear the collector

  return false
}

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
      this.state.capsLock = !this.state.capsLock
    }
  }
}

SVGDraw.prototype.keyHandler = function (event) {
  const keyCode = event.code
  const inFocus = document.activeElement

  switch (keyCode) {
    case KeyboardCode.SHIFT_LEFT:
    case KeyboardCode.SHIFT_RIGHT:
      this.state.currentKey = 'Shift'
      return
    case KeyboardCode.CAPS_LOCK:
      this.state.capsLock = !this.state.capsLock
      return
    case KeyboardCode.META_LEFT:
    case KeyboardCode.META_RIGHT:
      this.state.currentKey = 'Meta'
      return
    case KeyboardCode.B: // looking for control-B to move mousentered group to "bottom"
      if (event.ctrlKey) {
        // which is first in the SVG list
        if (this.state.currentGroup) {
          let cloneGroup = this.state.currentGroup.cloneNode(true)
          this.state.currentGroup.remove()
          this.clearEditElement(cloneGroup)
          this.state.svgLayer.firstChild.insertBefore(
            cloneGroup,
            this.state.svgLayer.firstChild.childNodes[1]
          )
        }
      }
      break
    case KeyboardCode.T: // looking for control-T to move mousentered group to "top"
      if (event.ctrlKey) {
        // which is last in the SVG element list
        if (this.state.currentGroup) {
          let cloneGroup = this.state.currentGroup.cloneNode(true)
          this.state.currentGroup.remove()
          this.clearEditElement(cloneGroup)
          this.state.svgLayer.firstChild.appendChild(cloneGroup)
        }
      }
      break
  }
  if (this.state.cursorMode == drawMode.TEXT) {
    event.preventDefault()
    this.updateSvgText(event) // pass event or key
    return
  }

  if (keyCode == KeyboardCode.ENTER) {
    // added literal decimal value for chrome/safari
    switch (this.state.cursorMode) {
      case drawMode.POLYGON:
      case drawMode.POLYLINE:
        this.dblClick()
        return
      case drawMode.LINE:
      case drawMode.RECTANGLE:
      case drawMode.CIRCLE:
      case drawMode.ELLIPSE:
      case drawMode.CUBIC:
      case drawMode.QUADRATIC:
      case drawMode.DRAW:
        this.doMouseUp()
        return
    }
  }

  if (keyCode == KeyboardCode.DELETE || keyCode == KeyboardCode.BACKSPACE) {
    if (event.shiftKey) {
      if (this.state.currentGroup) {
        let cloneGroup = this.state.currentGroup.cloneNode(true)
        this.state.currentGroup.remove()
        this.clearEditElement(cloneGroup)
        this.state.svgLayer.firstChild.appendChild(cloneGroup)
        this.clearLastGroup()
      }
      return
    }

    if (
      inFocus.tagName == 'BODY' ||
      inFocus.id == this.state.svgLayer.parentElement.id
    ) {
      return
    }
  }
  if (KeyboardCode.ESC) {
    switch (this.state.cursorMode) {
      case (drawMode.POLYGON, drawMode.POLYLINE):
        if (this.state.svgInProgress == this.state.cursorMode) {
          // remove last point and reset previous point to dynamic
          deleteLastPoint(this.state.currentElement)
          return
        }
    }
    return
  }
}

function lookUpKey(event, { capsLock }) {
  // sort out the keyboard mess and return the key
  let eventKey = event.key
  let thisKeyCode = event.keyCode
  let Shifted = event.shiftKey

  if (thisKeyCode == 0x14) {
    //var CapsLock = isCapsLockOn(event);
    capsLock = !capsLock // on keyDown and capsLock keyCode (= 20d or 0x14)
    return false
  }
  let mapKey = _KEYCODE_MAP[thisKeyCode] // from CapsLock.js, non-alphanumeric keys
  if (mapKey) {
    // existence mostly implies we caught one
    if (Shifted && _SHIFTMAP[mapKey]) {
      // if there is a shifted version of this key
      return _SHIFTMAP[mapKey] // and the shift key is down (not CapsLock)
    }
    return mapKey // if not shift, return nominal key
  }
  if (thisKeyCode > 0x2f && thisKeyCode < 0x3a) {
    // numeric key
    eventKey = String.fromCharCode(thisKeyCode) // need mapping to us keyboard at minimum
    if (Shifted) {
      return _SHIFTMAP[eventKey]
    }
    return eventKey
  }
  if ((thisKeyCode > 0x3f && thisKeyCode < 0x5b) || thisKeyCode == 0x20) {
    // Alphabetic key (codes are upper case)
    eventKey = String.fromCharCode(thisKeyCode) // need mapping to us keyboard at minimum
    if (capsLock) {
      if (isMac) {
        // for Apple, shiftKey does not affect CapsLock
        return eventKey.toUpperCase() // so force CAPS on any Alpha
      } else {
        if (Shifted) {
          return eventKey.toLowerCase() // shift and CapsLock implies lower case for Oranges
        } else {
          return eventKey.toUpperCase() // do not invert sense of CapsLock
        }
      }
    } else {
      // not caps lock
      if (Shifted) {
        return eventKey
      }
      return eventKey.toLowerCase()
    }
  }
  return false // signal not printable
}

SVGDraw.prototype.doMouseUp = function () {
  this.state.svgInProgress = false
  this.setElementMouseEnterLeave(this.state.currentGroup)
  //this.setCursorMode(drawMode.MOVE);

  this.state.currentBubble = null
  this.state.currentElement = null
  this.state.currentGroup = null
}

SVGDraw.prototype.doubleClickHandler = function () {
  this.dblClick()
}

SVGDraw.prototype.dblClick = function () {
  if (
    this.state.cursorMode == drawMode.POLYGON ||
    this.state.cursorMode == drawMode.POLYLINE ||
    this.state.cursorMode == drawMode.TEXT
  ) {
    this.state.svgInProgress = false
    switch (this.state.cursorMode) {
      case drawMode.POLYGON:
        deleteDuplicatePoints(this.state.currentElement)
        this.state.currentGroup.innerHTML = this.state.currentGroup.innerHTML
          .replace(drawMode.POLYLINE, drawMode.POLYGON)
          .replace(drawMode.POLYLINE, drawMode.POLYGON)
        this.setElementMouseEnterLeave(this.state.currentGroup)
        break
      case drawMode.POLYLINE:
        deleteDuplicatePoints(this.state.currentElement)
        this.setElementMouseEnterLeave(this.state.currentGroup)
        break
    }
    if (this.state.cursorMode == drawMode.TEXT) {
      this.closeSvgText()
    }
    this.state.currentElement = null
    this.state.currentGroup = null
  }
}

SVGDraw.prototype.mouseWheelScrollHandler = function () {
  return function (event) {
    event.stopImmediatePropagation()
    event.stopPropagation()
    const deltaDiv =
      event.type == 'DOMMouseScroll' // default for non-FireFox
        ? 100
        : 1000

    const delta = -parseInt(event.deltaY || -event.detail)
    const zoomDelta = delta / deltaDiv
    const mousePosition = this._getMousePosition(event)

    this.state.mousePosition.x = mousePosition.x // fixed reference for mouse offset
    this.state.mousePosition.y = mousePosition.y

    if (zoomDelta > 0) {
      this.zoomIn()
    } else {
      this.zoomOut()
    }
    return event.preventDefault() && false
  }
}

function deleteDuplicatePoints(element) {
  let thesePoints = element.attributes['points'].value.trim()
  let splitPoints = thesePoints.split(' ')
  thesePoints = splitPoints[0] + ' '
  for (let k = 1; k < splitPoints.length; k++) {
    // if (splitPoints[k] != splitPoints[k - 1]) {   // only keep this point
    //   thesePoints += splitPoints[k] + ' ';        // if it is "new"
    // }
    if (checkDuplicatePoints(splitPoints[k - 1], splitPoints[k])) {
      // only keep this point
      thesePoints += splitPoints[k] + ' ' // if it is "new"
    }
  }
  element.attributes['points'].value = thesePoints
}

function deleteLastPoint(element) {
  // specific to <poly-> ESC key
  let thesePoints = element.attributes['points'].value.trim()
  let splitPoints = thesePoints.split(' ')
  thesePoints = splitPoints[0] + ' '
  for (let k = 1; k < splitPoints.length - 1; k++) {
    if (splitPoints[k] != splitPoints[k - 1]) {
      // only keep this point
      thesePoints += splitPoints[k] + ' ' // if it is "new"
    }
  }
  this.state.currentElement.attributes['points'].value = thesePoints
}

function checkDuplicatePoints(pxy, qxy) {
  // return false if too close together
  let p = pxy.split(',')
  let q = qxy.split(',')
  const [px, py] = p
  const [qx, qy] = q

  if (Math.abs(px - qx) < 0.000001 * qx && Math.abs(py - qy) < 0.000001 * qy) {
    return false
  }
  return true
}

SVGDraw.prototype.apiSetMode = function (mode) {
  this.updateCursorMode(mode)
}

SVGDraw.prototype.checkLeftoverElement = function () {
  // this function is only called when svgInProgress is false (?)
  switch (this.state.cursorMode) {
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
      break
    //                    var thesePoints = thisElement.attributes['points'].value;
    //                    var splitPoints = thesePoints.split(' ');
    //                    thesePoints = '';
    //                    for (k = 0; k < splitPoints.length - 2; k++) {
    //                        thesePoints += splitPoints[k] + ' ';
    //                    }
    //                    thisElement.attributes['points'].value = thesePoints;
    //                    break;
    case drawMode.CIRCLE:
      if (this.state.currentElement == null) return
      if (
        this.state.currentElement.attributes['cy'].value -
          this.state.currentElement.attributes['r'].value <
          0 || // off svgLayer
        this.state.currentElement.attributes['r'].value < 2
      ) {
        // single click
        this.clearLastGroup()
      }
      break
    case drawMode.ELLIPSE:
      if (this.state.currentElement == null) return
      if (
        this.state.currentElement.attributes['cy'].value -
          this.state.currentElement.attributes['ry'].value <
        0
      ) {
        this.clearLastGroup()
      }
      break
    case drawMode.RECTANGLE:
      if (this.state.currentElement == null) return
      if (this.state.currentElement.attributes['height'].value < 0) {
        this.clearLastGroup()
      }
      break
    case drawMode.LINE:
      if (this.state.currentElement.attributes['y2'].value < 0) {
        this.clearLastGroup()
      }
      break
    case drawMode.TEXT:
      this.finishTextGroup()
      break
  }
}

SVGDraw.prototype.clearLastGroup = function () {
  if (this.xlt.childElementCount > 1) {
    // don't remove the base image
    const group = this.xlt.lastChild

    group.removeEventListener('mouseenter', this.handleMouseEnterFunction) // disable mousenter on real element's containing group
    group.removeEventListener('mouseleave', this.handleMouseLeaveFunction) // disable mouseleaver on real element's containing group
    group.remove()

    this.state.waitElement = false
  }
}

SVGDraw.prototype.clearThisGroup = function (group) {
  if (group) {
    this.clearEditElement(group)
    group.removeEventListener('mouseenter', this.handleMouseEnterFunction) // disable mouseenter on real element's containing group
    group.removeEventListener('mouseleave', this.handleMouseLeaveFunction) // disable mouseleaver on real element's containing group
    group.remove()
  }
}

SVGDraw.prototype.updateSvgText = function (event) {
  let thisKeyCode = event.keyCode
  //if (thisKey == undefined) {                   // undefined if not FireFox
  this.state.currentKey = lookUpKey(event, { capsLock: this.state.capsLock }) // consolidate

  if (this.state.currentElement == null) {
    // this can occur if <text> element just completed and no new one started
    if (thisKeyCode == 8) {
      // prevent Backspace from invoking BACK browser function
      event.preventDefault()
    }
    return false
  }
  if (event.keyCode == 13 && event.shiftKey) {
    // terminate this text block chain on Shift-Enter
    this.finishTextGroup()
    return false
  }
  let text4svgValue // text4svg is string
  text4svgValue = this.state.text.slice(0, this.state.text.length - 1) // remove text cursor (underscore)

  if (thisKeyCode > 31) {
    // space or other printing character
    this.state.text = text4svgValue + this.state.currentKey + '_'
  }
  if (thisKeyCode == 8) {
    this.state.text = text4svgValue.slice(0, text4svgValue.length - 1) + '_'
    event.preventDefault() // prevent Backspace from invoking BACK browser function
  }
  if (!this.state.currentKey && thisKeyCode != 13 && thisKeyCode != 8) {
    return
  } // only pass printing keys, Delete, and Return/Enter
  this.state.currentElement.innerHTML = parseHTML(this.state.text) // this needs to be pair-parsed into ' '&nbsp;
  this.state.currentElement.attributes['stroke'].value =
    this.configuration.stroke // allow in-line whole line color/font/size over-ride
  this.state.currentElement.attributes['style'].value =
    'font-family: ' +
    this.configuration.fontFamily +
    '; fill: ' +
    this.configuration.stroke +
    ';' //  including fill
  this.state.currentElement.attributes['font-size'].value =
    this.configuration.fontSize
  let nextX = this.state.currentElement.attributes['x'].value
  let nextY =
    parseInt(this.state.currentElement.attributes['y'].value) +
    parseInt(this.configuration.fontSize)
  let nextLine = this.state.currentElement.cloneNode()
  if (event.keyCode == 13) {
    // line feed on ENTER/CR -- termination on shift-Enter/Return already picked off
    this.state.currentElement.innerHTML = parseHTML(
      text4svgValue.slice(0, text4svgValue.length)
    ) // remove cursor at end of line
    nextLine.attributes['x'].value = nextX
    nextLine.attributes['y'].value = nextY
    this.state.currentElement.parentElement.appendChild(nextLine)
    this.state.currentElement = nextLine
    this.state.currentElement.innerHTML = '_'
    this.state.text = '_'
    event.preventDefault()
  }
}

function parseHTML(spaceText) {
  // morphs multiple spaces in string to HTML equivalent
  let result = spaceText.replace(/ {2}/g, ' &nbsp;') // two consecutive spaces become space+nonbreakingspace
  result = result.replace(/</g, '&lt;').replace(/>/g, '&gt')
  return result
}

SVGDraw.prototype.finishTextGroup = function () {
  // uses global variable thisGroup for <text>.parent
  // line/group is complete except for text cursor
  this.removeCursorFromSvgText() // if thisElement is empty, it will disappear through this call
  if (!this.state.currentGroup) {
    return
  }
  if (this.state.currentGroup.hasChildNodes()) {
    // thisGroup may contain more that one text element, one for each line
    this.setElementMouseEnterLeave(this.state.currentGroup) // if this group is to be persisted, set the mouse listeners for future edit
  } else {
    // if no child nodes, it is empty and should be
    this.state.currentGroup.remove() // removed
  }
  this.closeSvgText()
  // checkLeftoverElement();         // //////////// does not consider <text> === useless
  this.state.currentGroup = null
}

SVGDraw.prototype.removeCursorFromSvgText = function () {
  //   ///////////  does this do enough?
  if (!this.state.currentElement) {
    return
  } // in case called again after end condition
  if (this.state.currentElement.parentElement) {
    // check valid element
    if (this.state.currentElement.parentElement.lastChild.innerHTML == '_') {
      // if ONLY underscore cursor
      this.state.currentElement.parentElement.lastChild.remove() // remove the <text> element
      this.state.text = '_' // initialize for later
      this.state.currentElement = null // kill the element
    } else {
      if (this.state.svgInProgress == 'text') {
        //   ///////////////  newly added stronger condition
        this.state.currentElement.innerHTML = parseHTML(
          this.state.text.slice(0, this.state.text.length - 1)
        ) // remove cursor at end of line
        if (this.state.currentElement.innerHTML == '') {
          this.state.currentElement.remove()
          this.state.currentElement = null
        }
        if (this.state.currentGroup.lastChild.tagName == SVGType.GROUP) {
          // this is to detect a leftover bubble
          this.state.currentGroup.lastChild.remove
        }
      }
    }
  }
}

SVGDraw.prototype.closeSvgText = function () {
  this.state.text = '_'
  this.state.currentSVGPoints = [] // clear the container
  this.state.currentElement = null
  this.state.svgInProgress = false
}

function collectSVG(isVerbatim, { svgLayer, currentLayer }) {
  // verbatim true includes all markup, false means stripped
  let clonedSVG = svgLayer.cloneNode(true)
  let xlt = clonedSVG.firstChild

  if (!isVerbatim) {
    clonedSVG.removeAttribute('height')
    clonedSVG.removeAttribute('width')
    clonedSVG.firstChild.attributes['transform'].value =
      'translate(0, 0) scale(1)'
    xlt.children['xltImage'].remove()
  }

  if (currentLayer) {
    const groupLayers = [...xlt.querySelectorAll('[layer-id]')]

    groupLayers.forEach((el) => el.remove())
  }

  const elements = [...xlt.childNodes]

  elements.forEach((currentGroup) => {
    if (!isVerbatim) {
      if (currentGroup.attributes.class) {
        currentGroup.removeAttribute('id')
        currentGroup.removeAttribute('layer-id')
      }
    }
  })

  return clonedSVG
}

function getBareSVG(noGroups, { svgLayer }) {
  const clonedSVG = svgLayer.cloneNode(true)
  const xlt = clonedSVG.firstChild

  clonedSVG.removeAttribute('height')
  clonedSVG.removeAttribute('width')
  clonedSVG.removeAttribute('id')

  xlt.removeAttribute('id')
  xlt.removeAttribute('transform')
  xlt.children['xltImage'].remove()

  const elements = [...xlt.childNodes]
  const groups = [
    drawMode.ARROW,
    drawMode.CUBIC,
    drawMode.QUADRATIC,
    drawMode.TEXT
  ]

  elements.forEach((currentGroup) => {
    if (currentGroup.attributes.class) {
      stripElement(currentGroup)
      if (noGroups && !groups.includes(currentGroup.attributes.class.value)) {
        currentGroup.outerHTML = currentGroup.innerHTML
      }
    }
  })

  return clonedSVG
}

function stripElement(element) {
  if (element.hasChildNodes()) {
    for (let i = 0; i < element.childElementCount; i++) {
      stripElement(element.childNodes[i])
    }
  }

  element.removeAttribute('id')
  element.removeAttribute('stroke')
  element.removeAttribute('stroke-width')
  element.removeAttribute('stroke-opacity')
  element.removeAttribute('stroke-linecap')
  element.removeAttribute('fill')
  element.removeAttribute('fill-opacity')
  element.removeAttribute('font-family')
  element.removeAttribute('font-size')
  element.removeAttribute('style')

  return element
}

function console_log(logFlag, message) {
  if (logFlag) {
    console.log(message)
    return true
  }
  return false
}

export { drawMode, SVGDraw }
