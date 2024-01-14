let uploadedJson = {};
let seleniumJson = {};
let stop = true;
let playback = false;
let autoPublish = false;
let pauseMode = false;
let demoMode = false;
let curDocInfo = {};
let pageEntryArray = [];
let settings = { demoModeInterval: 1000, repeatMax: 1 };
let userEmail = "";

/**
 * Fetch Chrome Profile User Email
 */
chrome.identity.getProfileUserInfo(function (info) {
  userEmail = info.email;
  console.log("UserEmail : " + info.email);
  console.log("UserId : " + info.id);
});

/**
 * Run on installed
 */
chrome.runtime.onInstalled.addListener(function () {
  console.log("*Background* - Extension Installed");

  chrome.storage.local.get(["database", "settings"], function (value) {
    if (!value.database) {
      chrome.storage.local.set({ database: [] });
    }

    if (!value.settings) {
      console.log("Initailize settings");
      let defaultSettings = { demoModeInterval: 1000, repeatMax: 1 };
      chrome.storage.local.set({ settings: defaultSettings });
    }
  });

  chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { pathContains: "" },
          }),
        ],
        actions: [new chrome.declarativeContent.ShowPageAction()],
      },
    ]);
  });
});

/**
 * save all global variables when background page goes inactive
 */
chrome.runtime.onSuspend.addListener(function () {
  saveStateToLocalStorage();
});

/**
 * get states, settings from local storage when background loaded
 */
chrome.storage.local.get(["state", "settings"], function (value) {
  if (value.state) {
    loadStateFromLocalStorage(value.state);
  } else {
    saveStateToLocalStorage();
  }

  if (value.settings) {
    loadSettingsFromlocalStorage(value.settings);
  }
});

function updateProfileUser() {
  chrome.identity.getProfileUserInfo(function (info) {
    userEmail = info.email;
    console.log("UserEmail : " + info.email);
    console.log("UserId : " + info.id);
  });
}

/**
 * save all global variables to local storage
 * IMPROVE: so far, only page init and bacgkround page inactive call this method
 */
function saveStateToLocalStorage() {
  var state = {
    uploadedJson,
    seleniumJson,
    stop,
    playback,
    autoPublish,
    pauseMode,
    demoMode,
    curDocInfo,
    pageEntryArray,
  };
  chrome.storage.local.set({ state }, function () {
    console.log("*Background* - Save State to local storage");
  });
}

/**
 * set global variables for state
 */
function loadStateFromLocalStorage(state) {
  uploadedJson = state.uploadedJson;
  seleniumJson = state.seleniumJson;
  stop = state.stop;
  playback = state.playback;
  autoPublish = state.autoPublish;
  pauseMode = state.pauseMode;
  demoMode = state.demoMode;
  curDocInfo = state.curDocInfo;
  pageEntryArray = state.pageEntryArray;
}

/**
 * set global variables for settings
 */
function loadSettingsFromlocalStorage(value) {
  settings = value;
}

function saveSettingsToLocalStorage() {
  chrome.storage.local.set({ settings }, function () {
    console.log("*Background* - Save Settings to local storage");
  });
}

/**
 * @return extension version from manifest
 */
function getExtensionVersion() {
  return chrome.app.getDetails().version;
}

