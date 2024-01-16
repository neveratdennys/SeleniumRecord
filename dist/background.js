let isRecording = false;
let recordedActions = [];

function generateSeleniumScript() {
    let url = 'http://localhost:3111'

    // Example JavaScript code content
    const prefixScript = `
    const { By, Builder } = require("selenium-webdriver");
    const assert = require("assert");
    
    (async function firstTest() {
      let driver;
    
      try {
        driver = await new Builder().forBrowser("chrome").build();
        await driver.get("${url}");
        await driver.manage().setTimeouts({ implicit: 15000 });
  `;

    // Lines to insert into the script
    const postfixScript = `
    } catch (e) {
      console.log(e);
    } finally {
      await driver.quit();
    }
    })();
  `;

    let actionScript = "";
    let implicitWait = "await driver.sleep(1000)\n"

    recordedActions.forEach((actionStep) => {
        actionLine = `await driver.findElement(By.id("${actionStep.id}"))`;

        if (actionStep.type != "input") {
            actionLine = actionLine + `.click();\n`;
        } else {
            actionLine = actionLine + `.sendKeys("${actionStep.value}");\n`;
        }

        actionScript = actionScript + actionLine + implicitWait;
    });

    // Combine the existing script with the lines to insert
    const modifiedScript = prefixScript + actionScript + postfixScript;

    // create blob and download
    const blob = new Blob([modifiedScript], { type: "application/javascript" });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = "modifiedScript.js";
    document.body.appendChild(link);
    link.click();

    // cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "startRecord" && !isRecording) {
        console.log("recording starts");
        isRecording = true;
        recordedActions = [];
    } else if (request.action === "stopRecord" && isRecording) {
        console.log("recording stop");
        isRecording = false;
        chrome.tabs.query(
            { active: true, currentWindow: true },
            function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "stopRecord",
                    recordedActions,
                });
            }
        );
        generateSeleniumScript();
    }
});

// Listen for messages from content scripts or other parts of the extension
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    // Check if the message is from a content script
    if (sender.tab && isRecording) {
        // Process the data received from the content script
        const receivedData = request.data;

        // log the data
        console.log(receivedData);

        if (receivedData.type == "click") {
            console.log("received click event");
            recordedActions.push(receivedData);
        } else if (receivedData.type == "input") {
            console.log("received input event");
            if (
                recordedActions[recordedActions.length - 1].type == "input" &&
                receivedData.id ==
                    recordedActions[recordedActions.length - 1].id
            ) {
                recordedActions.pop();
            }

            recordedActions.push(receivedData);
        }
    }
});
