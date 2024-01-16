
    const { By, Builder } = require("selenium-webdriver");
    const assert = require("assert");
    
    (async function firstTest() {
      let driver;
    
      try {
        driver = await new Builder().forBrowser("chrome").build();
        await driver.get("http://localhost:3111");
        await driver.manage().setTimeouts({ implicit: 15000 });
  await driver.findElement(By.id("UDP_ID_4")).click();
await driver.sleep(1000)
await driver.findElement(By.id("UDP_ID_3")).click();
await driver.sleep(1000)
await driver.findElement(By.id("UDP_ID_7")).click();
await driver.sleep(1000)
await driver.findElement(By.id("UDP_ID_8")).click();
await driver.sleep(1000)

    } catch (e) {
      console.log(e);
    } finally {
      await driver.quit();
    }
    })();
  