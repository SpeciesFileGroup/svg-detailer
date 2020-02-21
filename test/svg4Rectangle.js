const { Builder, By, Key, until} = require('selenium-webdriver');
const {assert} = require('assert');
const {expect} = require('chai');
describe('Rectangle creation', () => {
  const driver = new Builder().forBrowser('firefox').build();
  // let mode = driver.findElement(By.id, 'mode');
  driver.manage().setTimeouts({implicit: 40000});
  const actions = driver.actions();

  it('Should create an element with id g1 and type rectangle', async () => {
    await driver.get('http://localhost:8081/');
    await driver.findElement(By.id('image_file')).sendKeys('/Users/jrichardflood/RubymineProjects/svg-detailer/test/images/testImage.jpg');
    let element, type, id, xoff, yoff, zoom, transform, i, points, px, py, width, height;
    try {
      element = await driver.findElement(By.id('container'));
      xoff = parseInt(await element.getAttribute('offsetLeft').then(function (x) {return x}));
      yoff = parseInt(await element.getAttribute('offsetTop').then(function (x) {return x}));
      // console.log('xoff: ' + xoff + ' | yoff: ' + yoff);
      element = await driver.findElement(By.id('xlt'));
      transform = await element.getAttribute('transform');
      // console.log(transform, typeof transform);
      zoom = transform.split('(');
      zoom = zoom[2].split(')');
      // console.log(zoom[0]);
      zoom = parseFloat(zoom[0]);  //((transform.toString()).split('(')[2]).split(')')[0]);
      // console.log('xoff: ' + xoff + ' | yoff: ' + yoff + ' | zoom: ' + zoom);
    }
    catch (event) {
      console.log(event);
    }
    try {
      points = [[ 48, 160], [ 263, 220]];
      // console.log(points);
      await driver.findElement(By.css('#b_rectangle')).click();
      for(i=0; i<points.length-1; i++) {
        px = points[i][0] + xoff;
        py = points[i][1] + yoff;
        // console.log('x: ' + px + ', y: ' + py);
        await actions.move({x: px, y: py, duration: 1000}).press();
      }
      px = points[points.length-1][0] + xoff;
      py = points[points.length-1][1] + yoff;
      // console.log('px: ' + px + ', py: ' + py);
      await actions.move({x: px, y: py, duration: 1000}).release().perform();

      element = await driver.findElement(By.id('g1'));
      id = await element.getAttribute('id').then(function (x) {return x});
      type = await element.getAttribute('type').then(function (x) {return x});
      // console.log('id: ' + id + ' | type: ' + type);
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
      width = await element.getAttribute('width').then(function (x) {return x});
      height = await element.getAttribute('height').then(function (x) {return x});
      // console.log(points);    // non-offset rendered screen pixel points
      for(i=0; i<points.length; i++) {    // mutate original points to zoom-scaled and then to strings
        // points[i][0] = ((points[i][0])/zoom).toFixed(3);
        // points[i][1] = ((points[i][1])/zoom).toFixed(3);
        points[i][0] = ((points[i][0])/zoom);
        points[i][1] = ((points[i][1])/zoom);
      }
      console.log(typeof px);
      console.log(typeof points[0][0]);
      console.log(px + ' | ' + points[0][0] + ' | ' + py + ' | ' + points[0][1] );
      let zx = parseFloat(points[0][0]);
      let zy = parseFloat(points[0][1]);
      console.log(zx + ' ' + zy);
      assert.approximately(zx+zy, zy+zx, 10, 'zzzz');
      // assert.approximately(px, (points[0][0]), 0.1*px, 'x origin');
      // assert.approximately(py, (points[0][1]), 0.1*py, 'y origin');
      expect(px).to.equal(points[0][0], 'x origin');
      expect(py.to.equal(points[0][1]), 'y origin');
      expect(width).to.equal(points[1][0] - points[0][0], 'width');
      expect(height).to.equal(points[0][1] - points[1][1], 'height');
    }
    let mode = await driver.findElement(By.id('b_move')).click();
    // driver.quit();
  })
});