/**
 * handle received message from popup page or content script (init_proxy)
 */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "start_clicked_in_popup") {
    startRecording();
  } else if (request.message.includes("playback_called_from_popup")) {
    setDataForPlaybackFromPopUp(request);
  } else if (request.message === "reset_called_from_popup") {
    resetExtension();
  } else if (request.message === "FROM_RECORD") {
    setDataForRecordingFromPage(request);
  } else if (
    request.message === "FROM_RECORD_DOWNLOAD" ||
    request.message === "download_clicked_in_popup"
  ) {
    AttachmentUtil.checkHasAttachmentAndDownload();
  } else if (
    request.message === "save_clicked_from_popup" ||
    request.message === "FROM_RECORD_SAVE"
  ) {
    saveJsonToLocalStorage(request.data);
  } else if (
    request.message === "FROM_RECORD_COMPLETE" ||
    request.message === "stop_clicked_in_popup" ||
    request.message === "FROM_PAGE_CONFIRM_BOX_STOP_DOWNLOAD"
  ) {
    stopRecording();
  } else if (request.message === "FROM_PLAYBACK_COMPLETE") {
    completePlayback();
  } else if (String(request.message).includes("FROM_PAGE_ERROR")) {
    errorNotification(request.message);
  } else if (request.message === "GET_STATUS") {
    sendResponse({
      stop: stop,
      playback: playback,
      playbackJson: uploadedJson,
      curDocInfo,
    });
  } else if (
    request.message === "DISGARD_RECORD_OR_PLAYBACK" ||
    request.message === "FROM_PAGE_CONFIRM_BOX_NO"
  ) {
    disregardCurrentOperation();
  } else if (request.message === "FROM_PAGE_INIT") {
    analyzePageInitInfo(request, sendResponse);
  } else if (request.message === "FROM_PAGE_CONFIRM_BOX_YES") {
    handleConfirmBoxYes(sendResponse);
  } else if (request.message === "FROM_PAGE_START_PLAYBACK_RECIPIENT") {
    startPlaybackInRecipientMode();
  } else if (request.message === "get_selenium_actions_called") {
    writeSeleniumActions(request);
  } else if (request.message === "FROM_PAGE_LOG") {
    console.log(request.data.msg);
  } else if (request.message === "OPEN_OPTION_PAGE_EDITOR") {
    openJsonEditorFromOptionPage();
  } else if (request.message === "OPEN_OPTION_PAGE_JSON_LIST") {
    loadSavedJsonListFromOptionPage();
  } else if (request.message === "options_page_settings_changed") {
    settings = request.obj;
  } else if (request.message === "GET_USER_EMAIL") {
    updateProfileUser();
    sendResponse({ userEmail: userEmail });
  } else if (request.message === "REPEAT_MAX_CHANGE") {
    settings.repeatMax = request.data > 0 ? request.data : 0;
    saveSettingsToLocalStorage();
  } else if (request.message === "FROM_PAGE_MAPPING_REPORT_BOX_YES") {
    // create report and download
    handleMappingReportBoxYes(sendResponse);
  }
});

function saveJsonToLocalStorage(data) {
  console.log(saveJsontoLocalStorage);
  console.log(seleniumJson);
  console.log(data);

  var fileName = data.fileName;

  const newFile = {
    fileName,
    Date: new Date().getTime(),
    seleniumJson,
  };

  chrome.storage.local.get(["database"], function (res) {
    if (res.database) {
      saveJsonArrayToLocalStorage([newFile, ...res.database]);
    } else {
      saveJsonArrayToLocalStorage([newFile]);
    }
  });

  if (data.stop) {
    clearGlobalVariables();
    seleniumJson = {};
    saveStateToLocalStorage();

    if (data.viewer == "In") {
      sendMessageToProxy("DISGARD_RECORD_OR_PLAYBACK", {
        code: "disregardRecordOrPlayback();",
      });
    }
  }
}

function saveJsonArrayToLocalStorage(jsonArray) {
  chrome.storage.local.set({ database: jsonArray }, function () {
    console.log("*Background* - Save JSON to local storage");
  });
}

function resetExtension() {
  console.log("*Background* - Received message to reset. Reset extension.");
  clearGlobalVariables();
  saveStateToLocalStorage();
}

function openJsonEditorFromOptionPage() {
  chrome.runtime.openOptionsPage(() => {
    chrome.runtime.sendMessage({ message: "Open_Json_Editor" });
  });
}

function loadSavedJsonListFromOptionPage() {
  chrome.runtime.openOptionsPage(() => {
    console.log("*Background* - open option page - json list");
    setTimeout(() => {
      chrome.runtime.sendMessage({ message: "Open_Saved_Json_List" });
    }, 100);
  });
}

