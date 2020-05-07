# svg-detailer
A dependency free javascript library for annotating images, with results exportable as SVG elements.

## Overview 

Svg-detailer provides the basic functionality to annotate a base image with SVG elements. The general goal is to enable the user to define shapes, and export the 
individual elements as SVG elements that will be peristed/handled by external code. 

## Demo
### Locally
```bash
git clone git@github.com:SpeciesFileGroup/svg-detailer.git
cd svg-detailer

npm install
npm run serve
```

Navigate to `localhost:8080` see the demo. Check npm log to see if alternate port is being used.

### Online 
[Here.](https://speciesfilegroup.org/svg-detailer) With the implementation of the npm package version of svg-detailer, use of the program without using npm (and having no dependencies) only requires removing the final statement in the file svg-detailer.js. That is: "export default SVGDraw".

### Supported elements and "shapes"

* "arrow"
* "draw" (freehand sketch) - realized as a `<polyline>`, not a ``<path>`` 
* circle
* ellipse
* line
* polygon
* polyline
* quadratic and cubic Bezier curves - realized as a ``<path>``
* rectangle
* text

## Details
The working area and background image for a browser window are specified through data- elements of a containing `<div>`.

Invocation of the library causes DOM elements to be created in two parts: the `<svg>` itself within the container `<div>`, and the menu `<div>` populated by `data-` elements specifying what shape types and actions are to be available (see .../public/index.html for the full list of auto-generatable menu items). The image is initially presented at its minimal full extent within the containing `<div>`, scaled according to aspect ratio and pixel extent to fit the working area description. Dynamic zooming through mouse gestures is continuously available when the mouse is within the working area. When the drawing mode is effectively idle in "MOVE", dragging any point repositions the base image within the working area.

Present limitations exist for element attribute details, where only the "stroke" color attribute is controllable. Other styling attributes (such as "fill", "fill-opacity", "stroke-opacity", and "stroke-width") are fixed at this time in the data-buttons internally generated menu. These functions are supported in API entry points, however, especially for externally managed editing mode interfaces. Element editing is currently continuously active, effected through mouse events. The elements are enclosed by a group `<g>` element, whose content expands to include editing controls when the mouse hovers over a group.

These groups have an ID and class of the form `<g id="g1" class="polyline">` for convenience in styling, analysis and debugging.

### Editing
Editing is enabled through mouseover events on the `<g>` groups containing elements. "Bubbles" appear at control points appropriate to the given element. On mouse-down on these bubbles, dragging the point relocates it for the element. Due to the definition of rectangle, circle, ellipse, and text, moving their base-point effectively relocates the element. A centroidal element-shift-point bubble, slightly larger and dark teal-colored (as with rectangle, circle, ellipse and text) is used to relocate all points of an SVG graphic element. Polyline, polygon, and "draw" elements have "insertion" points depicted at the midpoint of each segment to allow refinement of the shape. Each such insertion offers new insertion points, none of which persist unless used. The quadratic and cubic pseudo-elements present control point bubbles in addition to the endpoint and shift bubbles - these shapes appear as straight lines until a control point is relocated.

Some variation in mouse down vs click and double-click exists on an element-type basis, as follows:
* A `<line>` is created by clicking the first point, and dragging to the end point, terminating on mouse up.
This paradigm is shared by `<rect>`angle, `<circle>`, `<ellipse>`, "draw", and "arrow".
* `<polyline>` and `<polygon>` use a "tethered" paradigm where each mouse click registers a new point, 
terminated by double-click or "Enter"/"Return".
* `<text>` elements are created by clicking to specify the baseline point and then typing on the keyboard. Either the native key input handler can be used, or the Mousetrap library can be used, although the latter has not had any testing since the dependency was removed. Text input is terminated by shift-Enter.

## User interface 

The core library does not include a UI beyond the canvas, but rather controlling events.
The [demo](https://speciesfilegroup.org/svg-detailer) illustrates a possible interface for buttons in which SVG elements are created by selecting an element type from the button menu and clicking on the working image area.

### Hot keys:

* `Return/Enter` - Double click, except for text, where it is CR/LF, and shift-Enter is used for element completion)
* `Escape` - Undo the current point being created. Polylines and polygons benefit most from this feature, in that the entire element can be backtracked to nothing. The intention is to extend this to points being edited as well.
* `Shift-Delete` - Remove the highlighted element completely
* `Control-B` - Move the highlighted element to the "bottom" of the stack (aids editing overlapping elements)
* `Control-T` - Move the highlighted element to the "top" of the stack

## Examples
### Internal representation
This is a closed-head arrow and ellipse:
```
<svg id="svgLayer" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" style="position: inherit;" width="600" height="600">
 <g id="xlt" transform="translate(0, 0) scale(1)">
  <g id="g1" class="arrow">
   <line stroke="#FF0000" stroke-width="1" stroke-opacity="0.9" fill="" fill-opacity="0.0" stroke-linecap="round" 
    x1="787.57" y1="886.12" x2="288.854" y2="822.89">
   </line>
   <polygon stroke="#FF0000" stroke-width="1" stroke-opacity="0.9" fill="" fill-opacity="0.0" stroke-linecap="round" 
    points="288.85,822.89 335.56,854.15 341.89,804.28">
   </polygon>
  </g>
  <g id="g2" class="ellipse">
   <ellipse stroke="#FF0000" stroke-width="1" stroke-opacity="0.9" fill="" fill-opacity="0.0" stroke-linecap="round" 
    cx="581.97" cy="745.81" rx="180.99" ry="132.72">
   </ellipse>
  </g>
 </g>
</svg>
```

### Exported SVG
There are several export/extraction methods available (as supported by auto-generable menu buttons):

* Verbatim - complete content of constructed graphic elements (see Examples above), with or without the base image (which can dominate the content).
* "Plain" - groups with classes for CSS styling, without "id" attribute.
* "Bare" - only groups for non-primitive SVG elements are present. Elements are stripped of all inline `stroke-` and `fill-` attributes. 
It is assumed that the user will render these back, or provide a stylesheet as necessary.

Variants of these methods are controlled by API arguments, e.g., noGroups = false, verbatim = true, etc.

#### Standard SVG elements
Are simply the element themselve, with no other attributees, e.g.
```
 TODO - example for rectangle
```

#### Custom elements
Are minimally wrapped in an outer `<g>`, e.g. with the class of that custom element

```
 TODO - example arrow
```

## Tests
Install framework 

```bash
npm install -g selenium-webdriver
npm install -g geckodriver
npm install -g mocha
npm install -g chai
```

Run all tests: 

Make sure the server is running (`npm run serve`), then:
`mocha --no-timeouts`

Run individual tests:
`mocha --no-timeouts ./test/<testname>`

## Funding 
This project was funded in part by NSF-ABI-1356381.Any opinions, findings and conclusions or recommendations expressed 
in this material are those of the author(s) and do not necessarily reflect the views of the National Science Foundation. 
