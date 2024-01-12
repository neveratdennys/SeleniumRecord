let uploadedJson = {};
let curDocInfo = {};
let database = [];
let htmlDom;
let workflowOption = 0;
let serverOption = 0;
let loginRequired = true;
let autoPublish = false;
let pauseMode = false;
let demoMode = false;
let emailDomain = "aexclienttest.net";

$(document).ready(function () {
  getStatusFromBackgroundPage();

  const btn1 = document.getElementById('startBtn');
  const btn2 = document.getElementById('stopBtn');
  const btn3 = document.getElementById('normalPlaybackBtn');
  const btn4 = document.getElementById('resetBtn');
  const btn5 = document.getElementById('downloadBtn');
  const btn6 = document.getElementById('mv2SimqPlaybackBtn');
  const btn7 = document.getElementById('selfServicePlaybackBtn');
  const btn8 = document.getElementById('salesforcePlaybackBtn');
  const btn9 = document.getElementById('ivariPlaybackBtn');
  const btn10 = document.getElementById('playbackBtn_Others');
  const btn11 = document.getElementById('searchEmail_Salesforce');
  const btn12 = document.getElementById('updateEmail_Salesforce');
  const btn13 = document.getElementById("goBackBtn");
  const btn14 = document.getElementById("disregardRecordBtn");
  const btn15 = document.getElementById("getSeleniumActionsBtn");
  const btn16 = document.getElementById("jsonListBtn");
  const btn17 = document.getElementById("jasonEditorBtn");
  const btn18 = document.getElementById("saveJsonConfirmBtn");
  const btn19 = document.getElementById("saveJsonBtn");
  const btn20 = document.getElementById("localStoragePlayback");
  const btn21 = document.getElementById("dataEntryWorkerBtn");
  const btn22 = document.getElementById("saveJsonConfirmBtnAndStop");
  const btn23 = document.getElementById("dataEntryWorkerBtn_inprogress");
  const btn24 = document.getElementById("CreateCSV");
  const btn25 = document.getElementById("CSVForBulkUploadAll");
  //const btn26 = document.getElementById("CSVForBulkUploadRequired");

  const toggleCheckbox1 = document.getElementById("msgbox_show");
  const toggleCheckbox2 = document.getElementById("pauseModeToggle");
  const toggleCheckbox3 = document.getElementById("demoModeToggle");
  const toggleCheckbox4 = document.getElementById("autoPublishToggle");

  const numberInput1 = document.getElementById("repeatMaxInput");

  const chkbox1 = document.getElementById('createNewTransactionCheckbox');
  const extensionVersion = getExtensionVersion();
  $('[data-toggle="tooltip"]').tooltip();

  //click btn1 to start recording
  btn1.addEventListener('click', () => startRecording());

  //click btn2 to stop the recording
  btn2.addEventListener('click', () => stopRecording());

  //click the btn3 to playback
  btn3.addEventListener('click', () => playbackFromCurrentPage());

  //click btn4 to reset the extension
  btn4.addEventListener('click', () => resetExtension());

  //click btn5 to download saved json
  btn5.addEventListener('click', () => downloadJsonFile());

  //click btn6789 to display other playback options
  btn6.addEventListener('click', () => displayContentByPlaybackType('publish_info_SIMQ_MV2', 1));
  btn7.addEventListener('click', () => displayContentByPlaybackType('publish_info_SelfService', 2));
  btn8.addEventListener('click', () => displayContentByPlaybackType('publish_info_Salesforce', 3));
  btn9.addEventListener('click', () => displayContentByPlaybackType('publish_info_Ivari', 4));

  //click btn10 to playback
  btn10.addEventListener('click', () => startPlayBackByOptions());

  //click btn11 to search emails in HTML for salesforse workflow
  btn11.addEventListener('click', () => searchEmailsInJsonAndDisplayInHTML());

  //click btn12 to replace all emails in JSON by user input
  btn12.addEventListener('click', () => updateEmailsInJsonByUserInput());

  //click btn13 to go back to main page
  btn13.addEventListener('click', () => displayMainPage());

  //click btn14 to disregard the record and playback and display mainpage
  btn14.addEventListener('click', () => disregardRecordPlayback());

  //click btn15 to get selenium actions from page
  btn15.addEventListener('click', () => getSeleniumActionsFromPage());

  //click btn16 to open option page - saved json list
  btn16.addEventListener('click', () => openOptionPageForSavedJsonList());

  //click btn17 to open option page - json editor
  btn17.addEventListener('click', () => openOptionPageForJsonEditor());

  //click btn18 to save json to local storage
  btn18.addEventListener('click', () => saveJsonToLocalStorage());

  //click btn19 to reset the confirm model dialog for save json file
  btn19.addEventListener('click', () => clearValueForSaveJsonConfirmDialog());

  //click btn20 to hide the playbackType model
  btn20.addEventListener('click', () => displaySavedJsonList());

  //click btn21, btn23 to start data entry worker (autofill)
  btn21.addEventListener('click', () => callDataEntryWorker());
  btn23.addEventListener('click', () => callDataEntryWorker());

  //click btn22 to save json to local storage and stop recording
  btn22.addEventListener('click', () => saveJsonToLocalStorage(true));

  //click btn24 to upload json for parsing
  btn24.addEventListener('click', () => uploadJsonFiles());

  //click btn26 to create csv file from all fields
  btn25.addEventListener('click', () => createCSVForBulkUploadFromAllFields());

  //click btn26 to create csv file from required fields
  //btn26.addEventListener('click', () => createCSVForBulkUploadFromRequiredFields());

  //Ivari checkbox
  chkbox1.addEventListener('click', () => hideOrShowIvariInput());

  //toggle checkbox1 to display message box
  toggleCheckbox1.onchange = (event) => sendMessageToProxyAndBackgroundPages("msgbox_toggle", { status: event.target.checked }, 2);

  //toggle checkbox2 to enable pause mode for playback
  toggleCheckbox2.onchange = function (event) { pauseMode = event.target.checked; };

  //toggle checkbox3 to enable demo mode for playback
  toggleCheckbox3.onchange = function (event) { demoMode = event.target.checked; };

  //toggle checkbox4 to auto publish after complete palyback
  toggleCheckbox4.onchange = function (event) { autoPublish = event.target.checked; };

  //update upload file name in text box
  document.getElementById("uploadFileElement").onchange = () => updateTextDisplayforUploadField();

  //select server dropdown
  addEventListenerForServerDropdownlist();

  //repeat max value has changed, notify background to save the value
  numberInput1.onchange = () => {
    if (numberInput1.value < 0) numberInput1.value = 0;
    sendMessageToProxyAndBackgroundPages("REPEAT_MAX_CHANGE", numberInput1.value, 1);
  }
  checkRepeatMax();

  //add version to popup
  document.querySelector("div#version small").innerHTML = "AEX Recording Tool " + extensionVersion;

  //display main page when playback completed
  chrome.runtime.onMessage.addListener(
    (request) => {
      if (request.message === "FROM_PLAYBACK_COMPLETE" || String(request.message).includes("FROM_PLAYBACK_ERROR")) {
        displayMainPage();
      }
    }
  );

  // check user email
  checkUserDomain();

});//end of Document ready function

