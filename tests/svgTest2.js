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
const { Builder, By, Key, until } = require('selenium-webdriver'),
  { describe, it, after, before } = require('selenium-webdriver/testing');
let driver =  new Builder().forBrowser('firefox').build();
driver.manage().setTimeouts({implicit: 20000});

    driver.get('http://localhost:8081/');
    console.log('page');

driver.sleep(10000);
      driver.findElement(By.id('image_file')).sendKeys('/Users/jrichardflood/RubymineProjects/svg-detailer/tests/images/testImage.jpg');
  // }, 10000);
//   driver.wait(function() {
driver.sleep(10000);
this.buttons();
  (async function buttons() {
    await driver.findElement(By.css('#b_line')).click();
    await driver.findElement(By.css('#b_rectangle')).click();
    await driver.findElement(By.css('#b_polyline')).click();
    await driver.findElement(By.css('#b_circle')).click();
    await driver.findElement(By.css('#b_cubic')).click();
    await driver.findElement(By.css('#b_polygon')).click();
    await driver.findElement(By.css('#b_ellipse')).click();
    await driver.findElement(By.css('#b_quadratic')).click();
    return false;
});