function analyzePageInitInfo(request, sendResponse) {
  curDocInfo = request.data;

  sendSettingsToPage();
  saveStateToLocalStorage();

  if (!stop && !playback) {
    if (isRecordingInSameTransaction()) {
      if (isInRecipientMode()) {
        sendResponse({ message: "open_confirm_dialog_recipient" });
      } else {
        sendResponse({ message: "open_confirm_dialog_same_transaction" });
      }
    } else {
      sendResponse({ message: "open_confirm_dialog_diff_transaction" });
    }
  }

  if (playback && stop) {
    if (isPlaybackInSameTransaction() || !uploadedJson.meta.transRefId) {
      var dataToSend = {
        json: uploadedJson,
        pause: pauseMode,
        demo: demoMode,
        publish: autoPublish,
      };
      sendResponse({ message: "sendData_playback", data: dataToSend });
    } else {
      console.log("*Background* - Wrong transaction, playback stopped");
      sendMessageToProxy("playback_in_wrong_transaction", {
        code: "msgBox.printErrorMessage(9)",
      });
      playback = false;
    }
  }
}

function sendSettingsToPage() {
  sendMessageToProxy("page_init_settings", { settings });
}

function handleConfirmBoxYes(sendResponse) {
  if (!stop && isRecordingInSameTransaction()) {
    console.log("*Background* - Recording in process, send data to page");
    var dataToSend = { json: seleniumJson };
    sendResponse({ message: "sendData_record", data: dataToSend });
  }
}

function isRecordingInSameTransaction() {
  return (
    curDocInfo &&
    seleniumJson.meta &&
    parseInt(seleniumJson.meta.companyId) === parseInt(curDocInfo.companyId) &&
    seleniumJson.meta.transactionName === curDocInfo.transactionName
  );
}

function isPlaybackInSameTransaction() {
  return (
    curDocInfo &&
    uploadedJson.meta &&
    (uploadedJson.meta.transactionName === curDocInfo.transactionName ||
      uploadedJson.meta.transRefId === curDocInfo.transRefId)
  );
}

function isInRecipientMode() {
  return (
    curDocInfo &&
    curDocInfo.status >= 15 &&
    !seleniumJson.pages_recipient.length &&
    seleniumJson.sendPanelInfo
  );
}

function handleMappingReportBoxYes(sendResponse) {
  console.log("*Background* - Generate Mapping Report, send LP data to page");
  var dataToSend = { json: seleniumJson };
  sendResponse({ message: "sendData_seleniumJson", data: dataToSend });
}

function clearGlobalVariables() {
  playback = false;
  stop = true;
  autopublish = false;
  pauseMode = false;
  demoMode = false;
}

function errorNotification(message) {
  console.log("*Background* - " + message);
  playback = false;
}

function disregardCurrentOperation() {
  clearGlobalVariables();
  seleniumJson = {};
  uploadedJson = {};
  saveStateToLocalStorage();
}

function startRecording() {
  console.log("*Background* - Received request to start recording.");
  clearGlobalVariables();
  stop = false;
  saveStateToLocalStorage();
}

function stopRecording() {
  console.log("*Background* - Received stop recording request");
  AttachmentUtil.checkHasAttachmentAndDownload().then(() => {
    clearGlobalVariables();
    seleniumJson = {};
    saveStateToLocalStorage();
    sendMessageToProxy("download_completed_in_background");
  });
}

function completePlayback() {
  console.log("*Background* - Playback complete. Reset extension");
  clearGlobalVariables();
  saveStateToLocalStorage();
}

/**
 * currently only support one recipient playback
 */
function startPlaybackInRecipientMode() {
  setTimeout(() => {
    if (uploadedJson.sendPanelInfo) {
      var sigData = uploadedJson.sigData;
      var user;

      //IMPROVE:  need better way to determine user when supporting multiple recipients playback
      if (sigData.length) {
        user = sigData[0].user;
      } else {
        if (curDocInfo.viewer === "responsive") {
          user = uploadedJson.sendPanelInfo.recipientEmail;
        } else {
          var recipientList = uploadedJson.sendPanelInfo.recipientList2;

          if (recipientList.length) {
            for (var i = 0; i < recipientList.length; i++) {
              if (
                recipientList[i].level === 1 &&
                recipientList.email !== "system-workflow"
              ) {
                user = recipientList[i].email;
                break;
              }
            }
          }
        }
      }

      if (user) {
        console.log("*Background* - Recipient: " + user);

        const APItoken = "77f3ffd6d62e4cb08c4624d9bd2c7b97";
        const link = `https://api.mailinator.com/api/inbox?to=${user}&token=${APItoken}&private_domain=true`;

        return fetch(link)
          .then((res) => res.json())
          .then((json) => json.messages)
          .then((messages) => messages[messages.length - 1].id)
          .then((id) => {
            const link2 = `https://api.mailinator.com/api/email?id=${id}&token=${APItoken}&private_domain=true`;
            return fetch(link2)
              .then((res) => res.json())
              .then((json) => json.data.parts[0])
              .then((html) =>
                new DOMParser().parseFromString(html.body, "text/html")
              )
              .then((dom) => {
                let url;
                dom.querySelectorAll("a").forEach((e) => {
                  if (e.href.includes("agreementexpress.net")) {
                    url = e.href;
                  }
                });
                return url;
              })
              .then((launchLink) => {
                if (launchLink) {
                  chrome.tabs.create({ url: launchLink });
                }
              });
          });
      } else {
        console.error("Recipient email not found");
      }
    }
  }, 3500);
}