/**
 * check if current page is MV2 or SIMQ document viewer to hide start/stop button
 * @param {*} inViewerFunction function will excute if current page in viewer
 * @param {*} notInViewerFunction function will excute if current page not in viewer
 */
function isCurrentPageDocumentViewer(inViewerFunction, notInViewerFunction) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var curURL = tabs[0].url;
    if ((String(curURL).includes(":8080") || String(curURL).includes("agreementexpress.net")) && (String(curURL).includes("viewer") || String(curURL).includes("workflow"))) {
      inViewerFunction();
    } else {
      notInViewerFunction();
    }
  });
}

/**
 * @return extension version from manifest
 */
function getExtensionVersion() {
  return chrome.app.getDetails().version;
}

/**
 * if not in viewer, disable start, play from current page buttons, and message box toggle button
 */
function disableButtonsIfNotInViewer() {
  document.getElementById("startBtn").disabled = true;
  document.getElementById("msgbox_show").disabled = true;
  document.getElementById("normalPlaybackBtn").disabled = true;
  document.getElementById("localStoragePlayback").disabled = true;
}

/**
 * start Recording, send message to background and page
 */
function startRecording() {
  console.log('hit here')
  sendMessageToProxyAndBackgroundPages("start_clicked_in_popup", { version: getExtensionVersion() }, 0);
  displayRecordInprogressPage();
}

/**
 * Stop Recording
 * If in viewer, send message to page, If not, send to background page
 */
function stopRecording() {
  isCurrentPageDocumentViewer(
    () => {
      sendMessageToProxyAndBackgroundPages("stop_clicked_in_popup", { code: "stopRecording()" }, 2);
      displayMainPage();
    },
    () => {
      sendMessageToProxyAndBackgroundPages("stop_clicked_in_popup", {}, 1);
      displayMainPage();
    }
  );
}

/**
 * download json file
 * If in viewer, send message to page, If not, send to background page
 */
function downloadJsonFile() {
  isCurrentPageDocumentViewer(
    () => {
      sendMessageToProxyAndBackgroundPages("download_clicked_in_popup", { code: "sendDataToExtensionForDownload()" }, 2);
    },
    () => {
      sendMessageToProxyAndBackgroundPages("download_clicked_in_popup", {}, 1);
    }
  );
}

/**
 * save json file to local storage, If in viewer, send message to page, If not, send to background page
 * @param stop if ture, stop recording after save 
 */
function saveJsonToLocalStorage(stop) {
  var fileName = document.getElementById("saveJsonFileName").value;

  if(fileName !== "") {
    document.getElementById("saveJsonModelCloseBtn").click();
    isCurrentPageDocumentViewer(
      () => {
        sendMessageToProxyAndBackgroundPages("save_clicked_from_popup", {fileName, stop, viewer: "In"}, 2);
      },
      () => {
        sendMessageToProxyAndBackgroundPages("save_clicked_from_popup", {fileName, stop, viewer: "Out"}, 1);
      }
    );

    if(stop){
      displayMainPage();
    }
  } else {
    document.getElementById("saveJsonModelWarning").style.display = "block";    
  }

}

/**
 * Upload multiple json files and parse through them.
 */
function uploadJsonFiles() {
  var fileElement = document.getElementById("uploadFileElement_JsonFiles");
  fileElement.click();
  fileElement.addEventListener('change', uploadFilesToConvertToCSV);
}

/**
 * reset the warning and input value for save json confirm dialog
 */
function clearValueForSaveJsonConfirmDialog() {
  document.getElementById("saveJsonFileName").value = "";
  document.getElementById("saveJsonModelWarning").style.display = "none";  
}

/**
 * call background page to find out recorder status
 */
function getStatusFromBackgroundPage() {
  chrome.runtime.sendMessage({ message: "GET_STATUS" }, (response) => {
    uploadedJson = response.playbackJson;
    curDocInfo = response.curDocInfo;
    
    if (response.stop && !response.playback) {
      displayMainPage();
    } else if (!response.stop && !response.playback) {
      displayRecordInprogressPage();
    } else if (response.stop && response.playback) {
      displayPlaybackInprogressPage();
    }
  });
}

