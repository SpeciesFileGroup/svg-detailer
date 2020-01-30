import SVGDraw from './svg-detailer.js'

const svgContainer = document.getElementById('container')
const imageInput = document.getElementById('image_file')
const fakeInput = document.getElementById('auto_file')
var svg;

imageInput.addEventListener('change', (event) => {
  getImage(event);
});
fakeInput.addEventListener('click', (event) => {
  fakeImage(event);
});

function getImage(event) {
  let files = event.target.files;
  let svg_element = svgContainer.children[0]
  if(svg_element) {svg_element.parentNode.removeChild(svg_element)}  // remove any previously created svg element
  let svg_menu = document.getElementById("svgMenu")
  if(svg_menu) {svg_menu.parentNode.removeChild(svg_menu)}      // force removal of any created peer menu element
  if (FileReader && files && files.length) {
    var fileReader = new FileReader();
    fileReader.onload = (image) => {
      svgContainer.attributes["data-image"].value = fileReader.result
      svg = new SVGDraw(svgContainer)
    }
    fileReader.readAsDataURL(files[0])
  }
}
function fakeImage(event) {
  // let files = event.target.files;
  console.log('faker');
  document.getElementById('choose').innerText = "did it work?"
  let svg_container = document.getElementById("container");
  let svg_element = svg_container.children[0];
  if(svg_element) {svg_element.parentNode.removeChild(svg_element)}  // remove any previously created svg element
  let svg_menu = document.getElementById("svgMenu");
  if(svg_menu) {svg_menu.parentNode.removeChild(svg_menu)}      // force removal of any created peer menu element

  // svg_container.attributes["data-image"].src = 'http://localhost:8081/tests/images/testImage.jpg';
  console.log('render?')
  svg_container.attributes["data-image"].value = 'file:///Users/jrichardflood/RubymineProjects/svg-detailer/tests/images/testImage.jpg';
  svg = new SVGDraw(svg_container);
}