//======================Playback for other options============================

function openAEXPageInNewTab(
  serverURL,
  messageToSend,
  username,
  password,
  callback
) {
  chrome.tabs.create({ url: serverURL }, function (tab) {
    tabId = tab.id;
    setTimeout(() => {
      var dataToSend = {
        id: username,
        pin: password,
        meta: uploadedJson.meta,
      };
      chrome.tabs.sendMessage(
        tab.id,
        {
          message: messageToSend,
          data: dataToSend,
        },
        callback()
      );
    }, 3000);
  });
}

function openMV2AndStartTransaction(
  serverURL,
  username,
  password,
  message1,
  message2
) {
  setTimeout(() => {
    openAEXPageInNewTab(serverURL, message1, username, password, function () {
      setTimeout(() => {
        chrome.tabs.sendMessage(tabId, {
          message: message2,
          data: { meta: uploadedJson.meta },
        });
      }, 3000); //wait for page to display after login
    });
  }, 1000); //ready to open MV2
}

function sendPlaybackDataToProxy(request) {
  var dataToSend = {
    publish: request.data.publish,
    json: uploadedJson,
    pause: request.data.pause,
    demo: request.data.demo,
  };

  sendMessageToProxy(request.message, dataToSend);
}

function sendMessageToProxy(messageToSend, dataToSend) {
  if (!dataToSend) {
    dataToSend = {};
  }

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs.length) {
      chrome.tabs.sendMessage(tabs[0].id, {
        message: messageToSend,
        data: dataToSend,
      });
    }
  });
}

function startPlaybackInSIMQ(request) {
  console.log("*Background* - Received playback request in SIMQ.");
  openAEXPageInNewTab(
    request.data.url,
    request.data.subMessage,
    request.data.login,
    request.data.pin,
    function () {}
  );
}

function startPlaybackInMV2(request) {
  console.log("*Background* - Received playback request in MV2.");
  var messageThirdLevel =
    request.message == "playback_called_from_popup_Ivari"
      ? "open_ivari_transaction"
      : "open_MV2_transaction";
  openMV2AndStartTransaction(
    request.data.url,
    request.data.login,
    request.data.pin,
    request.data.subMessage,
    messageThirdLevel
  );
}

function setDataForPlaybackFromPopUp(request) {
  console.log("*Background* - Received playback request");
  clearGlobalVariables();
  playback = true;
  autoPublish = request.data.publish;
  pauseMode = request.data.pause;
  demoMode = request.data.demo;
  AttachmentUtil.attachmentList = [];
  saveStateToLocalStorage();
  analyseUploadedFile(request);
}

function analyseUploadedFile(request) {
  if (
    request.message === "playback_called_from_popup_Current_Page_localStorage"
  ) {
    uploadedJson = request.data.file;
    dataReadyAndStartPlayback(request);
  } else {
    var uploadedFile = request.data.file;
    if (uploadedFile.options.type === "application/zip") {
      AttachmentUtil.unzipFileToAttachmentList(uploadedFile).then(
        (success) => {
          dataReadyAndStartPlayback(request);
          if (AttachmentUtil.attachmentList.length > 0) {
            AttachmentUtil.uploadAttachmentUsingAPI();
          }
        },
        (fail) => {
          notifyPageAndDisplayErrorMessage(fail);
        }
      );
    } else {
      uploadedJson = uploadedFile.dataURL;
      dataReadyAndStartPlayback(request);
    }
  }
}

