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
  try {
    await driver.get('http://localhost:8081/');
    // await driver.findElement(By.css('#image_file')).sendKeys(Key.ENTER);
    await driver.findElement(By.css('#image_file'));
  }
  finally {
    driver.sleep(10000);
    driver.quit();
    console.log('end of finally block')
  }
})();
// filename.click();
// driver.quit();
