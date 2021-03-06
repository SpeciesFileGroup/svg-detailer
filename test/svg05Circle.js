var path = require('path');

const testPath = path.dirname(__filename);
const { Builder, By, Key, until} = require('selenium-webdriver');
const {expect} = require('chai');
const enable_log = false;
describe('Circle creation', () => {
  const driver = new Builder().forBrowser('firefox').build();
  driver.manage().setTimeouts({implicit: 40000});
  const actions = driver.actions();

  it('Should create an element with id g1 and class circle', async () => {
    await driver.get('http://localhost:8080/svg-detailer/');
    await driver.findElement(By.id('image_file')).sendKeys(testPath + '/images/testImage.jpg');
    let element, _class, id, xoff, yoff, zoom, transform, cx, cy, r;
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
      r = 200;
      await driver.findElement(By.css('#b_circle')).click();
      await actions.move({x: cx, y: cy, duration: 100}).press();
      await actions.move({x: cx + r, y: cy, duration: 1000});
      await actions.release().perform();
      element = await driver.findElement(By.id('g1'));
      id = await element.getAttribute('id').then(function (x) {return x});
      _class = await element.getAttribute('class').then(function (x) {return x});
      // console_log('id: ' + id + ' | class: ' + _class);
      element = await driver.findElement(By.css('circle'));
      cx = await element.getAttribute('cx').then(function (x) {return x});
      cy = await element.getAttribute('cy').then(function (x) {return x});
      r = await element.getAttribute('r').then(function (x) {return x});
      console_log('cx: ' + cx + ' | cy: ' + cy);
    }
    catch (event) {
      console.log(event);
    }
    finally {
      expect(_class).to.equal('circle', 'class');
      expect(id).to.equal('g1', 'id');
      expect(cx).to.equal((300/zoom).toFixed(4).toString(), 'cx');
      expect(cy).to.equal((300/zoom).toFixed(4).toString(), 'cy');
      expect(r).to.equal((200/zoom).toFixed(4).toString(), 'r')
    }
    let mode = await driver.findElement(By.id('b_move')).click();
    await driver.quit();
  });
  function console_log(object) {
    if(enable_log) console.log(object)
  }
});