function dataReadyAndStartPlayback(request) {
  if (
    request.message.includes("playback_called_from_popup_Current_Page") ||
    request.message.includes("SKIP_LOGIN")
  ) {
    sendPlaybackDataToProxy(request);
  } else if (
    request.message.includes("MV2") ||
    request.message.includes("Ivari")
  ) {
    startPlaybackInMV2(request);
  } else if (request.message.includes("SIMQ")) {
    startPlaybackInSIMQ(request);
  }
}

function notifyPageAndDisplayErrorMessage(errorMessage) {
  if (errorMessage == "noJSON") {
    sendMessageToProxy("playback_error_noJSON");
  } else {
    sendMessageToProxy("playback_error_general");
  }
}

function setDataForRecordingFromPage(request) {
  seleniumJson = request.data.json;
  stop = request.data.status;
  pageEntryArray = request.data.page;
  curDocInfo = request.data.docInfo;
}

function writeSeleniumActions(request) {
  console.log(
    "*Background* - Received message to get selenium actions from current page."
  );
  console.log("*Background* - Getting data for selenium actions");
  console.log(request.data.json);
  var arr = [];
  var o = request.data.json;
  if (o != undefined) {
    arr = parseJson(o);
    console.log("*Background* - Parsed content: \n" + arr);

    var blob = new Blob(Array(arr), { type: "text/plain" });
    var url = URL.createObjectURL(blob);
    var fileName = o.meta.transactionName + ".java";
    chrome.downloads.download({
      url: url,
      filename: fileName,
    });
  }
}

function isEmpty(str) {
  return !str || 0 === str.length;
}

/**
 * use to save record as java file
 */

function parseJson(obj) {
  //var obj = JSON.parse(file);
  let code =
    "\tpublic SetupResult<AgreementViewerSteps> setUp() {\n " +
    "\t\tCredential credential = getCredential();\n" +
    "\t\tAgreementViewerSteps steps = new AgreementViewerSteps(getDriver(), currentBrowser);\n" +
    '\t\tsteps.loginWithCredentials(applicationUrl, credential, "' +
    obj.meta.companyName +
    '");\n' +
    '\t\tsteps.startNewAction("' +
    obj.meta.transactionName +
    '");\n' +
    "\t\treturn new SetupResult<>(steps, null, getSubjectText(), credential);\n" +
    "\t}\n" +
    "\t@Test\n\tpublic void test() {\n\t\tAgreementViewerSteps steps = setUp().getSteps();";
  var arr = [];
  //arr[0] = code;
  console.log("*Background* - Generating selenium actions:");
  console.log("*Background* - Pages Lenght: " + obj.pages.length);
  for (var j = 0; j < obj.pages.length; j++) {
    var fields = obj.pages[j].entries;
    for (var i = 0; i < fields.length; i++) {
      const byLocator = isEmpty(fields[i].name) ? "id" : "name";
      if (fields[i].isDisabled || fields[i].isAssert) {
        if (
          fields[i].options !== "PLACE_TEXT_HERE" &&
          !isEmpty(fields[i].options)
        ) {
          if (
            fields[i].name !== "No name" &&
            fields[i].tagName === "INPUT" &&
            fields[i].type === "radio"
          ) {
            arr.push(
              `\t\tassertEquals(steps.isRadioButtonSelected(By.${byLocator}("${fields[i].name}")), ${fields[i].options});`
            );
          } else if (
            fields[i].name !== "No name" &&
            fields[i].tagName === "INPUT" &&
            fields[i].type === "checkbox"
          ) {
            arr.push(
              `\t\tassertTrue(steps.isCheckboxChecked(By.${byLocator}("${fields[i].name}")));`
            );
          } else if (
            fields[i].name !== "No name" &&
            fields[i].tagName === "INPUT"
          ) {
            arr.push(
              `\t\tassertEquals(steps.getTextFromElement(By.${byLocator}("${fields[i].name}")), "${fields[i].options}"));`
            );
          } else if (
            fields[i].name !== "No name" &&
            fields[i].tagName === "SELECT"
          ) {
            arr.push(
              `\t\tassertEquals(steps.getSelectedValueFromSelectField(By.${byLocator}("${fields[i].name}")), "${fields[i].options}"));`
            );
          }
        }
      } else {
        if (
          fields[i].name !== "No name" &&
          fields[i].tagName === "INPUT" &&
          fields[i].isDate
        ) {
          arr.push(
            `\t\tsteps.selectDateFromDatePicker(By.${byLocator}("${fields[i].name}"), "ENTER_DATE_HERE");`
          );
        } else if (
          fields[i].name !== "No name" &&
          fields[i].tagName === "INPUT" &&
          fields[i].type === "radio"
        ) {
          arr.push(
            `\t\tsteps.selectRadioButton(By.${byLocator}("${fields[i].name}"), ${fields[i].options});`
          );
        } else if (
          fields[i].name !== "No name" &&
          fields[i].tagName === "INPUT" &&
          fields[i].type === "checkbox"
        ) {
          arr.push(
            `\t\tsteps.clickElement(By.${byLocator}("${fields[i].name}"));`
          );
        } else if (
          fields[i].name !== "No name" &&
          fields[i].tagName === "INPUT"
        ) {
          arr.push(
            `\t\tsteps.enterTextInTextfield(By.${byLocator}("${fields[i].name}"), "${fields[i].options}");`
          );
        } else if (
          fields[i].name !== "No name" &&
          fields[i].tagName === "SELECT"
        ) {
          arr.push(
            `\t\tsteps.selectValueFromSelectField(By.${byLocator}("${fields[i].name}"), "${fields[i].options}");`
          );
        } else if (fields[i].name !== "No name" && fields[i].tagName === "A") {
          arr.push(
            `\t\tsteps.clickElement(By.${byLocator}("${fields[i].name}"));`
          );
        }
      }
    }
  }

  //arr = arr.sort(function(a, b) { return a.pos < b.pos });
  //arr = arr.reduce(function(a,b){if(a.indexOf(b)<0)a.push(b);return a;},[]);
  arr.push("\t\n}");
  arr.unshift(code);
  return arr.join("\n");
}

