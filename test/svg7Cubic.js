/* test detailer interactions:
config: npm install
npm install -g selenium-webdriver
npm install -g geckodriver
XX  npm install -g selenium-webdriver/testing  XX this seems to now be obsolete
npm install -g mocha
npm install -g chai
npm run serve
test execution:
batch/suite (from .../svg-detailer/):
mocha --no-timeouts executes all tests in ./test/ from .../svg-detailer/
individually:
mocha --no-timeouts ./test/svg3Line (when executed from .../svg-detailer/)
mocha --no-timeouts svg3Line (when executed from .../svg-detailer/test/)

NOTE: action drawing coordinates are translated by the offsets of the container <div>
*/
var path = require('path')

const testPath = path.dirname(__filename)
const enable_log = false;
const { Builder, By, Key, until} = require('selenium-webdriver');
const {expect} = require('chai');
describe('Cubic creation', () => {
  const driver = new Builder().forBrowser('firefox').build();
  driver.manage().setTimeouts({implicit: 40000});
  const actions = driver.actions();

  it('Should create an svg element with id "g1" and type "cubic"', async () => {
    await driver.get('http://localhost:8080/');
    // await driver.get('file:///Users/jrichardflood/RubyMineProjects/svg-detailer/demo/index.html');
    await driver.findElement(By.id('image_file')).sendKeys(testPath + '/images/testImage.jpg');
    let container, element, type, id, zoom, transform, xoff, yoff, mode, p1x, p2x, p1y, p2y, d, points, c1x, c1y, c2x, c2y;
    p1x = 300;
    p1y = 300;   // failsafe to
    p2x = 400;   // non-offset values
    p2y = 400;
    // p1x = 400;
    // p1y = 400;    // offset into svgLayer
    // p2x = 300;    // alternate version for positive slope
    // p2y = 300;
    try {
      element = await driver.findElement(By.id('container'));
      xoff = parseInt(await element.getAttribute('offsetLeft').then(function (x) {return x}));
      yoff = parseInt(await element.getAttribute('offsetTop').then(function (x) {return x}));
      console_log('xoff: ' + xoff + ' | yoff: ' + yoff);
      container = element;
      element = await driver.findElement(By.id('xlt'));
      transform = await element.getAttribute('transform');
      console_log(transform, typeof transform);
      zoom = transform.split('(');
      zoom = zoom[2].split(')');
      console_log(zoom[0]);
      zoom = parseFloat(zoom[0]);  //((transform.toString()).split('(')[3]).split(')')[0]);
      console_log('xoff: ' + xoff + ' | yoff: ' + yoff + ' | zoom: ' + zoom);
      p1x += xoff;
      p1y += yoff;    // offset into svgLayer
      p2x += xoff;
      p2y += yoff;
      // a cubic will have four ordered points
      // Notes on coordinates
      // coordinates simulated by selenium are referenced to the browser document body in hardware pixels.
      // SVG elements are rendered in image pixels according to the XLT, referenced to the container.
      // The container is offset from the top and the left of the body.  The (initial) zoom ratio is calculated
      // from the container dimensions and the image dimensions.
    }
    catch (event){
      console.log(event);
    }
    console_log('p1x: ' + p1x + ' | p1y: ' + p1y + ' | p2x: ' + p2x + ' | p2y: ' + p2y);
    await driver.findElement(By.css('#b_cubic')).click();
    await actions.move({ x: p1x, y: p1y, duration: 100}).press();
    await actions.move({ x: p2x, y: p2y, duration: 1000});
    await actions.release().perform();
    // extract pixel coordinates of the quadratic's edit points
    element = await driver.findElement(By.id('p1'));
    let p1_x = parseInt(parseFloat(await element.getAttribute('cx').then(function (x) {return x})));
    let p1_y = parseInt(parseFloat(await element.getAttribute('cy').then(function (x) {return x})));
    element = await driver.findElement(By.id('c1'));
    c1x = parseInt(parseFloat(await element.getAttribute('cx').then(function (x) {return x})));
    c1y = parseInt(parseFloat(await element.getAttribute('cy').then(function (x) {return x})));
    element = await driver.findElement(By.id('shift'));
    let shift_x = parseInt(parseFloat(await element.getAttribute('cx').then(function (x) {return x})));
    let shift_y = parseInt(parseFloat(await element.getAttribute('cy').then(function (x) {return x})));
    element = await driver.findElement(By.id('c2'));
    c2x = parseInt(parseFloat(await element.getAttribute('cx').then(function (x) {return x})));
    c2y = parseInt(parseFloat(await element.getAttribute('cy').then(function (x) {return x})));
    element = await driver.findElement(By.id('p2'));
    let p2_x = parseInt(parseFloat(await element.getAttribute('cx').then(function (x) {return x})));
    let p2_y = parseInt(parseFloat(await element.getAttribute('cy').then(function (x) {return x})));
    console_log('bubbles: ' + c1x + ' | ' + c1y + ' | ' + c2x + ' | ' + c2y);
    console_log('offset endpoints: ' + p1x + ' | ' + p1y + ' | ' + p2x + ' | ' + p2y);
    console_log('pixel endpoints: ' + p1_x + ' | ' + p1_y + ' | ' + p2_x + ' | ' + p2_y);
    try {
      element = await driver.findElement(By.id('g1'));
      id = await element.getAttribute('id').then(function (x) {return x});
      type = await element.getAttribute('type').then(function (x) {return x});
      console_log('id: ' + id + ' | type: ' + type);
    }
    catch (event) {
      console.log(event);
    }
    finally {
      expect(type).to.equal('cubic', 'type:cubic');
      expect(id).to.equal('g1', 'id: g1');
      let dx = (p1x - p2x)/zoom;
      let dy = (p1y - p2y)/zoom;
      let c1_x = (p1x - xoff - 0.4*(p1x - p2x))/zoom;      // de-offset from body coords
      let c1_y = (p1y - yoff - 0.4*(p1y - p2y))/zoom;      // 'add' percentage of 'line' length
      let c2_x = (p1x - xoff - 0.6*(p1x - p2x))/zoom;      // and scale to zoom
      let c2_y = (p1y - yoff - 0.6*(p1x - p2x))/zoom;      // to image coords
      console_log('c1x: ' + c1x + ' ' + c1_x);
      console_log('c1y: ' + c1y + ' ' + c1_y);
      console_log([shift_x, shift_y, (p2_x + p1_x)/2, (p2_y + p1_y)/2]);
      console_log('c2x: ' + c2x + ' ' + c2_x);
      console_log('c2y: ' + c2y + ' ' + c2_y);
      expect(p1_x).to.be.approximately((p1x - xoff)/zoom, 0.01*Math.abs(dx), 'point 1x');
      expect(p1_y).to.be.approximately((p1y - yoff)/zoom, 0.01*Math.abs(dy), 'point 1y');
      expect(c1_x).to.be.approximately(c1x, 0.01*Math.abs(dx), 'control 1x');
      expect(c1_y).to.be.approximately(c1y, 0.01*Math.abs(dy), 'control 1y');
      expect(shift_x).to.be.approximately(0.5*(p1x - xoff + p2x - xoff)/zoom, 0.01*Math.abs(dx), 'shift 1x');
      expect(shift_y).to.be.approximately(0.5*(p1y - yoff + p2y - yoff)/zoom, 0.01*Math.abs(dx), 'shift 1y');
      expect(p2_x).to.be.approximately((p2x - xoff)/zoom, 0.01*Math.abs(dx), 'point 1x');
      expect(p2_y).to.be.approximately((p2y - yoff)/zoom, 0.01*Math.abs(dy), 'point 1y');
    }
    mode = await driver.findElement(By.id('b_move')).click();
    await driver.quit();
  });
  function console_log(object) {
    if(enable_log) console.log(object)
  }
});
