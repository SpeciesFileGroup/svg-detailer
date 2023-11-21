import { SVGDraw } from './svg-detailer.js'

const svgContainer = document.getElementById('container')
const imageInput = document.getElementById('image_file')
let svgDraw = new SVGDraw(document.getElementById('container'), {
  imageSrc: 'https://placekitten.com/1920/1080'
  //svg: '<svg id="svgLayer" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" style="position: inherit;" width="600" height="600"><g id="xlt" transform="translate(0, 0) scale(0.5859375)"><image id="xltImage" x="0" y="0" width="1024" height="768" preserveAspectRatio="none" xlink:href="http://placekitten.com/1024/768"></image><g class="rect" id="g2"><rect stroke="#000000" stroke-width="1" stroke-opacity="0.9" fill="" fill-opacity="0" stroke-linecap="round" x="245.7000" y="134.8317" width="196.56" height="176.54"></rect></g></g></svg>'
})

imageInput.addEventListener('change', (event) => {
  getImage(event)
})

function getImage(event) {
  let files = event.target.files
  let svg_element = svgContainer.children[0]
  if (svg_element) {
    svg_element.parentNode.removeChild(svg_element)
  } // remove any previously created svg element
  let svg_menu = document.getElementById('svgMenu')
  if (svg_menu) {
    svg_menu.parentNode.removeChild(svg_menu)
  } // force removal of any created peer menu element
  if (FileReader && files && files.length) {
    var fileReader = new FileReader()
    fileReader.onload = (image) => {
      svgContainer.attributes['data-image'].value = fileReader.result
      svgDraw = new SVGDraw(svgContainer)
    }
    fileReader.readAsDataURL(files[0])
  }
}

svgDraw.on('changemode', (event) => console.log(event))
/* svgDraw.apiLoadSVG(
  '<g><g class="rect"><rect stroke="#000000" stroke-width="1" stroke-opacity="0.9" fill="" fill-opacity="0" stroke-linecap="round" x="245.7000" y="134.8317" width="196.56" height="176.54"></rect></g></g>'
) */
svgDraw.apiLoadSVG(
  '<svg id="svgLayer" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" style="position: inherit;" width="600" height="600"><g id="xlt" transform="translate(0, 0) scale(0.5859375)"><image id="xltImage" x="0" y="0" width="1024" height="768" preserveAspectRatio="none" xlink:href="http://placekitten.com/1024/768"></image><g class="rect" id="g2"><rect stroke="#000000" stroke-width="1" stroke-opacity="0.9" fill="" fill-opacity="0" stroke-linecap="round" x="245.7000" y="134.8317" width="196.56" height="176.54"></rect></g></g></svg>',
  { editable: false, shapeClass: 'test', fill: 'rgba(255,50,150,0.3)' }
)

svgDraw.apiLoadSVG(
  '<svg id="svgLayer" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" style="position: inherit;" width="600" height="600"><g id="xlt" transform="translate(0, 0) scale(0.5859375)"><image id="xltImage" x="0" y="0" width="1024" height="768" preserveAspectRatio="none" xlink:href="http://placekitten.com/1024/768"></image><g class="rect" id="g2"><rect stroke="#000000" stroke-width="1" stroke-opacity="0.9" fill="" fill-opacity="0" stroke-linecap="round" x="245.7000" y="134.8317" width="196.56" height="176.54"></rect></g></g></svg>',
  { editable: true, fill: 'rgba(55,150,80, 0.3)', clearPrevious: false }
)