//=======================attachment utilities=====================

class AttachmentUtil {}

AttachmentUtil.attachmentList = [];
AttachmentUtil.running = false;
AttachmentUtil.viewableTypes = [".jpg", ".png", ".gif", ".jpeg"];
AttachmentUtil.documentType = [
  "pdf",
  "tiff",
  "tif",
  "png",
  "jpg",
  "jpeg",
  "doc",
  "docx",
  "gif",
  "rtf",
  "ppt",
  "xls",
];

AttachmentUtil.getAttachmentList = function () {
  if (AttachmentUtil.running)
    return new Promise((resolve, reject) => {
      reject("AttachmentUtil is already running");
    });
  if (!curDocInfo.docID)
    return new Promise((resolve, reject) => {
      reject("Unable to locate docID");
    });

  AttachmentUtil.running = true;
  AttachmentUtil.attachmentList = [];
  const link = `${curDocInfo.serverOrigin}/Html5Controller?cmd=getDocuments&guid=${curDocInfo.docID}`;
  return fetch(link)
    .then((res) => res.json())
    .then((array) => array.filter((doc) => doc.isAttachment == "1"))
    .then((attachments) => {
      const promises = attachments.map((attachment) =>
        AttachmentUtil.saveAttachmentToList(attachment)
      );
      return Promise.all(promises);
    })
    .then(() => {
      AttachmentUtil.running = false;
      return AttachmentUtil.attachmentList;
    });
};

AttachmentUtil.saveAttachmentToList = function (attachment) {
  return fetch(AttachmentUtil.getAttachmentLink(attachment))
    .then((res) => res.blob())
    .then((blob) => {
      return {
        file: blob,
        displayName: attachment.displayName,
        fileName: attachment.documentName,
        options: {
          type: blob.type,
        },
        isRaw: attachment.isRawAttachment == "1",
      };
    })
    .then((fileObject) => AttachmentUtil.attachmentList.push(fileObject));
};

AttachmentUtil.isImageAttachment = function (fileName) {
  return AttachmentUtil.viewableTypes.some((type) =>
    fileName.toLowerCase().endsWith(type)
  );
};

AttachmentUtil.isDocumentTypeAttachment = function (fileName) {
  return AttachmentUtil.documentType.some((type) =>
    fileName.toLowerCase().endsWith(type)
  );
};

