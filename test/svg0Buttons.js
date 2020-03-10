/* test detailer interactions:
  config: npm install
          npm install -g selenium-webdriver
          npm install -g geckodriver
          npm install -g selenium-webdriver/testing
          npm run serve
 */

const enable_log = false;
const { Builder, By, Key, until} = require('selenium-webdriver');
const {expect} = require('chai');
describe('Buttonology', () => {
  const driver = new Builder().forBrowser('firefox').build();
  // let mode = driver.findElement(By.id, 'mode');
  driver.manage().setTimeouts({implicit: 40000});
  const actions = driver.actions();
  let polyline, polygon, line, rectangle, circle, ellipse, cubic, quadratic;
  it('should select the mode according to the buttons', async () => {
    try {
      await driver.get('http://localhost:8081/');
      // await driver.get('file:///Users/jrichardflood/RubyMineProjects/svg-detailer/demo/index.html');
      await driver.findElement(By.id('image_file')).sendKeys('/Users/jrichardflood/RubymineProjects/svg-detailer/test/images/testImage.jpg');
      await driver.findElement(By.css('#b_polygon')).click();
      polygon = (await driver.findElement(By.id('mode')).getAttribute('textContent')).toLowerCase();
      await driver.findElement(By.css('#b_polyline')).click();
      polyline = (await driver.findElement(By.id('mode')).getAttribute('textContent')).toLowerCase();
      await driver.findElement(By.css('#b_line')).click();
      line = (await driver.findElement(By.id('mode')).getAttribute('textContent')).toLowerCase();
      await driver.findElement(By.css('#b_rectangle')).click();
      rectangle = (await driver.findElement(By.id('mode')).getAttribute('textContent')).toLowerCase();
      await driver.findElement(By.css('#b_circle')).click();
      circle = (await driver.findElement(By.id('mode')).getAttribute('textContent')).toLowerCase();
      await driver.findElement(By.css('#b_ellipse')).click();
      ellipse = (await driver.findElement(By.id('mode')).getAttribute('textContent')).toLowerCase();
      await driver.findElement(By.css('#b_cubic')).click();
      cubic = (await driver.findElement(By.id('mode')).getAttribute('textContent')).toLowerCase();
      await driver.findElement(By.css('#b_quadratic')).click();
      quadratic = (await driver.findElement(By.id('mode')).getAttribute('textContent')).toLowerCase();
    }
    catch(event) {
      console.log(event)
    }
    finally {
    expect(polygon).to.equal('polygon', 'polygon');
    expect(polyline).to.equal('polyline', 'polyline');
    expect(line).to.equal('line', 'line');
    expect(rectangle).to.equal('rectangle', 'rectangle');
    expect(circle).to.equal('circle', 'circle');
    expect(ellipse).to.equal('ellipse', 'ellipse');
    expect(cubic).to.equal('cubic', 'cubic');
    expect(quadratic).to.equal('quadratic', 'quadratic');
    await driver.quit();
    }
  });
});     // end of describe
