/* test detailer interactions:
  config: npm install
          npm install -g selenium-webdriver
          npm install -g geckodriver
      XX  npm install -g selenium-webdriver/testing
          npm install -g mocha
          npm install -g chai
          npm run serve
  test execution: mocha svgTest2
 */
const { Builder, By, Key, until} = require('selenium-webdriver');
// const {before, after} = require('selenium-webdriver/testing');
// const assert = require('assert');
// const dummy = require('mocha');
const {expect} = require('chai');
describe('Line creation', () => {
  const driver = new Builder().forBrowser('firefox').build();
  // let mode = driver.findElement(By.id, 'mode');
  driver.manage().setTimeouts({implicit: 40000});
  const actions = driver.actions();
  // const mouse = actions.mouse();
  it('Should create an svg element with id "g1" and type "line"', async () => {
    await driver.get('http://localhost:8081/');
    console.log('page');
    await driver.findElement(By.id('image_file')).sendKeys('/Users/jrichardflood/RubymineProjects/svg-detailer/tests/images/testImage.jpg');
    let element, type, id, zoom, transform, xoff, yoff, x1, x2, y1, y2;
    try {
      element = await driver.findElement(By.id('container'));
      xoff = parseInt(await element.getAttribute('offsetLeft').then(function (x) {return x}));
      yoff = parseInt(await element.getAttribute('offsetTop').then(function (x) {return x}));
      console.log('xoff: ' + xoff + ' | yoff: ' + yoff);
      element = await driver.findElement(By.id('xlt'));
      transform = await element.getAttribute('transform');
      console.log(transform, typeof transform);
      zoom = transform.split('(');
      zoom = zoom[2].split(')');
      console.log(zoom[0]);
      zoom = parseFloat(zoom[0]);  //((transform.toString()).split('(')[3]).split(')')[0]);
      console.log('xoff: ' + xoff + ' | yoff: ' + yoff + ' | zoom: ' + zoom);
    }
    catch (event){
      console.log(event);
    }
    x1 = 300 + xoff;
    y1 = 300 + yoff;
    x2 = 400 + xoff;
    y2 = 400 + yoff;
    console.log('x1: ' + x1 + ' | y1: ' + y1 + ' | x2: ' + x2 + ' | y2: ' + y2);
    await driver.findElement(By.css('#b_line')).click();
    await actions.move({ x: x1, y: y1, duration: 1000}).press();
    await actions.move({ x: x2, y: y2, duration: 1000});
    // await actions.move({ x: 308, y: 327, duration: 1000}).press().perform();
    // await actions.move({ x: 400, y: 400, duration: 1000}).perform();
    await actions.release().perform();
    try {
      element = await driver.findElement(By.id('g1'));
      id = await element.getAttribute('id').then(function (x) {return x});
      type = await element.getAttribute('type').then(function (x) {return x});
      console.log('id: ' + id + ' | type: ' + type);
    }
    catch (event) {
      console.log(event);
      console.log(driver.toString());
    }
    try {
      element = await driver.findElement(By.tagName('line'));
      console.log( await element.getAttribute('tagname'));
      x1 = await element.getAttribute('x1').then(function (x) {return x});
      y1 = await element.getAttribute('y1').then(function (x) {return x});
      x2 = await element.getAttribute('x2').then(function (x) {return  x});
      y2 = await element.getAttribute('y2').then(function (x) {return  x});
      console.log('x1: ' + x1 + ' | y1: ' + y1 + ' | x2: ' + x2 + ' | y2: ' + y2);
    }
    catch (event) {
      console.log(event);
      console.log(driver.toString());
    }
    finally {
      expect(type).to.equal('line');
      expect(id).to.equal('g1');
      console.log('x1: ' + x1 + ' | ' + (300)/zoom);
      expect(x1).to.equal(((300)/zoom).toString());
      console.log('y1: ' + y1 + ' | ' + (300)/zoom);
      expect(y1).to.equal(((300)/zoom).toString());
      console.log('x2: ' + x2 + ' | ' + (400)/zoom);
      expect(x2).to.equal(((400)/zoom).toString());
      console.log('y2: ' + y2 + ' | ' + (400)/zoom);
      expect(y2).to.equal(((400)/zoom).toString());
      }
    let mode = await driver.findElement(By.id('b_move')).click();
  });
});