AttachmentUtil.getAttachmentLink = function (attachment) {
  return AttachmentUtil.isImageAttachment(attachment.documentName)
    ? `${curDocInfo.serverOrigin}/Html5Controller?cmd=getImg&page=1&guid=${attachment.guid}`
    : `${curDocInfo.serverOrigin}/Html5Controller?cmd=getAttachmentPDF&userEmail=${curDocInfo.currentUser}&guid=${attachment.guid}`;
};

AttachmentUtil.checkHasAttachmentAndDownload = function () {
  return AttachmentUtil.getAttachmentList().then(
    (attachmentList) => {
      AttachmentUtil.attachmentList = attachmentList;

      if (attachmentList.length > 0) {
        AttachmentUtil.convertToZipAndDownload();
      } else {
        AttachmentUtil.downloadJsonToComputer();
      }
    },
    () => {
      AttachmentUtil.downloadJsonToComputer();
    }
  );
};

AttachmentUtil.convertToZipAndDownload = function () {
  var zip = new JSZip();
  AttachmentUtil.attachmentList.forEach((attachment) => {
    var attachmentInfo = {
      fileName: attachment.fileName,
      displayName: attachment.displayName,
      type: attachment.options.type,
      isRaw: attachment.isRaw,
      refId: AttachmentUtil.generateUniqueId(),
    };
    seleniumJson.attachmentList.push(attachmentInfo);
    zip.file(attachmentInfo.refId, attachment.file, { base64: true });
  });

  var name =
    seleniumJson.meta.transactionName != ""
      ? seleniumJson.meta.transactionName
      : seleniumJson.meta.transactionFolderName != ""
      ? seleniumJson.meta.transactionFolderName
      : "selenium";
  name = name.replace(/\//g, "_");

  zip.file(name + ".json", JSON.stringify(seleniumJson, null, 2));

  zip.generateAsync({ type: "blob" }).then(function (content) {
    saveAs(content, name + ".zip");
  });
};

//replaced this function with fileSaver saveAs()
AttachmentUtil.download = function (filename, content, type) {
  var element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/" + type + ";charset=utf-8," + encodeURIComponent(content)
  );
  element.setAttribute("download", filename);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

AttachmentUtil.downloadJsonToComputer = function () {
  console.log("*Background* - Received message to download");
  console.log("*Background* - creating json");

  if (seleniumJson.meta) {
    var json = JSON.stringify(seleniumJson, null, 2);
    var blob = new Blob([json], { type: "application/json" });
    saveAs(blob, AttachmentUtil.generateFileName() + ".json");
  }
};

AttachmentUtil.generateFileName = function () {
  var name = "selenium";
  var meta = seleniumJson.meta;

  if (meta && meta.transRefId && meta.transRefId !== "") {
    name = "";
    if (meta.companyName !== "") {
      name += meta.companyName.split(" ")[0] + " - ";
    }

    name += meta.transRefId;

    if (meta.isCompound && meta.otherTransaction.length) {
      meta.otherTransaction.forEach((transRefId) => {
        if (name.length < 200) {
          name += "+" + transRefId;
        }
      });
    }
  }

  return name;
};

AttachmentUtil.generateUniqueId = function () {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

AttachmentUtil.convertfileToJson = function (file) {
  return new Promise((resolve, reject) => {
    var fr = new FileReader();
    fr.onload = function (e) {
      resolve(JSON.parse(e.target.result));
    };
    fr.readAsText(file);
  });
};

AttachmentUtil.getArrayBufferFromDataUrl = function (dataurl) {
  var arr = dataurl.split(","),
    bstr = atob(arr[1]),
    n = bstr.length,
    u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return [u8arr];
};

AttachmentUtil.deserializeFile = function (file) {
  return new File(
    AttachmentUtil.getArrayBufferFromDataUrl(file.dataURL),
    file.name,
    file.options
  );
};

AttachmentUtil.readFileToJson = function (file) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      resolve(JSON.parse(e.target.result));
    };
    fileReader.readAsText(file);
  });
};

