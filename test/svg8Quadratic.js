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
      zoom = parseFloat(zoom[0]);  //((transform.toString()).split('(')[3]).split(')')[0]);
      // console.log('xoff: ' + xoff + ' | yoff: ' + yoff + ' | zoom: ' + zoom);
      x1 = 300 + xoff;
      y1 = 300 + yoff;
      x2 = 400 + xoff;
      y2 = 400 + yoff;
      // a quadratic will have four ordered points
    }
    catch (event){
      console.log(event);
      x1 = 300;
      y1 = 300;   // failsafe to
      x2 = 400;   // non-offset values
      y2 = 400;
    }
    // console.log('x1: ' + x1 + ' | y1: ' + y1 + ' | x2: ' + x2 + ' | y2: ' + y2);
    await driver.findElement(By.css('#b_quadratic')).click();
    await actions.move({ x: x1, y: y1, duration: 100}).press();
    await actions.move({ x: x2, y: y2, duration: 1000});
    await actions.release().perform();
    // await container.sendkeys(13);
    // await new actions.LegacyActions(driver).mouseup().perform();
    console.log('create');
    element = await driver.findElement(By.id('c1'));
    c1x = parseInt(zoom * parseFloat(await element.getAttribute('cx').then(function (x) {return x})) - xoff);
    c1y = parseInt(zoom * parseFloat(await element.getAttribute('cy').then(function (x) {return x})) - yoff);
    element = await driver.findElement(By.id('c2'));
    c2x = parseInt(zoom * parseFloat(await element.getAttribute('cx').then(function (x) {return x})) - xoff);
    c2y = parseInt(zoom * parseFloat(await element.getAttribute('cy').then(function (x) {return x})) - yoff);
    console.log( c1x + ' | ' + c1y + ' | ' + c2x+ ' | ' + c2y);
    await driver.findElement(By.id('c1')).click();
    // mode = await driver.findElement(By.id('b_move')).click();
    await driver.sleep(2000);
    await actions.move({ x: c1x, y: c1y, duration: 2000}).press();
    // await driver.sleep(2000);
    // await actions.move({ x: c1x, y: c1y, duration: 1000});
    console.log('hover 1');
    await actions.move({ x: x2, y: y1, duration: 2000});
    console.log('drag 1');
    await actions.release().perform();                              // .perform()
    console.log('release 1');
    // mode = await driver.findElement(By.id('b_move')).click();
    // await actions.move({ x: c2x, y: c2y, duration: 100}).press();
    // console.log('hover 2');
    // await actions.move({ x: c1x, y: y1, duration: 1000});
    // console.log('drag 2');
    // await actions.release().perform();
    try {
      element = await driver.findElement(By.id('g1'));
      id = await element.getAttribute('id').then(function (x) {return x});
      type = await element.getAttribute('type').then(function (x) {return x});
      // console.log('id: ' + id + ' | type: ' + type);
    }
    catch (event) {
      console.log(event);
    }
    try {
      element = await driver.findElement(By.tagName('path'));
      // console.log( await element.getAttribute('tagname'));
      x1 = await element.getAttribute('x1').then(function (x) {return x});
      y1 = await element.getAttribute('y1').then(function (x) {return x});
      x2 = await element.getAttribute('x2').then(function (x) {return  x});
      y2 = await element.getAttribute('y2').then(function (x) {return  x});
      // console.log('x1: ' + x1 + ' | y1: ' + y1 + ' | x2: ' + x2 + ' | y2: ' + y2);
    }
    catch (event) {
      console.log(event);
    }
    finally {
      expect(type).to.equal('quadratic', 'type:quadratic');
      expect(id).to.equal('g1', 'id: g1');
      expect(x1).to.equal(((300)/zoom).toString(), 'x1');
      expect(y1).to.equal(((300)/zoom).toString(), 'y1');
      expect(x2).to.equal(((400)/zoom).toString(), 'x2');
      expect(y2).to.equal(((400)/zoom).toString(), 'y2');
    }
    mode = await driver.findElement(By.id('b_move')).click();
    driver.quit();
  });
});