/**
* Get User Email from backgroud page
*/
function checkUserDomain() {
  chrome.runtime.sendMessage({ message: "GET_USER_EMAIL" }, (response) => {
    userEmail = response.userEmail;
    console.log("UserEmail is : "+ response.userEmail);
       
    if (userEmail.includes("agreementexpress")) {
      document.getElementById("getSeleniumActionsBtn").style.display = "inline-block";
      document.getElementById("getSeleniumActionsBtn").parentNode.style.display = "inline-block";
      emailDomain = "qa.aexclienttest.net";
    }
    else{
      document.getElementById("getSeleniumActionsBtn").style.display = "none";
      document.getElementById("getSeleniumActionsBtn").parentNode.style.display = "none";
      emailDomain = "mailinator.com";
    }
  });
}

function checkRepeatMax() {
  chrome.storage.local.get(['settings'], function(res) {
    if (res.settings) {
      document.getElementById("repeatMaxInput").value = res.settings.repeatMax;
    } 
  })
}

/**
 * Grab the saved json list from local storage on load
 */
function getSavedJsonListFromLocalStorage() {
  chrome.storage.local.get(['database'], function (res) {
    if (res.database) {
      database = res.database;
    } else {
      database = [];
    }

    var filterredDB = database.filter(file => curDocInfo.transactionName && file.seleniumJson.meta && file.seleniumJson.meta.transactionName === curDocInfo.transactionName);

    function applyListenerToBootstrapTableButtons() {
      $(".jsonListBtn").off("click");
      $(".jsonListBtn").click(function(){
        var fileName = $(this).attr('fileName');
        var fileId = $(this).attr('fileId');
        var selectedFile = filterredDB.find(file => file.Date == fileId);    
    
        if(selectedFile.fileName === fileName) {
          var dataToSend = { publish: autoPublish, pause: pauseMode, demo: demoMode, file: selectedFile.seleniumJson };
          sendMessageToProxyAndBackgroundPages("playback_called_from_popup_Current_Page_localStorage", dataToSend, 1);
            window.close();
        } 
      })
    }

    $('#jsonListTable').bootstrapTable({
      columns: [
      {
        field: 'fileName',
        title: 'Name'
      }, 
      {
        field: 'operate',
        title: 'Select',
        align: 'center',
        valign: 'middle',
        clickToSelect: false,
        formatter : function(value, row) {
          return '<button class=\'btn btn-primary jsonListBtn \' fileName="'+row.fileName+'" fileId="'+ row.Date+'">Go</button>';
        }
      }],
      data: filterredDB,
      onSearch: applyListenerToBootstrapTableButtons,
      onPageChange: applyListenerToBootstrapTableButtons
    });      

    applyListenerToBootstrapTableButtons();

  });  
}

/**
 * disregard the record and playback and display mainpage
 */
function disregardRecordPlayback() {
  sendMessageToProxyAndBackgroundPages("DISGARD_RECORD_OR_PLAYBACK", { code: "disregardRecordOrPlayback();" }, 0);
  displayMainPage();
}

/**
 * get selenium java actions from current page
 */
function getSeleniumActionsFromPage() {
  var fileElement = document.getElementById("uploadFileElement_seleniumAction");
  fileElement.click();
  fileElement.addEventListener('change', uploadFileAndSendToBgToDownloadSelActions);
}

/**
 * open option page and load all saved json file
 */
function openOptionPageForSavedJsonList() {
  sendMessageToProxyAndBackgroundPages("OPEN_OPTION_PAGE_JSON_LIST", {}, 1);
}

/**
 * open option page - json editor page
 */
function openOptionPageForJsonEditor() {
  sendMessageToProxyAndBackgroundPages("OPEN_OPTION_PAGE_EDITOR", {}, 1);
}

/**
 * send message to viewer to start auto fill data
 */
function callDataEntryWorker() {
  let repeatMaxStr = document.getElementById("repeatMaxInput").value.toString();
  sendMessageToProxyAndBackgroundPages("Start_dataEntryWorker", {code: "DataEntryWorker.startDataEntryWork(\""+emailDomain+"\","+repeatMaxStr+");"}, 2);
}

/**
 * open save json list dialog and close playback type dialog
 */
function displaySavedJsonList() {
  getSavedJsonListFromLocalStorage();

  $('#playbackTypeModal').modal('hide');
  $('#jsonlistdialog').on('hidden.bs.modal', function () {
    $('#playbackTypeModal').modal('show')
  });
   
}

/**
 * display the main page
 */
function displayMainPage() {
  $('body').css("width", "30em");
  $('#wrapper').css("display", "block");
  $('#goBackBtn').css("display", "none");
  $('#resetBtn').css("display", "block");
  $('#publish_info_SIMQ_MV2').css("display", "none");
  $('#publish_info_SelfService').css("display", "none");
  $('#publish_info_Salesforce').css("display", "none");
  $('#publish_info_Ivari').css("display", "none");
  $('#publish_Other_Fields').css("display", "none");
  $('#in_progress_container').css("display", "none");

  //hide the start/stop button if page is not document viewer
  isCurrentPageDocumentViewer(() => { }, disableButtonsIfNotInViewer);
}

/**
 * display in progress page for record
 */
