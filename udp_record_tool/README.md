# Project Title

AEX Recording Tool

## Getting Started

AEX Recording tool can help to reduce the manual work for testing AEX template and workflows by recording and playing back the user inputs. 

This tool is developed as a Chrome extension. These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. 

### Prerequisites

Chrome browser

### Installing

1. clone the project from the repository to your local machine

2. Open Chrome and navigate to the Extension Management page chrome://extensions.
    * The Extension Management page can also be opened by clicking on the Chrome menu, hovering over More Tools then selecting Extensions.

3. Enable Developer Mode by clicking the toggle switch next to Developer mode.

4. Click the LOAD UNPACKED button and select the extension directory.

5. The extension has been successfully installed. You should see a AEX logo icon appearing next to the Chrome menu button.

## How it works?

The browser will show a full-color AEX logo page action icon in the browser toolbar after installation. A pop-up page contains below functions:

* Start Recording (only in Viewer)

* Stop Recording (only in Viewer)

* Download Saved JSON file

* Reset Extension

* Auto Publish

* Playback 

* Publish transactions through SIMQ, Self-service link, Salesforce or Ivari.

### Start Recording

Before you start input in the form, click START button. 

If you click START button while another recording is in progress, the previous recording will be lost and a new reocrding will start.

### Stop Recording

Click STOP button when you complete the recording. The tool will save all your input in a JSON file and download with name "YourTransactionName.json".

If the transaction name is not avaliable, the file will be named as "selenium.json".

### Auto Publish

The extension will autopublish the transaction after completing the playback. This is by default set to false. 

### Download Saved JSON file

This is used when the workflow redirect user to a non-AEX page during recording (Pop-up page is not availiable) or user accidently close the page without stop recording.

### Reset Extension

Reset Extension will clear all the saved data and reset the states of the extension.

### Publish transactions through SIMQ, Self-service link, Salesforce or Avari.

The tool provides different options for playing back and publish the transaction.

## How It Works?

The chrome extension exchanges message/data with the AEX pages via content script.

Extension (background.js, pop-up.js, option.js) <---> Content Script (init_proxy.js) <---> Injected Script (Content.js)

## Trouble Shooting

Please click RESET button to reset extension before you start a new recording/playback if an error/bug occurrs to your previous recording/playback.

## Versioning

1.0

## Authors

* **Lennart Becker** 
* **Jason Jia** 

## Contributors: 

* **Rongyi Chen**

## Change Log

Please see the changelog.md file for details

## CopyRight

Agreement Express 2018