AttachmentUtil.unzipFileToAttachmentList = function (uploadedFile) {
  uploadedJson = {};
  var zipFile = AttachmentUtil.deserializeFile(uploadedFile);
  return JSZip.loadAsync(zipFile)
    .then((data) => {
      var fileArray = [];
      for (var k in data.files) {
        fileArray.push(data.files[k]);
      }

      const promises = [];
      fileArray.forEach((file) => {
        if (file.name.split(".")[1] == "json") {
          const promise = file.async("text").then((filedata) => {
            return (uploadedJson = JSON.parse(filedata));
          });
          promises.push(promise);
        } else {
          const promise = file.async("blob").then((fileData) => ({
            type: "attachment",
            fileData,
            name: file.name,
          }));
          promises.push(promise);
        }
      });

      return Promise.all(promises);
    })
    .then((dataList) => {
      //reject if zip file does not contain JSON file
      if (!uploadedJson.meta) {
        return Promise.reject("noJSON");
      }

      if (dataList && dataList.length > 0) {
        dataList
          .filter((obj) => obj.type === "attachment")
          .forEach((attachment) => {
            const attachmentInfo = uploadedJson.attachmentList.filter(
              ({ refId }) => refId === attachment.name
            );

            if (attachmentInfo.length > 0) {
              attachmentInfo[0].file = new File(
                [attachment.fileData],
                attachmentInfo[0].fileName,
                attachmentInfo[0].options
              );
            }
            AttachmentUtil.attachmentList.push(attachmentInfo[0]);
          });
      }
    });
};

//Does not work well when uploading multiple attachments at the same time using CORE API
AttachmentUtil.uploadAttachmentUsingAPI_old = function () {
  var attachmentList = AttachmentUtil.attachmentList;
  const promiseList = [];
  attachmentList.forEach((attachment) => {
    const formData = new FormData();
    formData.append("attachment0", attachment.file);
    const link = `${
      curDocInfo.serverOrigin
    }/Html5Controller?cmd=addAttachment&companyId=${
      uploadedJson.meta.companyId
    }&guid=${curDocInfo.docID}&userName=${curDocInfo.currentUser}&rawUpload=${
      attachment.isRaw
    }&documentType=&documentGroup=&attachmentName=${
      attachment.displayName
    }&date=${Date.now()}`;

    const promise = fetch(link, {
      method: "POST",
      body: formData,
    })
      .then((res) => res.text())
      .then((text) => {
        const resArr = text.split("|,");
        const success = resArr[0].split("=")[1] === "success";
        if (!success)
          console.error(
            `*Background* - Failed to upload ${
              attachment.displayName
            }; Attachment Type: ${attachment.isRaw ? "File" : "Document"}.`
          );
        return {
          success,
          name: attachment.displayName,
          isRaw: attachment.isRaw,
          response: resArr[1],
        };
      });
    promiseList.push(promise);
  });
  return Promise.all(promiseList).then((resultList) => {
    const successNumber = resultList.filter((result) => result.success).length;
    console.log(
      `*Background* - Attachment Uploaded, ${successNumber} succeeded, ${
        resultList.length - successNumber
      } failed, ${resultList.length} in total.`
    );
    return resultList;
  });
};

AttachmentUtil.uploadAttachmentUsingAPI = function () {
  var attachmentList = AttachmentUtil.attachmentList;
  attachmentList.forEach((attachment, index) => {
    // add 0.5 seconds between each upload
    setTimeout(() => {
      const formData = new FormData();
      formData.append("attachment0", attachment.file);
      const link = `${
        curDocInfo.serverOrigin
      }/Html5Controller?cmd=addAttachment&companyId=${
        uploadedJson.meta.companyId
      }&guid=${curDocInfo.docID}&userName=${curDocInfo.currentUser}&rawUpload=${
        attachment.isRaw
      }&documentType=&documentGroup=&attachmentName=${
        attachment.displayName
      }&date=${Date.now()}`;

      fetch(link, { method: "POST", body: formData })
        .then((res) => res.text())
        .then((text) => {
          const resArr = text.split("|,");
          const success = resArr[0].split("=")[1] === "success";
          if (!success)
            console.error(
              `Failed to upload ${attachment.displayName}; Attachment Type: ${
                attachment.isRaw ? "File" : "Document"
              }.`
            );
          return {
            success,
            name: attachment.displayName,
            isRaw: attachment.isRaw,
            response: resArr[1],
          };
        });
    }, index * 500);
  });
};