function displayRecordInprogressPage() {
  $('body').css("width", "30em");
  $('#wrapper').css("display", "none");
  $('#goBackBtn').css("display", "none");
  $('#resetBtn').css("display", "none");
  $('#publish_info_SIMQ_MV2').css("display", "none");
  $('#publish_info_SelfService').css("display", "none");
  $('#publish_info_Salesforce').css("display", "none");
  $('#publish_info_Ivari').css("display", "none");
  $('#publish_Other_Fields').css("display", "none");

  $('#in_progress_container').css("display", "block");
  $('#Playback_Information_Div').css("display", "none");
  $('#stopBtn').css("display", "block");
  $('#dataEntryWorkerBtn_inprogress').css("display", "block");  
  $('#downloadBtn').css("display", "block");
  $('#saveJsonBtn').css("display", "block");
  $('.loader--text_record').css("display", "block");
  $('.loader--text_playback').css("display", "none");
}

/**
 * display in progress page for playback
 */
function displayPlaybackInprogressPage() {
  $('body').css("width", "30em");
  $('#wrapper').css("display", "none");
  $('#goBackBtn').css("display", "none");
  $('#resetBtn').css("display", "none");
  $('#publish_info_SIMQ_MV2').css("display", "none");
  $('#publish_info_SelfService').css("display", "none");
  $('#publish_info_Salesforce').css("display", "none");
  $('#publish_info_Ivari').css("display", "none");
  $('#publish_Other_Fields').css("display", "none");

  $('#in_progress_container').css("display", "block");
  $('#Playback_Information_Div').css("display", "block");
  $('#stopBtn').css("display", "none");
  $('#dataEntryWorkerBtn_inprogress').css("display", "none");
  $('#downloadBtn').css("display", "none");
  $('#saveJsonBtn').css("display", "none");
  $('.loader--text_record').css("display", "none");
  $('.loader--text_playback').css("display", "block");

  preparePlaybackInfo();
}

/**
 * Prepare playback information
 */
function preparePlaybackInfo() {
  document.querySelector("#Playback_Information_P1").innerHTML = uploadedJson.meta.companyName ? uploadedJson.meta.companyName : "Unknown";
  document.querySelector("#Playback_Information_P2").innerHTML = uploadedJson.meta.transactionFolderName ? uploadedJson.meta.transactionFolderName : "Unknown";
}

/**
 * clear all global variable and reload popup page
 */
function resetExtension() {
  chrome.runtime.sendMessage({ message: "reset_called_from_popup" });
  location.reload();
}

/**
 * Use to send message to different pages within the extension
 * @param {String} messageToSend message to messageToSend
 * @param {json} dataToSend data to Send
 * @param {int} type 0 to both, 1 to Background, 2 to Proxy
 */
function sendMessageToProxyAndBackgroundPages(messageToSend, dataToSend, type) {
  console.log('sendmessagetoProxyandBackgroundPages')
  
  if (type == 0 || type == 2) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      D(tabs[0].id, { message: messageToSend, data: dataToSend });
    });
  }
  
  if (type == 0 || type == 1) {
    chrome.runtime.sendMessage({ message: messageToSend, data: dataToSend });
    console.log('chrome.sendMessage')

  }
}

/**
 * add click listner
 * check if current page in already in selected server workspace
 * if so, loginRequired = false
 */
function addEventListenerForServerDropdownlist() {
  let serverDropdownlist = document.getElementsByClassName("serverDropdown");

  for (var j = 0; j < serverDropdownlist.length; j++) {
    serverDropdownlist[j].addEventListener("click", function (event) {
      document.getElementById("serverDropdownBtn").innerHTML = this.innerText;
      document.getElementById("inputLoginRow").style.display = "none";
      switch (this.innerText) {
        case "USDev SIMQ":
          serverOption = 1;
          isCurPageWorkSpace("USDev SIMQ");
          break;
        case "Staging SIMQ":
          serverOption = 2;
          isCurPageWorkSpace("Staging SIMQ");
          break;
        case "USDev MV2":
          serverOption = 3;
          isCurPageWorkSpace("USDev MV2");
          break;
        case "Staging MV2":
          serverOption = 4;
          isCurPageWorkSpace("Staging MV2");
          break;
        case "UAT MV2":
          serverOption = 5;
          isCurPageWorkSpace("UAT MV2");
          break;
        case "UAT SIMQ":
          serverOption = 6;
          isCurPageWorkSpace("UAT SIMQ");
          break;
      }
    })
  }
}

/**
 * update text label when upload a document
 */
function updateTextDisplayforUploadField() {
  if (document.getElementById("uploadFileElement").files.length != 0) {
    document.getElementById("uploadFile").value = document.getElementById("uploadFileElement").files[0].name;
  } else {
    document.getElementById("uploadFile").value = "";
  }
}

/**
 * upload all global variables before start playback
 */
function updateUserSelectedOptions() {
  autoPublish = document.getElementById("autoPublishToggle").checked;
  pauseMode = document.getElementById("pauseModeToggle").checked;
  demoMode = document.getElementById("demoModeToggle").checked;
}

function playbackFromCurrentPage() {
  var fileElement = document.getElementById("uploadFileElement");
  fileElement.click();
  fileElement.addEventListener('change', saveUploadFileAndSendToPage);
}

function saveUploadFileAndSendToPage() {
  prepareUploadedFileAsObject().then(UploadedFile => {
    var dataToSend = { publish: autoPublish, pause: pauseMode, demo: demoMode, file: UploadedFile };
    sendMessageToProxyAndBackgroundPages("playback_called_from_popup_Current_Page", dataToSend, 1);
    document.getElementById("uploadFileElement").removeEventListener('change', saveUploadFileAndSendToPage);
    window.close();
  })
}

