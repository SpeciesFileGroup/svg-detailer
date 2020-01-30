/* test detailer interactions:
  config: npm install
          npm install -g selenium-webdriver
          npm install -g geckodriver
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
const { Builder, By, Key, until} = require('selenium-webdriver');
(async function example() {
  let driver = await new Builder().forBrowser('firefox').build();
  driver.manage().setTimeouts({implicit: 20000});
  try {
    await driver.get('http://localhost:8081/');
    console.log('page');
    driver.sleep(10000);
    await driver.findElement(By.id('image_file')).sendKeys('/Users/jrichardflood/RubymineProjects/svg-detailer/tests/images/testImage.jpg');
  //     await driver.findElement(By.css('#auto_file')).click();
    driver.sleep(10000);
    console.log('click line?');
    await driver.findElement(By.css('#b_line')).click();

    }
  finally {
    driver.sleep(10000);
    // driver.quit();
    console.log('end of finally block')
  }
})();
// filename.click();
// driver.quit();
