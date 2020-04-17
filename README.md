# svg-detailer
A dependency free javascript library for annotating images, with results exportable as SVG elements.

## Overview 

Svg-detailer provides the basic functionality to annotate a base image with SVG elements, using an editing paradigm
similar to that of Google Maps Drawing Manager. The general goal is to enable the user to define shapes, and export the 
individual elements as SVG elements that will be peristed/handled by external code.  The working area and background
image for a browser window are specified through data- elements of a containing &lt;div&gt;.  Invocation of the library
causes DOM elements to be created in two parts: the &lt;svg&gt; itself within the container &lt;div&gt;, and the menu
&lt;div&gt; populated by default elements as well as data- elements specifying what shape types are to be available.
The image is initially presented at its minimal full extent within the containing &lt;div&gt;, scaled according to
aspect ratio and pixel extent to fit the working area description.  Dynamic zooming through mouse gestures is
continuously available when the mouse is within the working area.  When the drawing mode is effectively idle in "MOVE",
dragging any point repositions the base image within the working area.

Currently, the SVG element types supported are: text, polyline, polygon, line, rectangle, circle, and ellipse, as
well as pseudo-functions "arrow", quadratic and cubic Bezier curves, and "draw" freehand sketch.  "Draw" is actually
realized as a polyline, rather than the SVG element &lt;path&gt;.  Additionally, the quadratic and cubic curves are
realized as degenerate cases of &lt;path&gt;.  For purposes of element organization and editing convenience, 
group, &lt;g&gt;, elements are used to contain graphic elements.

Present limitations exist for element details, where only the "stroke" color attribute is controllable.  Other
styling attributes (such as "fill", "fill-opacity", "stroke-opacity", and "stroke-width") are fixed at this time in the 
data-buttons internally generated menu.  These functions are supported in API entry points, however, especially for 
externally managed editing mode interfaces.

Element editing is currently continuously active, effected through mouse events.

## User interface 

SVG elements are created by selecting an element type from the button menu and clicking on the working image area.
Some variation in mouse down vs click and double-click exists on an element-type basis, as follows:
   * A &lt;line&gt; is created by clicking the first point, and dragging to the end point, terminating on mouse up.  
   This paradigm is shared by &lt;rect&gt;angle, &lt;circle&gt;, &lt;ellipse&gt;, "draw", and "arrow".
   * &lt;polyline&gt; and &lt;polygon&gt; use a "tethered" paradigm where each mouse click registers a new point, 
   terminated by double-click or "Enter"/"Return".
   * &lt;text&gt; elements are created by clicking to specify the baseline point and then typing on the keyboard.  
   Either the native key input handler can be used, or the Mousetrap library can be used, although the latter has 
   not had any testing since the dependency was removed.  Text input is terminated by shift-Enter.

Editing is enabled through mouseover events on the &lt;g&gt; groups containing elements.  These groups have an ID and 
class of the form &lt;g id="g1" class="polyline"&gt; for convenience in analysis and debugging. Similarly to Google map editing 
of drawing elements, "bubbles" appear at control points appropriate to the given element. On mouse-down on these bubbles,
dragging the point relocates it for the element.  Due to the definition of rectangle, circle, ellipse, and text,
moving their base-point effectively relocates the element.  Recently, a centroidal element-shift-point bubble, slightly 
larger and dark teal-colored (as with rectangle, circle, ellipse and text), has been introduced to relocate all points 
of an SVG graphic element.  Polyline, polygon, and "draw" elements have "insertion" points depicted at the midpoint of 
each segment to allow refinement of the shape.  Each such insertion offers new insertion points, none of which persist 
unless used.

### Hot keys:

* Return/Enter - Double click, except fot text, where it is CR/LF, and shift-Enter is used for element completion)
* Escape - Undo the current point being created. Polylines and polygons benefit most from this feature, in that the 
entire element can be backtracked to nothing. The intention is to extend this to points being edited as well.
* Shift-Delete - Remove the highlighted element completely
* Control-B - Move the highlighted element to the "bottom" of the stack (aids editing overlapping elements)
* Control-T - Move the highlighted element to the "top" of the stack

## Demo

[Here.](https://speciesfilegroup.org/svg-detailer)  With the implementation of the npm package version of svg-detailer, 
                                                  use of the program without using npm (and having no dependencies) only requires removing the final statement in the file 
                                                  svg-detailer.js.  That is "export default SVGDraw".
## Tests
The test environment uses several npm modules.  To set up the configuration the following commands are used:
  * npm install
  * npm install -g selenium-webdriver
  * npm install -g geckodriver
  * npm install -g mocha
  * npm install -g chai
  * npm run serve
  
To run the demo application, use //localhost:8080 as the URL.  In some cases, port 8080 might have been preempted by 
some other process, so the server will report a different (nearby) port after "npm run serve".
  
To execute the tests, there are batch/suite and individual mode commands:

&nbsp; &nbsp; To run all tests, from the svg-detailer directory execute:

&nbsp; &nbsp; &nbsp; &nbsp;  mocha --no-timeouts

&nbsp; &nbsp; To run individual tests, from the svg-detailer directory execute:

&nbsp; &nbsp; &nbsp; &nbsp;  mocha --no-timeouts ./test/&lt;testname&gt;

&nbsp; &nbsp; OR,  from the svg-detailer/test directory execute:

&nbsp; &nbsp; &nbsp; &nbsp;  mocha --no-timeouts &lt;testname&gt;

  
  
## Funding 

This project was funded in part by NSF-ABI-1356381.  Any opinions, findings and conclusions or recommendations expressed 
in this material are those of the author(s) and do not necessarily reflect the views of the National Science Foundation. 