function uploadFileAndSendToBgToDownloadSelActions() {
  uploaded_seleniumActions().then(UploadedFile => {
    sendMessageToProxyAndBackgroundPages("get_selenium_actions_called", { json: UploadedFile }, 1);
    document.getElementById("uploadFileElement_seleniumAction").removeEventListener('change', uploadFileAndSendToBgToDownloadSelActions);
  });
}

function prepareUploadedFileAsObject() {
  updateUserSelectedOptions();
  return uploaded().then(data => {
    var fileName = document.getElementById("uploadFileElement").files[0].name;
    var fileType = fileName.split(".")[1];
    return {
      dataURL: data,
      name: fileName,
      options: {
        type: fileType == "zip" ? "application/zip" : "json"
      }
    };
  })
}

function isCurPageWorkSpace(server) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var curURL = tabs[0].url;
    var serverURL;

    switch (server) {
      case "USDev SIMQ":
        serverURL = "usdevstage.agreementexpress.net/html5/manager/agreementExpress.jsp#templateHomeNavigationPage";
        break;
      case "Staging SIMQ":
        serverURL = "staging.agreementexpress.net/html5/manager/agreementExpress.jsp#templateHomeNavigationPage";
        break;
      case "USDev MV2":
        serverURL = "usdevstage.agreementexpress.net/mv2/inbox.html"
        break;
      case "Staging MV2":
        serverURL = "staging.agreementexpress.net/mv2/inbox.html"
        break;
      case "UAT MV2":
        serverURL = "uat.agreementexpress.net/mv2/inbox.html"
        break;
      case "UAT SIMQ":
        serverURL = "uat.agreementexpress.net/html5/manager/agreementExpress.jsp#templateHomeNavigationPage";
        break;
    }

    if (!(String(curURL).includes(serverURL))) {
      document.getElementById("inputLoginRow").style.display = "block";
    } else {
      loginRequired = false;
    }
  });
}


function displayContentByPlaybackType(divId, playbackType) {
  document.getElementById("modelCloseBtn").click();
  document.getElementById("wrapper").style.display = "none";
  document.getElementById(divId).style.display = "block";
  document.getElementById("publish_Other_Fields").style.display = "block";
  document.getElementById("goBackBtn").style.display = "block";
  $('#resetBtn').css("display", "none");
  $("body").css("width", "35em");
  workflowOption = playbackType;
}


function hideOrShowIvariInput() {
  var chkbox = document.getElementById('createNewTransactionCheckbox');
  var rows = document.getElementsByClassName("IvariInputInfo");
  var i;
  if (chkbox.checked) {
    for (i = 0; i < rows.length; i++) {
      rows[i].style.visibility = "visible";
    }
  } else {
    for (i = 0; i < rows.length; i++) {
      rows[i].style.visibility = "hidden";
    }
  }
}

function startPlayBackByOptions() {
  let fileLength = document.getElementById("uploadFileElement").files.length;

  if (workflowOption == 3) {
    startSalesforceWorkflow();
  } else if (fileLength <= 0) {
    showAlert("#alertBox", "Please upload a JSON file.", "alertMessage", 2000);
    return;
  } else {
    uploaded().then((data) => {
      uploadedJson = data;
      startworkflow();
    })
  }
}

function startworkflow() {
  if (workflowOption == 1) {
    startMV2SimqWorkflow();
  } else if (workflowOption == 2) {
    startSelfserviceWorkflow();
  } else if (workflowOption == 3) {
    startSalesforceWorkflow();
  } else if (workflowOption == 4) {
    startIvariWorkflow();
  }
}

function startMV2SimqWorkflow() {
  const USDEV_SIMQ_URL = "https://usdevstage.agreementexpress.net/html5/manager/agreementExpress.jsp";
  const STAGING_SIMQ_URL = "https://staging.agreementexpress.net/html5/manager/agreementExpress.jsp";
  const UAT_SIMQ_URL = "https://uat.agreementexpress.net/html5/manager/agreementExpress.jsp";
  const USDEV_MV2_URL = "https://usdevstage.agreementexpress.net/mv2/";
  const STAGING_MV2_URL = "https://staging.agreementexpress.net/mv2/";
  const UAT_MV2_URL = "https://uat.agreementexpress.net/mv2/";

  var username = document.getElementById("usernameSIMQorMV2").value;
  var password = document.getElementById("passwordSIMQorMV2").value;
  var messageToSend = "";
  var tempURL = "";
  var subMessageToSend = "";

  if (serverOption == 0) {
    showAlert("#alertBox", "Please select a server ", "alertMessage", 2000);
    return;
  }

  if (loginRequired) {
    if (username == "" || password == "") {
      showAlert("#alertBox", "Please enter login info", "alertMessage", 2000);
      return;
    } else {
      if (serverOption == 1) {
        messageToSend = "playback_called_from_popup_USDEV_SIMQ";
        tempURL = USDEV_SIMQ_URL;
        subMessageToSend = "simq_login";
      } else if (serverOption == 2) {
        messageToSend = "playback_called_from_popup_STAGING_SIMQ";
        tempURL = STAGING_SIMQ_URL;
        subMessageToSend = "simq_login";
      } else if (serverOption == 3) {
        messageToSend = "playback_called_from_popup_USDEV_MV2";
        tempURL = USDEV_MV2_URL;
        subMessageToSend = "mv2_login";
      } else if (serverOption == 4) {
        messageToSend = "playback_called_from_popup_STAGING_MV2";
        tempURL = STAGING_MV2_URL;
        subMessageToSend = "mv2_login";
      } else if (serverOption == 5) {
        messageToSend = "playback_called_from_popup_UAT_MV2";
        tempURL = UAT_MV2_URL;
        subMessageToSend = "mv2_login";
      } else if (serverOption == 6) {
        messageToSend = "playback_called_from_popup_UAT_SIMQ";
        tempURL = UAT_SIMQ_URL;
        subMessageToSend = "simq_login";
      }
    }

  } else {
    messageToSend = "playback_called_from_popup_SKIP_LOGIN";
  }

  prepareUploadedFileAsObject().then(UploadedFile => {
    var data = {
      subMessage: subMessageToSend,
      publish: autoPublish,
      file: UploadedFile,
      login: username,
      pin: password,
      url: tempURL,
      pause: pauseMode,
      demo: demoMode
    }

    sendMessageToProxyAndBackgroundPages(messageToSend, data, 1);
  });

  displayPlaybackInprogressPage();
}

