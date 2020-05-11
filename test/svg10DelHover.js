/* test detailer interactions:
  config: npm install
          npm install -g selenium-webdriver
          npm install -g geckodriver
          npm run serve
 */
var path = require('path');

const testPath = path.dirname(__filename);
const enable_log = true;
const { Builder, By, Key, until} = require('selenium-webdriver');
const {expect} = require('chai');
describe('Delete last element', () => {
  const driver = new Builder().forBrowser('firefox').build();
  // let mode = driver.findElement(By.id, 'mode');
  driver.manage().setTimeouts({implicit: 40000});
  const actions = driver.actions();
  let polyline, polygon, line, rectangle, circle, ellipse, cubic, quadratic;
  it('should remove the hovered/active group', async () => {
    try {
      await driver.get('http://localhost:8080/');
      await driver.findElement(By.id('image_file')).sendKeys(testPath + '/images/testImage1.png');
      let element, _class, id, xoff, yoff, zoom, transform, cx, cy;
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
        zoom = parseFloat(zoom[0]);  //((transform.toString()).split('(')[2]).split(')')[0]);
        console_log('xoff: ' + xoff + ' | yoff: ' + yoff + ' | zoom: ' + zoom);
      }
      catch (event) {
        console.log(event);
      }
      try {
        cx = 300 + xoff;
        cy = 300 + yoff;
        await driver.findElement(By.css('#b_ellipse')).click();
        await actions.move({x: cx, y: cy, duration: 100}).press();
        await actions.move({x: 370, y: 400, duration: 1000});
        await actions.release().perform();
        element = await driver.findElement(By.id('g1'));
        id = await element.getAttribute('id').then(function (x) {return x});
        _class = await element.getAttribute('class').then(function (x) {return x});
        console_log('id: ' + id + ' | class: ' + _class);
        element = await driver.findElement(By.css('ellipse'));
        cx = await element.getAttribute('cx').then(function (x) {return x});
        cy = await element.getAttribute('cy').then(function (x) {return x});
        console_log('cx: ' + cx + ' | cy: ' + cy);
      }
      catch (event) {
        console.log(event);
      }
      finally {
        expect(_class).to.equal('ellipse', 'class');
        expect(id).to.equal('g1', 'id');
        expect(cx).to.equal((300/zoom).toFixed(4).toString(), 'cx');
        expect(cy).to.equal((300/zoom).toFixed(4).toString(), 'cy');
      }
      try {
        let before, bcount, after, acount;
        bcount = await driver.findElement(By.id('xlt')).getAttribute('childElementCount');
        console_log(bcount);
        // let mode = await driver.findElement(By.id('b_clear')).click();
        await driver.findElement(By.id('container')).sendKeys('+del');
        acount = await driver.findElement(By.id('xlt')).getAttribute('childElementCount');
        console_log(acount);
      }
      catch (event) {
        console.log(event);
      }
      finally {
        expect(bcount - acount).to.equal(1)
      }
      // let mode = await driver.findElement(By.id('b_clear')).click();
      // await driver.quit();

    }
    catch(event) {
      console.log(event)
    }

  });
  function console_log(object) {
    if(enable_log) console.log(object)
  }
});     // end of describe
