var path = require('path');

const testPath = path.dirname(__filename);
const { Builder, By, Key, until} = require('selenium-webdriver');
const {expect} = require('chai');
const enable_log = false;
describe('Polyline creation', () => {
  const driver = new Builder().forBrowser('firefox').build();
  driver.manage().setTimeouts({implicit: 40000});
  const actions = driver.actions();

  it('Should create an element with id g1 and type polyline', async () => {
    await driver.get('http://localhost:8080/');
    await driver.findElement(By.id('image_file')).sendKeys(testPath + '/images/testImage.jpg');
    let element, type, id, xoff, yoff, zoom, transform, i, points, px, py, coords, idealPoints = [];
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
      zoom = parseFloat(zoom[0]);
      console_log('xoff: ' + xoff + ' | yoff: ' + yoff + ' | zoom: ' + zoom);
    }
    catch (event) {
      console.log(event);
    }
    try {
      points = [[ 48, 128], [ 48, 214], [ 263, 214], [ 263, 128]];
      // console_log(points);
      await driver.findElement(By.css('#b_polyline')).click();
      for(i=0; i<points.length-1; i++) {
        console_log(points[i]);
        console_log(points[i][0]);
        console_log(points[i][1]);
        px = points[i][0] + xoff;
        py = points[i][1] + yoff;
        console_log('x: ' + px + ', y: ' + py);
        await actions.move({x: px, y: py, duration: 1000}).press().release();
      }
      px = points[points.length-1][0] + xoff;
      py = points[points.length-1][1] + yoff;
      console_log('px: ' + px + ', py: ' + py);
      await actions.move({x: px, y: py, duration: 1000}).doubleClick().perform();

      element = await driver.findElement(By.id('g1'));
      id = await element.getAttribute('id').then(function (x) {return x});
      type = await element.getAttribute('type').then(function (x) {return x});
      console_log('id: ' + id + ' | type: ' + type);
      element = await driver.findElement(By.css('polyline'));
    }
    catch (event) {
      console.log(event);
    }
    finally {
      expect(type).to.equal('polyline', 'type');
      expect(id).to.equal('g1', 'id');
      let coords = await element.getAttribute('points').then(function (x) {return x});
      console_log(coords);
      coords = coords.split(' ');
      coords.length -= 1;   // compensate for extra space artifact of poly- creation
      console_log(coords);    // points created through move/click
      console_log(points);    // non-offset rendered screen pixel points
      for(i=0; i<points.length; i++) {    // mutate original points to zoom-scaled and then to strings
        points[i][0] = ((points[i][0])/zoom).toFixed(3);
        points[i][1] = ((points[i][1])/zoom).toFixed(3);
        console_log('coords[' + i + ']: ' + coords[i] + ' | x: ' + px + ', y: ' + py);
        idealPoints[i] = points[i][0].toString() + ',' + points[i][1].toString();
        console_log(idealPoints);
      }
      console_log('coords: ' +  coords.constructor );
      console_log(coords );
      console_log( 'idealPoints: ' +  idealPoints.constructor );
      console_log(idealPoints);
        expect(coords).to.deep.equal(idealPoints, 'array comparison');
    }
    let mode = await driver.findElement(By.id('b_move')).click();
    await driver.quit();
  });
  function console_log(object) {
    if(enable_log) console.log(object)
  }
});