function startSelfserviceWorkflow() {
  const URL_REGEX = /^https:\/\/.*\.agreementexpress.net\/.*$/;
  var newURL = document.getElementById("selfServiceURL").value;

  if (newURL == "" || !newURL.match(URL_REGEX)) {
    showAlert("#alertBox", "Please enter an (valid) URL.", "alertMessage", 2000);
  } else {
    prepareUploadedFileAsObject().then(UploadedFile => {
      var dataToSend = { publish: autoPublish, file: UploadedFile, pause: pauseMode, demo: demoMode };
      sendMessageToProxyAndBackgroundPages("playback_called_from_popup_Selfservice", dataToSend, 1);
      chrome.tabs.create({ url: newURL });
    })

    displayPlaybackInprogressPage();
  }
}

function startSalesforceWorkflow() {
  if (SalesforceInputValidation()) {
    getHTMLDomForSalesforce(document.getElementById("uploadHTML")).then(dom => {
      htmlDom = dom;
      var publisherEmail = document.getElementById("publisherEmail").value;
      htmlDom.getElementById("AEX_USER_NAME").value = publisherEmail;
      var companyKey = htmlDom.getElementById("AEX_COMPANY_KEY").value;
      var username = publisherEmail;
      var baseurl = htmlDom.getElementById("BaseURL").value;
      var json = htmlDom.getElementsByTagName("textarea")[0].value;
      publishToSalesforce(companyKey, username, baseurl, json);
    });;
  }
}

function SalesforceInputValidation() {
  const htmlFiles = document.getElementById("uploadHTML");
  const publisherEmail = document.getElementById("publisherEmail").value;
  if (!('files' in htmlFiles) || publisherEmail == "") {
    showAlert("#alertBox", "Please enter publisher email and upload a HTML file", "alertMessage", 2000);
    return false;
  } else if (!validateEmail(publisherEmail)) {
    showAlert("#alertBox", "Please enter a valid email for publisher", "alertMessage", 2000);
    return false;
  }
  return true;
}

function getHTMLDomForSalesforce(html) {
  return new Promise((resolve, reject) => {
    if (typeof htmlDom !== "undefined") {
      resolve(htmlDom);
    } else {
      if (html.files.length >= 1) {
        var file = html.files[0];
        var fr = new FileReader();
        fr.onload = function (e) {
          var parser = new DOMParser();
          resolve(parser.parseFromString(e.target.result, "text/html"));
        };
        fr.readAsText(file);
      } else {
        reject("html file is empty");
      }
    }
  });
}

function searchEmailsInJsonAndDisplayInHTML() {
  if (SalesforceInputValidation()) {
    getHTMLDomForSalesforce(document.getElementById("uploadHTML")).then(dom => {
      htmlDom = dom;
      var json = JSON.parse(htmlDom.getElementsByTagName("textarea")[0].innerHTML);
      var emailContainer = {};
      for (var key1 in json.fieldValueMap) {
        if (json.fieldValueMap.hasOwnProperty(key1) && validateEmail(json.fieldValueMap[key1])) {
          console.log(key1 + " -> " + json.fieldValueMap[key1]);
          emailContainer[key1] = json.fieldValueMap[key1];
        }
      }

      for (var key2 in json.recipientMapping) {
        if (json.recipientMapping.hasOwnProperty(key2)) {
          console.log(key2 + "'s email -> " + json.recipientMapping[key2]['email']);
          emailContainer[key2] = json.recipientMapping[key2]['email'];
        }
      }
      console.log("Total number of emails: " + Object.keys(emailContainer).length);
      buildHtmlTable(emailContainer);
    });
  }
}

function buildHtmlTable(emailContainer) {
  for (var key in emailContainer) {
    var row$ = $('<tr/>');
    row$.append($('<td class="text-center"/>').html(key));
    row$.append($('<td class="text-center"/>').html('<input type="text" name="' + key + '" class="inputTextBox emailRows" value ="' + emailContainer[key] + '">'));
    $('#salesforce_emails').append(row$);
  }

  document.getElementById("Salesforce_email_container").style.display = "block";
  document.getElementById("searchEmail_Salesforce").style.display = "none";
  document.getElementById("updateEmail_Salesforce").style.display = "block";
}

