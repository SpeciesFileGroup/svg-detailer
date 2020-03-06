const enable_log = false;
const { Builder, By, Key, until} = require('selenium-webdriver');
const {expect} = require('chai');
describe('Rectangle creation', () => {
  const driver = new Builder().forBrowser('firefox').build();
  // let mode = driver.findElement(By.id, 'mode');
  driver.manage().setTimeouts({implicit: 40000});
  const actions = driver.actions();

  it('Should create an element with id g1 and type rectangle', async () => {
    // await driver.get('http://localhost:8081/');
    await driver.get('file:///Users/jrichardflood/RubyMineProjects/svg-detailer/demo/index.html');
    await driver.findElement(By.id('image_file')).sendKeys('/Users/jrichardflood/RubymineProjects/svg-detailer/test/images/testImage.jpg');
    let element, type, id, xoff, yoff, zoom, transform, i, points, px, py, width, height;
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
      points = [[ 48, 160], [ 263, 220]];
      console_log(points);
      await driver.findElement(By.css('#b_rectangle')).click();
      for(i=0; i<points.length-1; i++) {
        px = points[i][0] + xoff;
        py = points[i][1] + yoff;
        console_log('x: ' + px + ', y: ' + py);
        await actions.move({x: px, y: py, duration: 1000}).press();
      }
      px = points[points.length-1][0] + xoff;
      py = points[points.length-1][1] + yoff;
      console_log('px: ' + px + ', py: ' + py);
      await actions.move({x: px, y: py, duration: 1000}).release().perform();

      element = await driver.findElement(By.id('g1'));
      id = await element.getAttribute('id').then(function (x) {return x});
      type = await element.getAttribute('type').then(function (x) {return x});
      console_log('id: ' + id + ' | type: ' + type);
      element = await driver.findElement(By.css('rect'));     // N.B. NOT rectangle
    }
    catch (event) {
      console.log(event);
    }
    finally {
      expect(type).to.equal('rect', 'type');
      expect(id).to.equal('g1', 'id');
      px = parseFloat(await element.getAttribute('x').then(function (x) {return x}));
      py = parseFloat(await element.getAttribute('y').then(function (x) {return x}));
      width = parseFloat(await element.getAttribute('width').then(function (x) {return x}));
      height = parseFloat(await element.getAttribute('height').then(function (x) {return x}));
      console_log(points);    // non-offset rendered screen pixel points
      for(i=0; i<points.length; i++) {    // mutate original points to zoom-scaled and then to strings
        points[i][0] = ((points[i][0])/zoom);
        points[i][1] = ((points[i][1])/zoom);
      }
      expect(px).to.be.approximately(points[0][0], 0.01*points[0][0], 'x origin');
      expect(py).to.be.approximately(points[0][1], 0.01*points[0][1], 'y origin');              // within 1%
      expect(width).to.be.approximately(points[1][0] - points[0][0], 0.01*width, 'width');
      expect(height).to.be.approximately(points[1][1] - points[0][1], 0.01*height, 'height');
    }
    let mode = await driver.findElement(By.id('b_move')).click();
    await driver.quit();
  });
  function console_log(object) {
    if(enable_log) console.log(object)
  }
});
