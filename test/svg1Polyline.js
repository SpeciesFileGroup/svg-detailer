const { Builder, By, Key, until} = require('selenium-webdriver');
const {expect} = require('chai');
describe('Polyline creation', () => {
  const driver = new Builder().forBrowser('firefox').build();
  // let mode = driver.findElement(By.id, 'mode');
  driver.manage().setTimeouts({implicit: 40000});
  const actions = driver.actions();

  it('Should create an element with id g1 and type polyline', async () => {
    await driver.get('http://localhost:8081/');
    await driver.findElement(By.id('image_file')).sendKeys('/Users/jrichardflood/RubymineProjects/svg-detailer/test/images/testImage.jpg');
    let element, type, id, xoff, yoff, zoom, transform, i, points, px, py, coords, idealPoints = [];
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
      points = [[ 48, 128], [ 48, 214], [ 263, 214], [ 263, 128]];
      console.log(points);
      await driver.findElement(By.css('#b_polyline')).click();
      for(i=0; i<points.length-1; i++) {
        console.log(points[i]);
        console.log(points[i][0]);
        console.log(points[i][1]);
        px = points[i][0] + xoff;
        py = points[i][1] + yoff;
        console.log('x: ' + px + ', y: ' + py);
        await actions.move({x: px, y: py, duration: 1000}).press().release();
      }
      px = points[points.length-1][0] + xoff;
      py = points[points.length-1][1] + yoff;
      console.log('px: ' + px + ', py: ' + py);
      await actions.move({x: px, y: py, duration: 1000}).doubleClick().perform();
      // this.dblClick(); // indirectly invoked through Selenium action

      element = await driver.findElement(By.id('g1'));
      id = await element.getAttribute('id').then(function (x) {return x});
      type = await element.getAttribute('type').then(function (x) {return x});
      // console.log('id: ' + id + ' | type: ' + type);
      element = await driver.findElement(By.css('polyline'));
    }
    catch (event) {
      console.log(event);
    }
    finally {
      expect(type).to.equal('polyline', 'type');
      expect(id).to.equal('g1', 'id');
      let coords = await element.getAttribute('points').then(function (x) {return x});
      console.log(coords);
      coords = coords.split(' ');
      console.log(coords);    // points created through move/click
      console.log(points);    // non-offset rendered screen pixel points
      for(i=0; i<points.length; i++) {
        points[i][0] = ((points[i][0])/zoom).toFixed(3);
        points[i][1] = ((points[i][1])/zoom).toFixed(3);
        console.log('coords[' + i + ']: ' + coords[i] + ' | x: ' + px + ', y: ' + py);
        idealPoints[i] = points[i][0].toString() + ',' + points[i][1].toString();
        console.log(idealPoints);
      }
      // xoff=0;
      // yoff=0;
      // for(i=0; i<points.length; i++) {
      //   px = ((points[i][0] + xoff)/zoom).toFixed(3);
      //   py = ((points[i][1] + yoff)/zoom).toFixed(3);
      //   console.log('coords[' + i + ']: ' + coords[i] + ' | x: ' + px + ', y: ' + py);
      //   expect(coords[i]).to.equal(px.toString() + ',' +py.toString(), 'x,y ' + i);
      //   expect(coords).to.equal(idealPoints, 'array comparison');
      // }
      for(i=0; i<points.length; i++) {
        px = points[i][0];
        py = points[i][1];
        console.log('coords[' + i + ']: ' + coords[i] + ' | x: ' + px + ', y: ' + py);
        expect(coords[i]).to.equal(px.toString() + ',' +py.toString(), 'x,y ' + i);
        expect(coords).to.equal(idealPoints, 'array comparison');
      }
    }
    let mode = await driver.findElement(By.id('b_move')).click();
    // driver.quit();
  })
});
