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
      mocha --no-timeouts ./svg3Line (when executed from .../svg-detailer/test/)

  NOTE: action drawing coordinates are translated by the offsets of the container <div>
 */

const { Builder, By, Key, until} = require('selenium-webdriver');
const {expect} = require('chai');
describe('Quadratic creation', () => {
  const driver = new Builder().forBrowser('firefox').build();
  driver.manage().setTimeouts({implicit: 40000});
  const actions = driver.actions();
  // const actionChains = ActionChains(driver);
  // const mouse = actions.mouse();
  it('Should create an svg element with id "g1" and type "quadratic"', async () => {
    await driver.get('http://localhost:8081/');
    // console.log('page');
    await driver.findElement(By.id('image_file')).sendKeys('/Users/jrichardflood/RubymineProjects/svg-detailer/test/images/testImage.jpg');
    let container, element, type, id, zoom, transform, xoff, yoff, mode, x1, x2, y1, y2, d, points, c1x, c1y, c2x, c2y;
    x1 = 300;
    y1 = 300;   // failsafe to
    x2 = 400;   // non-offset values
    y2 = 400;
    try {
      element = await driver.findElement(By.id('container'));
      xoff = parseInt(await element.getAttribute('offsetLeft').then(function (x) {return x}));
      yoff = parseInt(await element.getAttribute('offsetTop').then(function (x) {return x}));
      // console.log('xoff: ' + xoff + ' | yoff: ' + yoff);
      container = element;
      element = await driver.findElement(By.id('xlt'));
      transform = await element.getAttribute('transform');
      // console.log(transform, typeof transform);
      zoom = transform.split('(');
      zoom = zoom[2].split(')');
      // console.log(zoom[0]);
      zoom = parseFloat(zoom[0]);
      // console.log('xoff: ' + xoff + ' | yoff: ' + yoff + ' | zoom: ' + zoom);
      x1 += xoff;
      y1 += yoff;    // offset into svgLayer
      x2 += xoff;
      y2 += yoff;
      // a quadratic will have four ordered points
    }
    catch (event){
      console.log(event);
    }
    // console.log('x1: ' + x1 + ' | y1: ' + y1 + ' | x2: ' + x2 + ' | y2: ' + y2);
    await driver.findElement(By.css('#b_quadratic')).click();
    await actions.move({ x: x1, y: y1, duration: 100}).press();
    await actions.move({ x: x2, y: y2, duration: 1000});
    await actions.release().perform();
    console.log('create');
    element = await driver.findElement(By.id('c1'));
    c1x = parseInt(parseFloat(await element.getAttribute('cx').then(function (x) {return x})) - xoff);
    c1y = parseInt(parseFloat(await element.getAttribute('cy').then(function (x) {return x})) - yoff);
    // element = await driver.findElement(By.id('c2'));
    // c2x = parseInt(zoom * parseFloat(await element.getAttribute('cx').then(function (x) {return x})) - xoff);
    // c2y = parseInt(zoom * parseFloat(await element.getAttribute('cy').then(function (x) {return x})) - yoff);
    console.log('bubbles: ' + c1x + ' | ' + c1y + ' | ' + c2x + ' | ' + c2y);
    console.log('offset endpoints: ' + x1 + ' | ' + y1 + ' | ' + x2 + ' | ' + y2);

    try {
      element = await driver.findElement(By.id('g1'));
      id = await element.getAttribute('id').then(function (x) {return x});
      type = await element.getAttribute('type').then(function (x) {return x});
      // console.log('id: ' + id + ' | type: ' + type);
    }
    catch (event) {
      console.log(event);
    }
    finally {
      expect(type).to.equal('quadratic', 'type:quadratic');
      expect(id).to.equal('g1', 'id: g1');
      let c1_x = (x1 - xoff - 0.4*(x1 - x2))/zoom;      // de-offset from body coords
      let c1_y = (y1 - yoff - 0.4*(y1 - y2))/zoom;      // 'add' percentage of 'line' length
      // let c2_x = (x1 - xoff - 0.6*(x1 - x2))/zoom;      // and scale to zoom
      // let c2_y = (y1 - yoff - 0.6*(x1 - x2))/zoom;      // to image coords
      console.log('c1x: ' + c1x + ' ' + c1_x);
      console.log('c1y: ' + c1y + ' ' + c1_y);
      // console.log('c2x: ' + c2x + ' ' + c2_x);
      // console.log('c2y: ' + c2y + ' ' + c2_y);
      expect(c1x).to.be.approximately(c1_x, 0.01*c1x, 'control 1x');
      expect(c1y).to.be.approximately(c1_y, 0.01*c1y, 'control 1y');
      // expect(c2x).to.be.approximately(c2_x, 0.01*Math.abs(c2x), 'control 2x');
      // expect(c2y).to.be.approximately(c2_y, 0.01*Math.abs(c2y), 'control 2y');
    }
    mode = await driver.findElement(By.id('b_move')).click();
    driver.quit();
  });
});
