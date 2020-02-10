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
    await driver.findElement(By.css('#b_line')).click();
    await actions.move({ x:300, y:300, duration: 1000}).press().perform();
    await actions.move({ x:400, y:400, duration: 1000}).perform();
    await actions.release().perform();
    let element, type, id;
    try {
      element = await driver.findElement(By.id('g1'));
      // await element.getAttribute('id').then(function (x) {id = x});
      // await element.getAttribute('type').then(function (x) {type = x});
      // console.log('id: ' + id + ' | type: ' + type);
      id = await element.getAttribute('id').then(function (x) {return x});
      type = await element.getAttribute('type').then(function (x) {return x});
      console.log('id: ' + id + ' | type: ' + type);
    }
    catch {
      console.log('catch');
      console.log(driver.toString());
    }
    finally {
      expect(type).to.equal('line');
      expect(id).to.equal('g1');
      }
    let mode = await driver.findElement(By.id, 'b_move').click();
  });
});
