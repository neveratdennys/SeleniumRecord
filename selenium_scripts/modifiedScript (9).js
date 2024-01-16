
    const { By, Builder, until } = require("selenium-webdriver");
    const assert = require("assert");
    
    (async function firstTest() {
      let driver;
    
      try {
        driver = await new Builder().forBrowser("chrome").build();
        await driver.get("http://localhost:3111");
    
        let title = await driver.getTitle();
        // assert.equal("Web form", title);
    
        await driver.manage().setTimeouts({ implicit: 15000 });


        let el1 = await driver.findElement(By.id("UDP_ID_7"))
        await el1.click();
        // await driver.wait(until.elementIsVisible(el1), 2000);
        await driver.sleep(1000)

        let el2 = await driver.findElement(By.id("UDP_ID_8"))
        await el2.click()
        await driver.sleep(1000)
  
    // assert.equal("Received!", value);
    } catch (e) {
      console.log(e);
    } finally {
      await driver.quit();
    }
    })();
  