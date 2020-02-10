/* test detailer interactions:
  config: npm install
          npm install -g selenium-webdriver
          npm install -g geckodriver
          npm install -g selenium-webdriver/testing
          npm run serve
 */
// var webdriver = require('selenium-webdriver'),
//   By = webdriver.By,
//   until = webdriver.until,
//   await = webdriver.await;
// var driver = new webdriver.Builder().forBrowser('firefox').build();
// driver.get('http://localhost:8081/');
// driver.sleep(10000);
//
// driver.findElement(By.css('#image_file'));
const { Builder, By, Key, until} = require('selenium-webdriver'),
{ describe, it, after, before } = require('selenium-webdriver/testing');
(async function example() {
  let drawnElement;
  let driver = await new Builder().forBrowser('firefox').build();
  // let mode = driver.findElement(By.id, 'mode');
  driver.manage().setTimeouts({implicit: 40000});
  const actions = driver.actions();
  const mouse = actions.mouse();
  try {
    await driver.get('http://localhost:8081/');
    console.log('page');
    driver.sleep(10000);
    await driver.findElement(By.id('image_file')).sendKeys('/Users/jrichardflood/RubymineProjects/svg-detailer/tests/images/testImage.jpg');
  //     await driver.findElement(By.css('#auto_file')).click();
    driver.sleep(10000);
    console.log('click line?');
    // let lineBtn = await driver.findElement(By.id('b_line')).click();
    // console.log(lineBtn.attributes);
    // await driver.findElement(By.id, "mode");
    // console.log(driver.toString());
    await driver.findElement(By.css('#b_rectangle')).click();
    await driver.findElement(By.css('#b_polyline')).click();
    await driver.findElement(By.css('#b_circle')).click();
    await driver.findElement(By.css('#b_cubic')).click();
    await driver.findElement(By.css('#b_polygon')).click();
    await driver.findElement(By.css('#b_ellipse')).click();
    await driver.findElement(By.css('#b_quadratic')).click();
    // await driver.findElement(By.id, "mode");
    await driver.findElement(By.css('#b_line')).click();
    await actions.move({ x:300, y:300, duration: 1000}).press().perform();
    // await actions.pause(2000).perform();
    // await actions.move({ x:400, y:100, duration: 1000}).perform();
    // await actions.pause(2000).perform();
    await actions.move({ x:400, y:400, duration: 1000}).perform();
    await actions.release().perform();
    console.log('line drawn');
    // await actions.pause(mouse);
/*    await actions.move({ x:500, y:500, duration: 3000}).perform();
    // await actions.mouse().release().perform();
   await driver.findElement(By.css('#b_circle')).click();
    console.log('click circle button');
    // await actions.move({ x:200, y:200}).perform();
    // await actions.pause(2000).perform();
    await actions.move({ x:200, y:200, duration: 500}).press().perform();
    console.log('pressed circle center point');
    // await actions.pause(2000).perform();
    await actions.move({ x:400, y:200, duration: 500}).perform();
    console.log('dragged circle size point');
    // await actions.pause(2000).perform();
    await actions.move({ x:300, y:200, duration: 500}).release().perform();
    console.log('released circle final point');

 */
try {
  drawnElement = console.log('element type = ' + await driver.findElement(By.id('g1')).getAttribute('type'))
}
finally {
    console.log('undefined: ' + (drawnElement == undefined).toString()) //+ 'value =' + drawnElement.id + ' ' + drawnElement.value)
  }
    }
  catch(error) {
    console.log('catch ' + error.toString())
  }
  finally {
    driver.sleep(10000);
    // driver.quit();
    console.log('end of finally block')
  }
})();
// filename.click();
// driver.quit();
