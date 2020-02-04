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
  let driver = await new Builder().forBrowser('firefox').build();
  // const actions = driver.actions();
  // let line_sequence = new actions(driver);
  // let mode = driver.findElement(By.id, 'mode');
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
    ////// ((JavascriptExecutor)driver).executeScript("function simulate(f,c,d,e){var b,a=null;for(b in eventMatchers)if(eventMatchers[b].test(c)){a=b;break}if(!a)return!1;document.createEvent?(b=document.createEvent(a),a==\"HTMLEvents\"?b.initEvent(c,!0,!0):b.initMouseEvent(c,!0,!0,document.defaultView,0,d,e,d,e,!1,!1,!1,!1,0,null),f.dispatchEvent(b)):(a=document.createEventObject(),a.detail=0,a.screenX=d,a.screenY=e,a.clientX=d,a.clientY=e,a.ctrlKey=!1,a.altKey=!1,a.shiftKey=!1,a.metaKey=!1,a.button=1,f.fireEvent(\"on\"+c,a));return!0} var eventMatchers={HTMLEvents:/^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,MouseEvents:/^(?:click|dblclick|mouse(?:down|up|over|move|out))$/}; " +
    //////   "simulate(arguments[0],\"mousemove\",arguments[1],arguments[2]);",LocatorFrom,xto,yto);
    // await driver.moveByOffset(100,100);
    // await driver.clickAndHold();
    // await driver.moveByOffset(300,300);
    // await driver.release();
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
