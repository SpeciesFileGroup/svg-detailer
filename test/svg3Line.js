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
const { Builder, By, Key, until} = require('selenium-webdriver');
const enable_log = false;
const {expect} = require('chai');
describe('Line creation', () => {
  const driver = new Builder().forBrowser('firefox').build();
  driver.manage().setTimeouts({implicit: 40000});
  const actions = driver.actions();
  it('Should create an svg element with id "g1" and type "line"', async () => {
    // await driver.get('http://localhost:8081/');
    await driver.get('file:///Users/jrichardflood/RubyMineProjects/svg-detailer/demo/index.html');
    await driver.findElement(By.id('image_file')).sendKeys('/Users/jrichardflood/RubymineProjects/svg-detailer/test/images/testImage.jpg');
    let element, type, id, zoom, transform, xoff, yoff, x1, x2, y1, y2;
    x1 = 300;
    y1 = 300;   // failsafe to
    x2 = 400;   // non-offset values
    y2 = 400;
    try {
      element = await driver.findElement(By.id('container'));
      xoff = parseInt(await element.getAttribute('offsetLeft').then(function (x) {return x}));
      yoff = parseInt(await element.getAttribute('offsetTop').then(function (x) {return x}));
      console_log('xoff: ' + xoff + ' | yoff: ' + yoff);
      element = await driver.findElement(By.id('xlt'));
      transform = await element.getAttribute('transform');
      console_log(transform, typeof transform);
      zoom = transform.split('(');
      zoom = zoom[2].split(')');
      console_log(zoom[0]);
      zoom = parseFloat(zoom[0]);  //((transform.toString()).split('(')[3]).split(')')[0]);
      console_log('xoff: ' + xoff + ' | yoff: ' + yoff + ' | zoom: ' + zoom);
      x1 = 300 + xoff;
      y1 = 300 + yoff;
      x2 = 400 + xoff;
      y2 = 400 + yoff;
    }
    catch (event){
      console.log(event);
    }
    console_log('x1: ' + x1 + ' | y1: ' + y1 + ' | x2: ' + x2 + ' | y2: ' + y2);
    await driver.findElement(By.css('#b_line')).click();
    await actions.move({ x: x1, y: y1, duration: 100}).press();
    await actions.move({ x: x2, y: y2, duration: 1000});
    await actions.release().perform();
    try {
      element = await driver.findElement(By.id('g1'));
      id = await element.getAttribute('id').then(function (x) {return x});
      type = await element.getAttribute('type').then(function (x) {return x});
      console_log('id: ' + id + ' | type: ' + type);
    }
    catch (event) {
      console.log(event);
    }
    try {
      element = await driver.findElement(By.tagName('line'));
      x1 = await element.getAttribute('x1').then(function (x) {return x});
      y1 = await element.getAttribute('y1').then(function (x) {return x});
      x2 = await element.getAttribute('x2').then(function (x) {return  x});
      y2 = await element.getAttribute('y2').then(function (x) {return  x});
      console_log('x1: ' + x1 + ' | y1: ' + y1 + ' | x2: ' + x2 + ' | y2: ' + y2);
    }
    catch (event) {
      console.log(event);
    }
    finally {
      expect(type).to.equal('line', 'type:line');
      expect(id).to.equal('g1', 'id: g1');
      expect(x1).to.equal(((300)/zoom).toString(), 'x1');
      expect(y1).to.equal(((300)/zoom).toString(), 'y1');
      expect(x2).to.equal(((400)/zoom).toString(), 'x2');
      expect(y2).to.equal(((400)/zoom).toString(), 'y2');
      }
    let mode = await driver.findElement(By.id('b_move')).click();
    await driver.quit();
  });
  function console_log(object) {
    if(enable_log) console.log(object)
  }
});