function updateEmailsInJsonByUserInput() {
  var emailRows = document.getElementsByClassName("emailRows");
  var json = JSON.parse(htmlDom.getElementsByTagName("textarea")[0].innerHTML);
  for (var i = 0; i < emailRows.length; i++) {
    for (var key1 in json.fieldValueMap) {
      if (key1 == emailRows[i].name) {
        if (validateEmail(emailRows[i].value)) {
          json.fieldValueMap[key1] = emailRows[i].value;
        } else {
          showAlert("#alertBox", "Please enter valid email", "alertMessage", 2000);
          return;
        }
      }
    }
    for (var key2 in json.recipientMapping) {
      if (key2 == emailRows[i].name) {
        if (validateEmail(emailRows[i].value)) {
          json.recipientMapping[key2].email = emailRows[i].value;
        } else {
          showAlert("#alertBox", "Please enter valid email", "alertMessage", 2000);
          return;
        }
      }
    }
  }

  json.publisher = document.getElementById("publisherEmail").value;

  htmlDom.getElementsByTagName("textarea")[0].innerHTML = JSON.stringify(json);
  $('#salesforce_emails').html('');
  document.getElementById("searchEmail_Salesforce").style.display = "block";
  document.getElementById("updateEmail_Salesforce").style.display = "none";
  document.getElementById("Salesforce_email_container").style.display = "none";
  showAlert("#alertBox", "Successfully updated!", "alertMessage", 2000, true);
}

function publishToSalesforce(companyKey, username, baseurl, json) {

  const formData = new FormData();
  formData.append("AEX_COMPANY_KEY", companyKey);
  formData.append("AEX_USER_NAME", username);
  formData.append("BaseURL", baseurl);
  formData.append("json", json);

  const request = new XMLHttpRequest();
  request.onreadystatechange = function () {
    if (request.readyState === 4) {
      if (request.status === 200) {
        console.log(request.responseText);
        var jsonMessage = JSON.parse(request.responseText);
        if (jsonMessage.message == "Success") {
          showAlert("#alertBox", jsonMessage.message + ". Open transaction in 2s...", "alertMessage", 2000, true);
          setTimeout(() => {
            if (document.getElementById("uploadFileElement").files.length == 0) {
              chrome.tabs.create({ url: jsonMessage.res.launchURLs.Publisher_Launch_URL });
            } else {
              prepareUploadedFileAsObject().then(
                UploadedFile => {
                  var dataToSend = { publish: autoPublish, file: UploadedFile, pause: pauseMode, demo: demoMode };
                  sendMessageToProxyAndBackgroundPages("playback_called_from_popup_Salesforce", dataToSend, 1);
                  chrome.tabs.create({ url: jsonMessage.res.launchURLs.Publisher_Launch_URL });
                }
              );
            }
            displayPlaybackInprogressPage();
          }, 2000);
        } else {
          showAlert("#alertBox", jsonMessage.message, "alertMessage", 5000);
        }
      } else {
        showAlert("#alertBox", "Unable to send request to server", "alertMessage", 4000);
      }
    }
  };
  request.open("POST", baseurl + "/api/TemplateServices/v3/publishMultipart?AEX_USER_NAME=" + username + "&" + "AEX_COMPANY_KEY=" + companyKey);
  request.send(formData);
}

