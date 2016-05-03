# svg-detailer
A native javascript library for annotating images, with results exportable as SVG elements.

 General description:

   This library provides a basic ability to annotate a base image with SVG elements, using an editing paradigm
   similar to that of Google Maps Drawing Manager.  The working area and background image for a browser window
   are specified through data- elements of a containing &lt;div&gt;.  Invocation of the library causes DOM elements to
   be created in two parts: the &lt;svg&gt; itself within the container &lt;div&gt;, and the menu &lt;div&gt; populated by default
   elements as well as data- elements specifying what shape types are to be available.  The image is initially
   presented at its minimal full extent within the containing &lt;div&gt;, scaled according to aspect ratio and pixel
   extent to fit the working area description.  Dynamic zooming through mouse gestures is continuously available
   when the mouse is within the working area.  When the drawing mode is effectively idle in "MOVE", dragging any
   point repositions the base image within the working area.

   Currently, the SVG element types supported are: text, polyline, polygon, line, rectangle, circle, and ellipse, as
   well as pseudo-functions "arrow", quadratic and cubic Bezier curves, and "draw" freehand sketch.  "Draw" is actually
   realized as a polyline, rather than the SVG element &lt;path&gt;.  Additionally, the quadratic and cubic curves are
   realized as degenerate cases of &lt;path&gt;.  For purposes of element organization and editing convenience, group, &lt;g&gt;,
   elements are used to contain graphic elements

   Present limitations exist for element details, where only the "stroke" color attribute is controllable.  Other
   styling attributes such as "fill", "stroke-opacity", "fill-opacity", and "stroke-width" are fixed at this time.
   When a suitable editing framework is developed, these attributes will be changeable within the library's context.

   Element editing is currently continuously active, effected through mouse events.

 User interface description:

   SVG elements are created by selecting an element type from the button menu and clicking on the working image area.
   Some variation in mouse down vs click and double-click exists on an element-type basis:
      * A &lt;line&gt; is created by clicking the first point, and dragging to the end point, terminating on mouse up.  This
        paradigm is shared by &lt;rect&gt;angle, &lt;circle&gt;, &lt;ellipse&gt;, "draw", and "arrow".
      * &lt;polyline&gt; and &lt;polygon&gt; use a "tethered" paradigm where each mouse click registers a new point,
        terminated by double-click or "Enter"/"Return".
      * &lt;text&gt; elements are created by clicking to specify the baseline point and then typing on the keyboard.  Either
        the native key input handler can be used, or the Mousetrap library can be used, although the latter has not had
        any testing since the dependency was removed.  Text input is terminated by shift-Enter.

   Editing is enabled through mouseover events on the &lt;g&gt; groups containing elements. Similarly to map drawing element
   editing, "bubbles" appear at control points appropriate to the given element. On mouse down on these bubbles,
   dragging the point relocates it for the element.  Due to the definition of rectangle, circle, ellipse, and text,
   moving their base-point effectively relocates the element.  The other line-  or poly- based elements have only
   individually controllable points currently, although functions to move the element as a whole are in the works.
   Polyline, polygon, and "draw" elements have "insertion" points depicted at the midpoint of each segment to allow
   refinement of the shape.  Each such insertion offers new insertion points, none of which persist unless used.

   Hot keys:

   As mentioned earlier, the "Return" or "Enter" key functions as a double-click (except fot text, where it is CR/LF,
   and shift-Enter is used for element completion).  "Escape" is used to undo the current point being created.
   Polylines and polygons benefit most from this feature, in that the entire element can be backtracked to nothing. The
   intention is to extend this to points being edited as well.  Shift-Delete is used to remove the highlighted element
   completely.  Control-B and control-T are used to change the layer position of the highlighted element to the
   "bottom" or "top" of the element stack, respectively.  These functions are useful since "later" elements can
   eclipse previous elements, making them inaccessible to editing.
