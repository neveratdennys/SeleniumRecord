let isRecording = false;
let recordedElements = [];

console.log("this is background page");

function generateSeleniumScript() {
  // Example JavaScript code content
  const prefixScript = `
    const { By, Builder } = require("selenium-webdriver");
    const assert = require("assert");
    
    (async function firstTest() {
      let driver;
    
      try {
        driver = await new Builder().forBrowser("chrome").build();
        await driver.get("https://www.selenium.dev/selenium/web/web-form.html");
    
        let title = await driver.getTitle();
        assert.equal("Web form", title);
    
        await driver.manage().setTimeouts({ implicit: 500 });
  `;

  // Lines to insert into the script
  const postfixScript = `
    assert.equal("Received!", value);
    } catch (e) {
      console.log(e);
    } finally {
      await driver.quit();
    }
    })();
  `;

  let actionScripts = "";

  recordedElements.forEach((element) => {
    let btn = `${element.id}_button`
    let line1  = `let ${btn} = await driver.findElement(By.id("${element.id}"));`;
    let line2 =  `await ${btn}.click();`;
    actionScripts = actionScripts + line1 + line2;
  });

  // Combine the existing script with the lines to insert
  const modifiedScript = prefixScript + actionScripts + postfixScript;

  // Create a Blob with the modified script
  const blob = new Blob([modifiedScript], { type: "application/javascript" });

  // Create a URL for the Blob
  const blobUrl = URL.createObjectURL(blob);

  // Create a download link
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = "modifiedScript.js";

  // Append the link to the document
  document.body.appendChild(link);

  // Trigger a click on the link to start the download
  link.click();

  // Remove the link from the document
  document.body.removeChild(link);

  // Clean up the Blob URL
  URL.revokeObjectURL(blobUrl);
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "startRecord" && !isRecording) {
    console.log("recording starts");
    isRecording = true;
    recordedElements = [];
  } else if (request.action === "stopRecord" && isRecording) {
    console.log("recording stop");
    isRecording = false;
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "stopRecord",
        recordedElements,
      });
    });
    generateSeleniumScript();
  }
});

// Listen for messages from content scripts or other parts of the extension
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log("this is in the background listener");

  // Check if the message is from a content script
  if (sender.tab && isRecording) {
    console.log("background script received a click save action");
    // Process the data received from the content script
    const receivedData = request.data;

    // Do something with the data, for example, log it
    console.log("Data received from content script:", receivedData);
    print(receivedData)
    recordedElements.push(receivedData);
    // printRecorded()
  }
});

function printRecorded() {
  console.log(recordedElements);
}