function validateEmail(email) {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

function startIvariWorkflow() {
  const username = document.getElementById("usernameMV2").value;
  const password = document.getElementById("passwordMV2").value;
  const advisorCode = document.getElementById("advisorCode").value;
  const xml = document.getElementById("uploadedXML");
  const chkbox = document.getElementById("createNewTransactionCheckbox").checked;
  var xmlData;

  if (!chkbox) {
    if (username == "" || password == "") {
      showAlert("#alertBox", "Please enter username/password", "alertMessage", 2000);
    } else {
      showAlert("#alertBox", "Start playback in 2 seconds...", "alertMessage", 4000, true);
      openMV2AndStartIvari();
    }
    return;
  }

  if (username == "" || password == "" || advisorCode === '' || !('files' in xml)) {
    showAlert("#alertBox", "Please enter username/password, advisor code/email and upload an XML", "alertMessage", 2000);

  } else {
    if (xml.files.length >= 1) {
      var file = xml.files[0];
      var fr = new FileReader();
      fr.onload = function (e) {
        const parser = new DOMParser();
        xmlData = parser.parseFromString(e.target.result, "text/xml");
        xmlData.getElementsByTagName("KeyValue")[1].childNodes[0].nodeValue = advisorCode;
        xmlData.getElementsByTagName("KeyValue")[0].childNodes[0].nodeValue = uuidv4();
        publishByXml(xmlToFile(file.name, xmlData));
      };
      fr.readAsText(file);
    } else {
      showAlert("#alertBox", "Please upload an XML file", "alertMessage", 2000);
    }
  }
}

function xmlToFile(name, xml) {
  return new File(new XMLSerializer().serializeToString(xml).split('\n'), name, {
    type: "text/xml",
    lastModified: new Date().getTime()
  });
}

function publishByXml(xml) {
  let xmlData;
  let message;
  const parser = new DOMParser();
  const formData = new FormData();
  formData.append("acordXmlFile", xml);

  const request = new XMLHttpRequest();
  request.onreadystatechange = function () {
    if (request.readyState === 4) {
      if (request.status === 200) {
        console.log(request.responseText);
        xmlData = parser.parseFromString(request.responseText, "text/xml");
        message = xmlData.getElementsByTagName("ResultInfoDesc")[0].childNodes[0].nodeValue;
        if (message == "Ingestion was successfull") {
          message += "! Start playback in 2 seconds...";
          showAlert("#alertBox", message, "alertMessage", 4000, true);
          openMV2AndStartIvari();
        } else {
          showAlert("#alertBox", message, "alertMessage", 4000);
        }
      } else {
        showAlert("#alertBox", "Unable to send request to server", "alertMessage", 4000);
      }
    }
  };
  request.open("POST", "https://usdevstage.agreementexpress.net/ET/TestET");
  request.send(formData);
}

function openMV2AndStartIvari() {

  prepareUploadedFileAsObject().then(UploadedFile => {
    var dataToSend = {
      subMessage: "mv2_login_Ivari",
      publish: autoPublish,
      file: UploadedFile,
      login: document.getElementById("usernameMV2").value,
      pin: document.getElementById("passwordMV2").value,
      url: "https://usdevstage.agreementexpress.net/mv2",
      pause: pauseMode,
      demo: demoMode
    }
    sendMessageToProxyAndBackgroundPages("playback_called_from_popup_Ivari", dataToSend, 1);
    displayPlaybackInprogressPage();
  });

}

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function showAlert(divId, message, infoId, time, color) {
  document.getElementById(infoId).innerHTML = message;
  if (color) {
    $(divId).removeClass("alert-danger");
    $(divId).addClass("alert-success");
  }
  $(divId).addClass("in");
  setTimeout(() => {
    $(divId).removeClass("in");
    $(divId).addClass("out");
    if (color) {
      $(divId).removeClass("alert-success");
      $(divId).addClass("alert-danger");
    }
    document.getElementById(infoId).innerHTML = "";
  }, time);
}

function uploaded() {
  return new Promise((resolve, reject) => {
    var x = document.getElementById("uploadFileElement");
    if ('files' in x) {
      if (x.files.length >= 1) {
        var fr = new FileReader();
        if (x.files.item(0).name.split(".")[1] == "zip") {
          fr.onload = function (e) {
            resolve(e.target.result);
          };
          fr.readAsDataURL(x.files.item(0));
        } else {
          fr.onload = function (e) {
            resolve(JSON.parse(e.target.result));
          };
          fr.readAsText(x.files.item(0));
        }
      }
    }
  });
}

function uploaded_seleniumActions() {
  return new Promise((resolve) => {
    var x = document.getElementById("uploadFileElement_seleniumAction");
    if ('files' in x) {
      if (x.files.length >= 1) {
        var fr = new FileReader();
        fr.onload = function (e) {
          resolve(JSON.parse(e.target.result));
        };
        fr.readAsText(x.files.item(0));
      }
    }
  });
}

function uploadFilesToConvertToCSV() {
  uploaded_jsonFiles().then(UploadedFile => {
    sendMessageToProxyAndBackgroundPages("uploadFilesToConvertToCSV", { jsonArray: UploadedFile }, 1);
    document.getElementById("uploadFileElement_JsonFiles").removeEventListener('change', uploadFilesToConvertToCSV);
  });
}

function uploaded_jsonFiles() {
  var jsonFiles = [];
  var filesLoaded = 0;
  return new Promise(async (resolve) => {
    var x = document.getElementById("uploadFileElement_JsonFiles");
    if ('files' in x) {
      for (var i = 0; i < x.files.length; i++) {
        var fr = new FileReader();
        fr.onload = function (e) {
          var json = JSON.parse(e.target.result);
          jsonFiles.push(json);
          filesLoaded++;
          if (filesLoaded == x.files.length) {
            convertAndAddJsonToCSVFile(jsonFiles);
            resolve(jsonFiles);
          }
        };
        fr.readAsText(x.files.item(i));
      }
    }
  });
}

function convertAndAddJsonToCSVFile(arrayOfJson) {
  //Need to check if successful here.
 var fieldNames = {};
 var csvJson = {"items" : []};
 
  var transID = arrayOfJson[0].meta.transactionFolderId;
  //test to see if all files are compatible
  for(var i = 0; i < arrayOfJson.length; i++) {
    //this logic is incorrect (should I just ignore the compound and just check for the same transaction folder id)
    if(arrayOfJson[i].meta.isCompound || transID != arrayOfJson[i].meta.transactionFolderId) {
     return null;
    }
  }
 //Gets all the fieldnames
  for(var i = 0; i < arrayOfJson.length; i++) {
    for(var j = 0; j < arrayOfJson[i].pages.length; j++) {
     for(var d = 0; d < arrayOfJson[i].pages[j].entries.length; d++) {
       fieldNames[arrayOfJson[i].pages[j].entries[d].name] = null;
     }
    }
  }
 // Gets all the values from the fieldnames
  for(var i = 0; i < arrayOfJson.length; i++) {
    csvJson.items.push(fieldNames);
   for(var j = 0; j < arrayOfJson[i].pages.length; j++) {
    for(var d = 0; d < arrayOfJson[i].pages[j].entries.length; d++) {
     csvJson.items[i][arrayOfJson[i].pages[j].entries[d].name] = arrayOfJson[i].pages[j].entries[d].options;
    }
   }
 }
 
 //convert the json into csv
 var items = csvJson.items;
 var replacer = (key, value) => value === null ? '' : value;
 var header = Object.keys(items[0]);
 var csv = items.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','));
 csv.unshift(header.join(','));
 csv = csv.join('\r\n');
 downloadCSVFile(arrayOfJson[0].meta.transactionName + ".csv", csv);
 }
 
 //downloads the CSV file
 function downloadCSVFile(filename, text) {
  console.log("test");
   var element = document.createElement('a');
   element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
   element.setAttribute('download', filename);
   element.style.display = 'none';
   document.body.appendChild(element);
   element.click();
   document.body.removeChild(element);
 }
 
 function createCSVForBulkUploadFromAllFields() {
   //need to send different message for different request ie: get all required etc
   sendMessageToProxyAndBackgroundPages("requestCSVAll",{version : getExtensionVersion()},0);
 }

 function createCSVForBulkUploadFromRequiredFields() {
  //need to send different message for different request ie: get all required etc
  sendMessageToProxyAndBackgroundPages("requestCSVRequired",{version : getExtensionVersion()},0);
}

window.onload = function() {
  console.log("onload" + Date())
  checkUserDomain();
}