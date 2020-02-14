import SVGDraw from './svg-detailer.js'

const svgContainer = document.getElementById('container');
const imageInput = document.getElementById('image_file');
var svg;

imageInput.addEventListener('change', (event) => {
  getImage(event);
});

function getImage(event) {
  let files = event.target.files;
  let svg_element = svgContainer.children[0];
  if(svg_element) {svg_element.parentNode.removeChild(svg_element)}  // remove any previously created svg element
  let svg_menu = document.getElementById("svgMenu");
  if(svg_menu) {svg_menu.parentNode.removeChild(svg_menu)}      // force removal of any created peer menu element
  if (FileReader && files && files.length) {
    var fileReader = new FileReader();
    fileReader.onload = (image) => {
      svgContainer.attributes["data-image"].value = fileReader.result;
      svg = new SVGDraw(svgContainer)
    };
    fileReader.readAsDataURL(files[0])
  }
}
