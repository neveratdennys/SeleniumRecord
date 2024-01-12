
let uploadedJson = {};
let uploadedCurrentPageDialogActions = [];
let seleniumJson = {};
let curDocInfo = {};
let stop = true;
let playback = false;
let pauseMode = false;
let demoMode = false;
let messageCounter = 0;
let pageChangeCounter = 0;
let pageEntryArray = [];
let lastClick = 0;
let appVersion = "";
let demoModeInterval = 800;
const delay = 500;
const checkFrequencyTime = 50;
const widgetTypeDictionary = {
    "2": "Check Box",
    "3": "Radio Button",
    "4": "Input Field",
    "6": "Dropdown",
    "7": "Calendar",
    "8": "Label",
    "9": "Link",
    "10": "Box",
    "12": "Div",
    "13": "Button",
    "14": "Image",
    "15": "Error List"
};
const mapReportLPExcludedFieldRegs = [
    /.*_formatted$/,
    /.*_iso8601$/,
    /.*_region$/,
    /.*_nationalNumber$/,
    /^workflow$/,
];
const mapReportSDExcludedFieldRegs = [
    /.*Signature.*Date.*/i,
    /.*Date.*Signature.*/i,
    /.*signeddate.*/i,
    /.*Sig.*Date.*/i,
];

/**
 * send message to background to notify the page is loaded with scripts
 */
function sendInitialNotificationToExtension() {
    if (typeof checkPageInitialLoad !== "function" || !checkPageInitialLoad()) {
        setTimeout(() => {
            sendInitialNotificationToExtension();
        }, 100);
    } else {
        if (window.location.href.indexOf("workflow/?docId") >= 0) {
            updateDocumentInfo();
            getTransactionInfoForNewViewer();
        } else {
            getTransactionInfoForOldViewer();
        }
    }

}

function getTransactionInfoForNewViewer() {
    AgreementManager.callServer({}, `${window.location.origin}/api/ResponsiveViewerServices/v3/transactionInfo/${new URL(window.location.href).searchParams.get("docId")}`, "GET", (response) => {

        if (!response.length) {
            console.error("Unable to get Meta Data");
            sendErrorMessage(6);
        } else {
            const viewer = "responsive";
            const isSD = false;
            const docID = getDocIdFromURL();
            const { companyName, companyId, transactionName } = response[0].transInfo;
            const { status } = response[0].agreementDetails[0];
            const transactionFolderName = JSON.parse(response[0].transInfo.transactionFolder).folderName;
            const transactionFolderId = JSON.parse(response[0].transInfo.transactionFolder).id;
            const transRefId = JSON.parse(response[0].transInfo.transactionDefinition).transRefId;
            const currentUser = AgreementManager.currentUser;
            const serverOrigin = window.location.origin;
            const isCompound = response.length > 1;
            const templateGuids = response.map(res=>JSON.parse(res.transInfo.transactionFolder).templateItems.map(item=>item.guid)).flat();

            curDocInfo = {
                viewer, isSD, serverOrigin, currentUser, status, docID, companyName, companyId, transactionName, transactionFolderName, transactionFolderId, transRefId, isCompound, templateGuids
            }

            if (isCompound) {
                curDocInfo.otherTransaction = [];
                response.forEach((transaction, index) => {
                    if (index !== 0) {
                        curDocInfo.otherTransaction.push(JSON.parse(transaction.transInfo.transactionDefinition).transRefId);
                    }
                });
            }
            sendMsgToContentScript("VIEWER_LOADED", curDocInfo);
        }
    }, "JSON");
}

function getTransactionInfoForOldViewer() {
    const viewer = (window.location.href.indexOf("mv2/viewer2") >= 0) ? "mv2" : "simq";
    const isSD = isPageSD();
    const docID = getDocIdFromURL();
    const { companyId, status } = ext_getAgreementInterface().currentDoc;
    const { currentUser, transactionName, companyName } = ext_getAgreementInterface();
    const transRefId = (viewer == "mv2") ? ext_getAgreementInterface().transactionDefinition.transRefId : aexTransactionHandler.transactionFolder.transactionRefId;
    const transactionFolderName = hasCompoundController() ? compoundController.transactions[0].transFolder.folderName : aexTransactionHandler.transactionFolder.folderName;
    const transactionFolderId = hasCompoundController() ? compoundController.transactions[0].transFolder.id : aexTransactionHandler.transactionFolder.id;

    const serverOrigin = window.location.origin;
    const isCompound = hasCompoundController() && compoundController.transactions.length > 1;

    curDocInfo = {
        viewer, isSD, serverOrigin, currentUser, status, docID, companyName, companyId, transactionName, transactionFolderName, transactionFolderId, transRefId, isCompound
    }

    if (isCompound) {
        curDocInfo.otherTransaction = [];
        compoundController.transactions.forEach((transaction, index) => {
            if (index !== 0) {
                curDocInfo.otherTransaction.push(transaction.signingViewer.transactionDefinition.transRefId);
            }
        });
    }
    sendMsgToContentScript("VIEWER_LOADED", curDocInfo);
}

sendInitialNotificationToExtension();

//==================Utilities===================

/**
 * Checks if the given string is empty
 * 
 */
function isEmpty(str) {
    return (!str || 0 === str.length);
}

/**
 * Checks if the given HTML Element is visible
 */
function isVisible(element) {
    return !(element.offsetWidth == 0 && element.offsetHeight == 0) && computedStyle(element).visibility !== "hidden";
}

/**
 * Returns the Compute Style of a HTML Element
 * 
 */
function computedStyle(vElement) {
    return window.getComputedStyle ? window.getComputedStyle(vElement, null) : vElement.currentStyle;
}

/**
 * get docId from URL
 */
function getDocIdFromURL() {
    var url_string = window.location.href;
    var url = new URL(url_string);
    return url.searchParams.get("docId");
}

/**
 * print json to console
 */
function writeToConsoleJson() {
    sendLogMsgToBackground(seleniumJson);
}

/**
 * get SeleniumJson page entries
 */
function getSeleniumJsonPages() {
    return seleniumJson.meta ? ((curDocInfo.status) < 15 ? seleniumJson.pages : seleniumJson.pages_recipient) : [];
}

/**
 * get uploadedJson page entries
 */
function getUploadedJsonPages() {
    return uploadedJson.meta ? ((curDocInfo.status) < 15 ? uploadedJson.pages : uploadedJson.pages_recipient) : [];
}

/**
 * scroll page to center element
 */
function scrollPageToCenterField(element) {
    if (element && demoMode) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
        });
    }
}

/**
 * validate email
 */
function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

/**
 * check if uploadedJson contains data for recipient mode
 */
function isPlaybackRecipientModeRequired() {
    return curDocInfo.status < 15 && uploadedJson.sendPanelInfo;
}

/**
 * check if compoundController exist
 */
function hasCompoundController() {
    return typeof compoundController !== "undefined";
}

function ext_getAgreementInterface() {
    return hasCompoundController() ? compoundController.currentTransaction.agreementInterface :
        (typeof agreementInterface !== "undefined" ? agreementInterface : null);
}

function ext_getAllAgreementInterfaces() {
    return hasCompoundController() ? compoundController.transactions.map(transaction=>transaction.agreementInterface) :
        (typeof agreementInterface !== "undefined" ? [agreementInterface] : []);
}

function ext_getDocument() {
    return hasCompoundController() ? compoundController.currentTransaction.document : document;
}

function ext_getCurrentTransaction() {
    return hasCompoundController() ? compoundController.currentTransaction : this;
}

/**
 * check if current playback using old JSON file
 */
function isUsingOldJSON() {
    return uploadedJson.meta && !uploadedJson.meta.recorderVersion;
}

/**
 * check if excceed wait time
 */
function hasExceedWaitTime(counter, totalWaitTime) {
    let totalTime = totalWaitTime ? totalWaitTime : 10000;
    return counter >= (totalTime / checkFrequencyTime);
}

/**
 * check if current page is signing document
 */
function isPageSD() {
    if (curDocInfo.viewer === "responsive") {
        return false;
    } else {
        var nextBtn = locateNextBtn();
        var symbol = false;
        if (hasCompoundController()) {
            var fields = document.querySelectorAll('ae-bubble-item');
            for (var i = 0; i < fields.length; i++) {
                if (fields[i].className.includes("ae-bubble")) {
                    symbol = true;
                    break;
                }
            }
        } else {
            var fields = document.querySelectorAll('div#documentsListHolder');
            symbol = (fields.length > 0);
        }

        return !nextBtn && symbol;
    }
}

/**
 * It reads all the datePicker value in the current Page,
 * and store them to the json array.
 */
function readDate() {
    if (curDocInfo.viewer !== "responsive") {
        ext_getDocument().querySelectorAll('input.aexDatePicker').forEach(dp => {
            if (isVisible(dp) && dp.value !== '') {
                saveFieldToPageEntry(dp);
            }
        })
    }
}

/**
 * auto detect and close the switch doc dialog in Signing viewer
 */
function autoCloseSwitchDocDialog() {
    if (curDocInfo.viewer !== "responsive") {
        if (hasCompoundController()) {  //for MV2
            var dialog = document.querySelector("ae-dialog-switch-document[role=dialog]");
            if (dialog && dialog.opened) {
                dialog.close();
            }
        } else {  //for SIMQ
            if (typeof document.getElementById("systemMessage") !== "undefined" && isVisible(document.getElementById("systemMessage"))) {
                $('#systemMessage').popup('close');
            }
        }
    }
}

//==================Recording=======================

function startRecording(version) {
    sendLogMsgToBackground("Start new Recording~~~~~~~~~");
    msgBox.print("A new recording is started");
    appVersion = version;
    stop = false;
    playback = false;
    pageEntryArray = [];
    seleniumJson = {};
    messageCounter = 0;
    pageChangeCounter = 0;
    buildJsonMetaAndStart();
}

function buildJsonMetaAndStart() {
    // build ison

    const { companyName, companyId, transactionName, transactionFolderName, transactionFolderId, transRefId, isCompound, templateGuids } = curDocInfo;
    const recorderVersion = appVersion;

    var meta;
    meta = {
        companyName, companyId, transactionName, transactionFolderName, transactionFolderId, transRefId, isCompound, templateGuids, recorderVersion
    };

    if (isCompound) {
        meta.otherTransaction = curDocInfo.otherTransaction;
    }

    seleniumJson.meta = meta;
    seleniumJson.pages = [];
    seleniumJson.pages_recipient = [];
    seleniumJson.clickedSDs = [];
    seleniumJson.clickedSDs_recipient = [];
    seleniumJson.attachmentList = [];
    seleniumJson.sigData = [];
    sendMsgforRecord();
    recordNewPage();
}

function recordNewPage() {
    sendLogMsgToBackground("New Page ...");
    pageEntryArray = [];

    if (isPageSD()) {
        dataEntryClickedSDs();
        addListenerForSendButton();
    }

    let pageIndex = searchCurrentPageIndexInJson();
    if (pageIndex !== -1) {
        pageEntryArray = getSeleniumJsonPages()[pageIndex].entries;
    }

    updateDocumentInfo();
    addListenersToFields();
    if (!isPageSD() && curDocInfo.viewer === "responsive") {
        hasIntegrationDialogAppeared();
    }
    msgBox.show();
}

/**
 * if current page already exist in the json
 * @return the index of page, if not exist, return -1;
 */
function searchCurrentPageIndexInJson(tempDocName) {
    var docName = tempDocName ? tempDocName : locateCurDocName();
    for (var i = 0; i < getSeleniumJsonPages().length; i++) {
        if (curDocInfo.viewer === "responsive") {
            if (getSeleniumJsonPages()[i].pageNumber === parseInt(getCurrentDocumentInfo().pageNumber)) {
                return i;
            }
        } else {
            if (getSeleniumJsonPages()[i].docName === docName) {
                return i;
            }
        }
    }
    return -1;
}

function saveEntriesToJson() {
    readDate();

    var pageIndex = isPageSD() ? searchCurrentPageIndexInJson(tempDocName) : searchCurrentPageIndexInJson();

    if (pageIndex != -1) {
        getSeleniumJsonPages()[pageIndex].entries = pageEntryArray;
    } else {
        getSeleniumJsonPages().push(buildPageEntryJson());
    }

    writeToConsoleJson();
    sendMsgforRecord();
}

function stopRecording() {
    if (!stop) {
        saveEntriesToJson();
        sendMsgToContentScript("FROM_PAGE_RECORD_COMPLETE");
        removeAllListeners();
        msgBox.printDownloadingMessage();
        stop = true;
    } else {
        msgBox.print("Error: The recorder has not started yet!")
    }
}

function sendDataToExtensionForDownload() {
    saveEntriesToJson();
    sendMsgToContentScript("FROM_PAGE_RECORD_DOWNLOAD");
}


function sendDataToExtensionForSave(data) {
    saveEntriesToJson();
    sendMsgToContentScript("FROM_PAGE_RECORD_SAVE", data);
}

//=========================playback==========================

function updateGlobalVariableForPlayback(data) {
    uploadedJson = data.json;
    uploadedCurrentPageDialogActions = [];
    autoPublish = data.publish;
    pauseMode = data.pause;
    demoMode = data.demo;
    playback = true;
    stop = true;
}

function startPlayback(data) {
    sendLogMsgToBackground("Recevied message from extension - start/continue playback");
    updateGlobalVariableForPlayback(data);
    addSupportForOldJsonFile();
    msgBox.print("Starting Playback");
    msgBox.show();
    startFillingPages();
}

function startFillingPages() {
    if (isPageSD()) {
        autoCloseSwitchDocDialog();
        fillClickedSDPages(0);
    } else {
        updateDocumentInfo();
        FindPageEntryInJSON();
    }
}

function FindPageEntryInJSON() {
    if (!playback) {
        msgBox.print("Playback stopped!");
    } else {
        var docName = locateCurDocName();
        var pages = allowUsingRecordFromDifferentMode();

        if (pages.length === 0) {
            sendErrorMessage(4);
        } else {
            for (var i = 0; i < pages.length; i++) {
                if (curDocInfo.viewer === "responsive") {
                    var pageNumber = getCurrentDocumentInfo().pageNumber;
                    if ((pages[i].docName === docName) && (parseInt(pages[i].pageNumber) === parseInt(pageNumber))) {
                        pageFill(i);
                        return;
                    }
                } else {
                    if (pages[i].docName === docName) {
                        pageFill(i);
                        return;
                    }
                }
            }
            sendErrorMessage(4);
        }
    }
}

function pageFill(pageIndex) {
    updateDocumentInfo();
    sendLogMsgToBackground("---Start Page #" + (pageIndex + 1));
    msgBox.show();
    msgBox.print("Start filling page #" + (pageIndex + 1));
    const fillFirstEntry = () => {
        if (getUploadedJsonPages().length !== 0 && getUploadedJsonPages()[pageIndex].entries.length !== 0) {
            var field = getUploadedJsonPages()[pageIndex].entries[0];
            if ((curDocInfo.viewer == "responsive") && ((field.type == "text" && field.id.includes("downshift")) || field.type === "hidden")) {
                // if the first field is dropdown or combobox in responsive viewer, it need time to load options
                setTimeout(() => {
                    enterFieldEntryByPage(pageIndex, 0);
                }, 200);
            } else {
                enterFieldEntryByPage(pageIndex, 0);
            }
        } else {
            preparePlaybackNextPage(pageIndex);
        }
    }
    
    if (!isPageSD() && curDocInfo.viewer == "responsive") {
        updateCurrentPageDialogActions(pageIndex);
        // passes next step as a callback to this function, might be better way of doing this
        fillDialogsIfExist(fillFirstEntry)
    } else {
        fillFirstEntry();
    }

}

/**
 * when no record in associated pages entries
 * this provides some flexiablity to use pages_recipient for publisher mode or use pages for recipient mode
 */
function allowUsingRecordFromDifferentMode() {
    var pages = getUploadedJsonPages();
    if (!pages.length) {
        if (curDocInfo.status < 15) {
            sendLogMsgToBackground("No record found in publisher mode - try to use record from recipient mode");
            uploadedJson.pages = uploadedJson.pages_recipient;
        } else {
            sendLogMsgToBackground("No record found in recipient mode - try to use record from publisher mode");
            uploadedJson.pages_recipient = uploadedJson.pages;
        }
        pages = getUploadedJsonPages();
    }
    return pages;
}

/**
 * Old Json file does not have page_recipient and clickedSDs_recipient
 * create them to enable record support old json
 */
function addSupportForOldJsonFile() {
    if (uploadedJson.meta && !uploadedJson.meta.recorderVersion) {
        if (!uploadedJson.pages_recipient) {
            uploadedJson.pages_recipient = [];
        }
        if (!uploadedJson.clickedSDs_recipient) {
            uploadedJson.clickedSDs_recipient = [];
        }
    }

    if (uploadedJson.meta && uploadedJson.pages.length) {
        uploadedJson.pages.forEach((page, index) => {
            uploadedJson.pages[index].entries = page.entries.filter(entry => entry.isAssert !== true)
        })
    }

    if (uploadedJson.meta && uploadedJson.pages_recipient.length) {
        uploadedJson.pages_recipient.forEach((page, index) => {
            uploadedJson.pages_recipient[index].entries = page.entries.filter(entry => entry.isAssert !== true)
        })
    }
}

function fillClickedSDPages(index) {
    if (index >= getUploadedJsonClickedSDs().length) { // last page of all clicked SDs
        autoCloseSwitchDocDialog();
        if (pauseMode) {
            msgBox.showResumeBtn(false);
        } else {
            sendCompleteMessage();
        }
    } else {
        var docName = getUploadedJsonClickedSDs()[index].docName;
        var foundPage = switchedDocForSD(docName);

        if (foundPage) {
            checkSigningDocLoadedAndStartEnterData(docName);
        } else {
            sendErrorMessage(10);
        }
    }
}

function checkSigningDocLoadedAndStartEnterData(docName) {
    var curDocName = ext_getAgreementInterface().currentDoc.docName;
    if(curDocName === docName) {
        setTimeout(() => {
            autoCloseSwitchDocDialog();
            FindPageEntryInJSON();
        }, 1000);
    } else {
        checkSigningDocLoadedAndStartEnterData(docName);
    }
    
}

function switchedDocForSD(docName) {
    var found = false;
    var isCompoundTransaction = compoundController.transactions.length > 1;

    if (isCompoundTransaction) {
        for (var i = 0; i < compoundController.transactions.length; i++) {
            var curTrans = compoundController.transactions[i];
            var agreements = curTrans.signingViewer.agreements;
            for (var j = 0; j < agreements.length; j++) {
                if (agreements[j].docName === docName) {
                    curTrans.signingViewer.switchDoc(agreements[j].docID);
                    compoundController.currentTransaction = curTrans;
                    compoundController.currentTransaction.signingViewer.currentDoc = agreements[j];
                    found = true;
                    break;
                }
            }
        }
    } else {
        for (var i = 0; i < ext_getAgreementInterface().agreements.length; i++) {
            if (ext_getAgreementInterface().agreements[i].docName === docName) {
                ext_getAgreementInterface().switchDoc(ext_getAgreementInterface().agreements[i].docID);
                found = true;
                break;
            }
        }
    }

    return found;
}

function goingToNextEntry(pageIndex, entryIndex) {
    if (!playback) {
        return;
    }
    var jsonPage = getUploadedJsonPages()[pageIndex];

    if(jsonPage && jsonPage.entries) {
        var pageEntry = jsonPage.entries;

        if (entryIndex < pageEntry.length) {
            if (demoMode) {
                setTimeout(() => {
                    enterFieldEntryByPage(pageIndex, entryIndex);
                }, demoModeInterval);
            } else {
                if (curDocInfo.viewer === "responsive") {
                    setTimeout(() => {
                        enterFieldEntryByPage(pageIndex, entryIndex);
                    }, 0);
                } else {
                    enterFieldEntryByPage(pageIndex, entryIndex);
                }
            }
        } else {
            preparePlaybackNextPage(pageIndex);
        }
    } else {
        sendLogMsgToBackground("goingToNextEntry - page not exist");
    }
    
}

function preparePlaybackNextPage(pageIndex) {
    sendLogMsgToBackground("---Completed Page #" + (pageIndex + 1));
    msgBox.print("Finished filling page #" + (pageIndex + 1));

    if (isPageSD()) {
        var SDIndex = checkCurSDIndexInClickedSDs();
        if (SDIndex !== -1) {
            fillClickedSDPages(SDIndex + 1);
        }
    } else {
        if (pauseMode) {
            msgBox.showResumeBtn();
        } else {
            if (pageIndex == (getUploadedJsonPages().length - 1)) { //this is the last page of LPs when there is no SDs
                sendCompleteMessage();
            } else {
                setTimeout(() => {
                    clickToNextPageAndContinuePlayback();
                }, 500);
            }
        }
    }
}

function clickToNextPageAndContinuePlayback() {
    var nextBtn = locateNextBtn();
    if (nextBtn) {
        nextBtn.click();
        if(!isPageSD() && curDocInfo.viewer === "responsive") {
            fillDialogsIfExist(waitforPageChangeForPlayback);
        } else {
            waitforPageChangeForPlayback();
        }
    } else {
        sendErrorMessage(3);
    }
}

function checkCurSDIndexInClickedSDs() {
    var curDocName = locateCurDocName();
    for (var i = 0; i < getUploadedJsonClickedSDs().length; i++) {
        if (getUploadedJsonClickedSDs()[i].docName === curDocName) {
            return i;
        }
    }
    return -1;
}

//===========communication with Chrome extension===============================

function sendMsgToContentScript(messageTosend, dataToSend) {
    var pageMessage = { message: messageTosend, data: dataToSend };
    window.postMessage(pageMessage, "*");
}

function sendMsgforRecord() {
    var data = {
        json: seleniumJson,
        status: stop,
        page: pageEntryArray,
        docInfo: curDocInfo
    };
    sendMsgToContentScript("FROM_PAGE_RECORD", data);
}

/**
 * Showing all sendLogMsgToBackground in background page
 */
function sendLogMsgToBackground(msg) {
    sendMsgToContentScript("FROM_PAGE_LOG", { msg });
}

function sendCompleteMessage(skipRecipientMode) {
    if (isPlaybackRecipientModeRequired() && !skipRecipientMode) {
        msgBox.print("Open save and send panel.");
        preparePlaybackRecipientMode();
    } else {
        sendLogMsgToBackground("------------Playback completed-------------");
        setTimeout(() => {
            msgBox.print("Playback completed");
        }, 500);
        playback = false;
        uploadedJson = {};
        sendMsgToContentScript("FROM_PAGE_PLAYBACK_COMPLETE");
        setTimeout(() => {
            autoCloseSwitchDocDialog();
            if (autoPublish) {
                autoPublishTransaction();
            }
        }, 2000);
    }
}

function autoPublishTransaction() {
    sendLogMsgToBackground("Publish the transaction");
    if (detectSigningCompleteDialog()) {
        msgBox.print("Publishing Transaction and exit");
        if (hasCompoundController()) {
            document.querySelector("ae-dialog-signing-complete").saveAndSend();
        } else {
            document.querySelector("div#clickfands-popup a#savensend").click();
        }

        setTimeout(() => {
            detectCompleteDialogAndExit();
        }, 2000);
    } else {
        msgBox.printErrorMessage(8);
    }
}

function detectSigningCompleteDialog() {
    if (hasCompoundController()) {
        var dialog = document.querySelector("ae-dialog-signing-complete");
        return dialog && dialog.opened;
    } else {
        var dialog = document.querySelector("div#clickfands-popup");
        return dialog && isVisible(dialog);
    }
}

function detectCompleteDialogAndExit() {
    if (hasCompoundController()) {
        var completeDialog = document.querySelector("ae-dialog-agreement-completed");
        if (completeDialog && completeDialog.opened) {
            completeDialog.exit();
        }
    } else {
        var completeDialog = document.querySelector("div#completedAgreement");
        if (completeDialog && isVisible(completeDialog)) {
            completeDialog.querySelector("a#completedexit").click();
        }
    }
}

function sendErrorMessage(errorType) {
    sendLogMsgToBackground("Error Type #" + errorType + " occured");
    msgBox.printErrorMessage(errorType);
    stop = true;
    playback = false;
    seleniumJson = {};
    uploadedJson = {};
    sendMsgToContentScript("FROM_PAGE_ERROR&type=" + errorType);
}

addEventListener('message', (event) => handleMessageFromExtension(event));

function handleMessageFromExtension(event) {
    if (event.source != window)
        return;
    if (event.data && event.data.extensionMessage) {
        //makes sure MV2 or simq is load complete
        if (!hasCompoundController() || compoundController.currentTransaction) {
            if (event.data.type == "record_pageUpdate") {
                continueRecordAfterPageUpdate(event.data.extensionMessage);
            } else if (event.data.type == "playback_pageUpdate" || event.data.type == "playback_init") {
                startPlayback(event.data.extensionMessage)
            } else if (event.data.type == "msgbox_toggle") {
                msgBoxToggle(event.data.extensionMessage);
            } else if (event.data.type == "start_recording") {
                startRecording(event.data.extensionMessage);
            } else if (event.data.type == "saveToLocalStorage") {
                sendDataToExtensionForSave(event.data.extensionMessage);
            } else if (event.data.type == "recorder_settings") {
                demoModeInterval = event.data.extensionMessage.demoModeInterval;
            } else if (event.data.type == "get_data_to_create_csv_bulk_upload_all") {
                createCSVFileFromAllFields();
            } else if (event.data.type == "get_data_to_create_csv_bulk_upload_required") {
                createCSVFileFromRequiredFields();
            } else if (event.data.type == "mapping_seleniumJson") {
                createHtmlMappingReport(event.data.extensionMessage.json.meta.templateGuids);
            }
        } else {
            setTimeout(() => {
                handleMessageFromExtension(event);
            }, 1000);
        }
    }
}

function continueRecordAfterPageUpdate(data) {
    sendLogMsgToBackground("Recevied message from extension - continue recording");
    msgBox.print("Continue recording");
    seleniumJson = data.json;
    stop = false;
    recordNewPage();
}

function msgBoxToggle(data) {
    if (data.status) {
        msgBox.show();
    } else {
        msgBox.hide();
    }
}

function disregardRecordOrPlayback() {
    sendLogMsgToBackground("Disregard called");
    if (!stop) {
        msgBox.print("Recording stopped!");
        removeAllListeners();
    }

    if (playback) {
        msgBox.hideResumeBtn();
        msgBox.print("Playback stopped!");
    }

    resetGlobalVariables();
}

function resetGlobalVariables() {
    stop = true;
    playback = false;
    uploadedJson = {};
    seleniumJson = {};
    playback = false;
    pauseMode = false;
    demoMode = false;
    messageCounter = 0;
    pageChangeCounter = 0;
    pageEntryArray = [];
}

//===========messagebox==============================

class MessageBox {
    constructor() {
        this.injectMessageBox();
        this.setUpDragEvent();
    }
}

MessageBox.prototype.injectMessageBox = function () {
    var e = document.createElement('div');
    e.innerHTML = `
    <style>
    .recorder_msgbox {
        word-wrap: break-word;
        position: fixed;
        top: 85%; 
        left: 70%;
        z-index:1000;
        width: 20%;
        height: auto;
        border-radius: 5px;
        padding: 15px;
        background-color: rgba(156,204,101,0.8);
        font-family: 'Roboto', 'Noto', sans-serif;
        font-size: 14px;
        font-weight: 450;
        color: black;
        text-shadow: none;
        text-align: center;
        display:none;
    }
    .closebtn {
        position: absolute;
        top: 36%;
        right: 10px;
        margin-left:10px; 
        color: black;
        font-weight: bold;            
        font-size: 25px;
        line-height: 20px;
        cursor: pointer;
        transition: 0.3s;
    }
    
    .closebtn:hover, #repositionbtn:hover {
        color: white;
    }

    button#resumeButton{
        font-size: 20px;
        padding: 0px;
        width:80%;
        height:30px;
        margin-left: 10%;
        background-color: #555555;
        color: white;
        transition: 0.3s;
        border: none;
        text-align: center;
        text-decoration: none;
        border-radius: 4px;
        display:none;
    }

    button#resumeButton:hover {
        background-color: white;
        color: black;
        border: 2px solid #555555;
    }

    #repositionbtn{
        position: absolute;
        color: #1b5e20;
        top: 33%;
        left: 10px;
        margin-right: 20px;
        font-weight: bold;            
        font-size: 18px;
        cursor: pointer;
        transition: 0.3s;
    }

    #recorder_message_text{
        margin:15px 20px 10px 25px;
        text-align: center;
    }

    </style>
    <div id="recorder_msgbox" class="recorder_msgbox"> 
        <span id="repositionbtn">&otimes;</span>           
        <span id="recorder_message_text">AEX Recorder is loaded into the page.</span>            
        <button id="resumeButton"></button>            
        <span class="closebtn" onclick="this.parentElement.style.display='none';">&times;</span> 
    </div>
    `;
    document.body.insertBefore(e, document.body.childNodes[0]);

    this.messageBox = document.getElementById('recorder_msgbox');
    this.message = this.messageBox.querySelector('#recorder_message_text');
    this.moveBox = document.getElementById('repositionbtn');
    this.resumeBtn = document.getElementById("resumeButton");
}

MessageBox.prototype.setUpDragEvent = function () {
    const that = this;
    this.moveBox.onmousedown = function (event) {
        event.preventDefault();
        // get the mouse cursor position at startup:
        let pos3 = event.clientX;
        let pos4 = event.clientY;
        ext_getDocument().onmouseup = function (event) {
            /* stop moving when mouse button is released:*/
            ext_getDocument().onmouseup = null;
            ext_getDocument().onmousemove = null;
        };
        // call a function whenever the cursor moves:
        ext_getDocument().onmousemove = function (event) {
            event.preventDefault();
            // calculate the new cursor position:
            let pos1 = pos3 - event.clientX;
            let pos2 = pos4 - event.clientY;
            pos3 = event.clientX;
            pos4 = event.clientY;
            // set the this.messageBox's new position:
            that.setPos(pos1, pos2);
        };
    };
}

MessageBox.prototype.setPos = function (x, y) {
    this.messageBox.style.left = (this.messageBox.offsetLeft - x) + "px";
    this.messageBox.style.top = (this.messageBox.offsetTop - y) + "px";
}

MessageBox.prototype.print = function (msg) {

    if (this.message.style.display !== "none") {
        this.messageBox.style.backgroundColor = "rgba(156,204,101,0.8)";
    }
    this.message.innerHTML = msg;
}

MessageBox.prototype.printDownloadingMessage = function () {
    messageCounter = 0;
    this.messageInterval = setInterval(() => this.message.innerHTML = "Downloading files." + Array(messageCounter++ % 3 + 1).join('.'), 800);
}

MessageBox.prototype.printCompleteRecordingMessage = function () {
    clearInterval(msgBox.messageInterval);
    this.print("Files have been saved to drive.");
}

MessageBox.prototype.printErrorMessage = function (errorCode) {
    this.messageBox.style.backgroundColor = "#f44336";
    this.show();
    if (errorCode == 1) {
        this.message.innerHTML = "Error: Uploaded file does not contain a JSON";
    } else if (errorCode == 2) {
        this.message.innerHTML = "Error: Unable to enter data - Stop playback.";
    } else if (errorCode == 3) {
        this.message.innerHTML = "Error: Unable to locate next button - stop playback";
    } else if (errorCode == 4) {
        this.message.innerHTML = "Error: Unable to find current page - stop playback";
    } else if (errorCode == 5) {
        this.message.innerHTML = "Error: Unable to send - please enter valid emails";
    } else if (errorCode == 6) {
        this.message.innerHTML = "Error: Unable to get transaction meta data";
    } else if (errorCode == 7) {
        this.message.innerHTML = "Error: invalid information in save and send panel";
    } else if (errorCode == 8) {
        this.message.innerHTML = "Error: Unable to auto publish transaction";
    } else if (errorCode == 9) {
        this.message.innerHTML = "Error: Wrong transaction -  Playback stopped!";
    } else if (errorCode == 10) {
        this.message.innerHTML = "Error: Unable to locate next SD -  Playback stopped!";
    } else {
        this.message.innerHTML = "Unknown error occurred.";
    }
}

MessageBox.prototype.show = function () {
    this.messageBox.style.display = "inherit";
}

MessageBox.prototype.hide = function () {
    this.messageBox.style.display = "none";
}

//type: true for pause mode, false for pause on error
MessageBox.prototype.showResumeBtn = function (isError) {
    this.messageBox.style.backgroundColor = "#f44336";
    this.resumeBtn.style.display = "block";
    if (isError) {
        this.resumeBtn.innerHTML = "Fix Errors and Resume";
    } else {
        this.resumeBtn.innerHTML = "Click to Resume";
    }

    this.resumeBtn.addEventListener('click', resumePlayback);
    this.message.style.display = "none";
}

MessageBox.prototype.hideResumeBtn = function () {
    this.resumeBtn.style.display = "none";
    this.message.style.display = "block";
    this.print("Continue playback...");
}

const msgBox = new MessageBox();


//===========confirmBox==================

class confirmBox {
    constructor() {
        this.abc = "test";
        this.injectConfirmBox();
    }
}

confirmBox.prototype.injectConfirmBox = function () {
    var e = document.createElement('div');
    e.innerHTML = `
    <style>
    #recorder_confirmBox {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.50);
        z-index: 999998;
        display: none;
    }
    #recorder_confirmBox .dialog {
        width: 400px;
        margin: 100px auto 0;
        background-color: #fff;
        box-shadow: 0 0 20px rgba(0,0,0,.2);
        border-radius: 3px;
        overflow: hidden
    }
    #recorder_confirmBox .dialog header {
        padding: 10px 8px;
        background-color: #f6f7f9;
        border-bottom: 1px solid #e5e5e5
    }
    #recorder_confirmBox .dialog header h3 {
        font-size: 14px;
        margin: 0;
        color: #555;
        display: inline-block
    }
    #recorder_confirmBox .dialog header .fa-close {
        float: right;
        color: #c4c5c7;
        cursor: pointer;
        transition: all .5s ease;
        padding: 0 2px;
        border-radius: 1px    
    }
    #recorder_confirmBox .dialog header .fa-close:hover {
        color: #b9b9b9
    }
    #recorder_confirmBox .dialog header .fa-close:active {
        box-shadow: 0 0 5px #673AB7;
        color: #a2a2a2
    }
    #recorder_confirmBox .dialog .dialog-msg {
        padding: 12px 10px;
        min-height: 80px;
    }
    #recorder_confirmBox .dialog .dialog-msg p{
        margin: 0;
        font-size: 15px;
        color: #333
    }
    #recorder_confirmBox .dialog footer {
        border-top: 1px solid #e5e5e5;
        padding: 8px 10px
    }
    #recorder_confirmBox .dialog footer .controls {
        direction: rtl
    }
    #recorder_confirmBox .dialog footer .controls .button {
        padding: 5px 15px;
        border-radius: 3px
    }
    .button {
      cursor: pointer
    }
    #confirmBox_doActionBtn {
        background-color: #428bca;
        border: 1px solid #5bc0de;
        color: #f5f5f5;
        width: 115px;
    }
    #confirmBox_doActionBtn:hover {
        background-color: #fff;
        border: 1px solid #428bca;
        color: #428bca;
        width: 115px;
    }
    #confirmBox_cancelAndDownloadBtn {
        background-color: #f44336;
        border: 1px solid #ff6659;
        color: #f5f5f5;
        width: 140px;
    }
    #confirmBox_cancelAndDownloadBtn:hover {
        background-color: #fff;
        border: 1px solid #f44336;
        color: #f44336;
        width: 140px;
    }
    #confirmBox_cancelActionBtn {
        background-color: #fbc02d;
        border: 1px solid #ffff8b;
        color: #f5f5f5;
        width: 115px;
    }
    #confirmBox_cancelActionBtn:hover {
        background-color: #fff;
        border: 1px solid #fbc02d;
        color: #fbc02d;
        width: 115px;
    }
    </style>
    <div id='recorder_confirmBox' class='dialog-ovelay'>
        <div class='dialog'>
            <header><h3>AEX Recorder</h3></header>
            <div class='dialog-msg'>
                <p id='confirmBox_msg'></p>
            </div>
            <footer>
                <div class='controls'>
                    <button id="confirmBox_doActionBtn" class='button'>Continue</button>
                    <button id="confirmBox_cancelAndDownloadBtn" class='button'>Stop & Download</button>
                    <button id="confirmBox_cancelActionBtn" class='button'>Disregard</button>
                </div>
            </footer>
        </div>
    </div>
    `;

    document.body.insertBefore(e, document.body.childNodes[0]);

    this.confirmBox = document.getElementById("recorder_confirmBox");
    this.message = document.getElementById("confirmBox_msg");
    document.getElementById("confirmBox_doActionBtn").addEventListener("click", () => {
        sendMsgToContentScript("CONFIRM_BOX_YES");
        this.hide();
    });
    document.getElementById("confirmBox_cancelAndDownloadBtn").addEventListener("click", () => {
        sendMsgToContentScript("CONFIRM_BOX_CANCEL_DOWNLOAD");
        this.hide();
    });
    document.getElementById("confirmBox_cancelActionBtn").addEventListener("click", () => {
        sendMsgToContentScript("CONFIRM_BOX_NO");
        this.hide();
    });
}

confirmBox.prototype.show = function () {
    this.confirmBox.style.display = "inherit";
}

confirmBox.prototype.hide = function () {
    this.confirmBox.style.display = "none";
}

confirmBox.prototype.print = function (type) {
    this.show();

    //completed publisher mode, continue to recipient mode
    if (type === 1) {
        this.message.innerHTML = "You have completed a recording in publisher mode for this transaction. Do you want to continue recording in recipient mode?";
        document.getElementById("confirmBox_doActionBtn").style.display = "inline";
    }

    //same transaction
    if (type === 2) {
        this.message.innerHTML = "Recording is in progress for same transaction. Would you like to continue recording?";
        document.getElementById("confirmBox_doActionBtn").style.display = "inline";
    }

    //different transaction
    if (type === 3) {
        this.message.innerHTML = "Recording is automatically stopped as a different transaction started. Do you want to save your previous recording?";
        document.getElementById("confirmBox_doActionBtn").style.display = "none";
    }

    //Ready to save and send
    if (type === 4) {
        this.message.innerHTML = "Do you want to stop and download the recording before save and send?";
        document.getElementById("confirmBox_doActionBtn").style.display = "none";
    }
}

const cfmBox = new confirmBox();

//===========mappingReportBox==================

class mappingReportBox {
    constructor() {
        this.injectMappingReportBox();
    }
}

mappingReportBox.prototype.injectMappingReportBox = function() {
    var e = document.createElement('div');
    e.innerHTML = `
    <style>
    #recorder_mappingReportBox {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.50);
        z-index: 999999;
        display: none;
    }
    #recorder_mappingReportBox .dialog {
        width: 400px;
        margin: 100px auto 0;
        background-color: #fff;
        box-shadow: 0 0 20px rgba(0,0,0,.2);
        border-radius: 3px;
        overflow: hidden
    }
    #recorder_mappingReportBox .dialog header {
        padding: 10px 8px;
        background-color: #f6f7f9;
        border-bottom: 1px solid #e5e5e5
    }
    #recorder_mappingReportBox .dialog header h3 {
        font-size: 14px;
        margin: 0;
        color: #555;
        display: inline-block
    }
    #recorder_mappingReportBox .dialog header .fa-close {
        float: right;
        color: #c4c5c7;
        cursor: pointer;
        transition: all .5s ease;
        padding: 0 2px;
        border-radius: 1px    
    }
    #recorder_mappingReportBox .dialog header .fa-close:hover {
        color: #b9b9b9
    }
    #recorder_mappingReportBox .dialog header .fa-close:active {
        box-shadow: 0 0 5px #673AB7;
        color: #a2a2a2
    }
    #recorder_mappingReportBox .dialog .dialog-msg {
        padding: 12px 10px;
        min-height: 80px;
    }
    #recorder_mappingReportBox .dialog .dialog-msg p{
        margin: 0;
        font-size: 15px;
        color: #333
    }
    #recorder_mappingReportBox .dialog footer {
        border-top: 1px solid #e5e5e5;
        padding: 8px 10px
    }
    #recorder_mappingReportBox .dialog footer .controls {
        direction: rtl
    }
    #recorder_mappingReportBox .dialog footer .controls .button {
        padding: 5px 15px;
        border-radius: 3px
    }
    .button {
      cursor: pointer
    }
    #mappingReportBox_doActionBtn {
        background-color: #428bca;
        border: 1px solid #5bc0de;
        color: #f5f5f5;
        width: 115px;
    }
    #mappingReportBox_doActionBtn:hover {
        background-color: #fff;
        border: 1px solid #428bca;
        color: #428bca;
        width: 115px;
    }
    #mappingReportBox_cancelActionBtn {
        background-color: #fbc02d;
        border: 1px solid #ffff8b;
        color: #f5f5f5;
        width: 115px;
    }
    #mappingReportBox_cancelActionBtn:hover {
        background-color: #fff;
        border: 1px solid #fbc02d;
        color: #fbc02d;
        width: 115px;
    }
    </style>
    <div id='recorder_mappingReportBox' class='dialog-ovelay'>
        <div class='dialog'>
            <header><h3>AEX Recorder</h3></header>
            <div class='dialog-msg'>
                <p id='mappingReportBox_msg'></p>
            </div>
            <footer>
                <div class='controls'>
                    <button id="mappingReportBox_doActionBtn" class='button'>Yes</button>
                    <button id="mappingReportBox_cancelActionBtn" class='button'>No</button>
                </div>
            </footer>
        </div>
    </div>
    `;

    document.body.insertBefore(e, document.body.childNodes[0]);

    this.mappingReportBox = document.getElementById("recorder_mappingReportBox");
    this.message = document.getElementById("mappingReportBox_msg");
    document.getElementById("mappingReportBox_doActionBtn").addEventListener("click", () => {
        sendMsgToContentScript("MAPPING_REPORT_BOX_YES");
        this.hide();
    });
    document.getElementById("mappingReportBox_cancelActionBtn").addEventListener("click", () => {
        this.hide();
    });
}

mappingReportBox.prototype.show = function () {
    this.mappingReportBox.style.display = "inherit";
}

mappingReportBox.prototype.hide = function () {
    this.mappingReportBox.style.display = "none";
}

mappingReportBox.prototype.print = function () {
    this.show();

    this.message.innerHTML = " Would you like to download a report of LP-SD field mapping?";
    document.getElementById("mappingReportBox_doActionBtn").style.display = "inline";
    document.getElementById("mappingReportBox_cancelActionBtn").style.display = "inline";
}

const mapBox = new mappingReportBox();

function createCSVFileFromAllFields() {
    var jsonRepresentation = { data: [] };
    var dataLocation = ext_getAgreementInterface().agreements;
    var json = {};
    
    for (var c = 0; c < compoundController.transactions.length; c++) {
        dataLocation = compoundController.transactions[c].agreementInterface.agreements;
        if (compoundController.transactions[c].agreementInterface.transactionDefinition != null) {
            json[compoundController.transactions[c].agreementInterface.transactionDefinition.name + " : " + compoundController.transactions[c].agreementInterface.transactionDefinition.transRefId] = "";
        }
        loopAgreements:
        for (let i = 0; i < dataLocation.length; i++) {
            loopPage:
            for (let x = 0; x < dataLocation[i].PAGE.length; x++) {
                loopFields:
                for (let j = 0; j < dataLocation[i].PAGE[x].Fields.length; j++) {
                    if (dataLocation[i].PAGE[x].Fields[j].type !== "8") {
                        loopConstraints:
                        for (let y = 0; y < dataLocation[i].PAGE[x].Fields[j].constraints.length; y++) {
                            if (dataLocation[i].PAGE[x].Fields[j].constraints[y].constraintType == "VISIBILITY") {
                                if (dataLocation[i].PAGE[x].Fields[j].constraints[y].constraintValue == "visible") {
                                    json[dataLocation[i].PAGE[x].Fields[j].name] = "";
                                    break loopConstraints;
                                }
                            }
                        }
                    }
                }
            }
        }
        //for signatures
        for (let i = 0; i < dataLocation.length; i++) {
            for (let x = 0; x < dataLocation[i].PAGE.length; x++) {
                for (let j = 0; j < dataLocation[i].PAGE[x].Sigs.length; j++) {
                    if (dataLocation[i].PAGE[x].Sigs[j].originalLabel !== "") {
                        json["label:" + dataLocation[i].PAGE[x].Sigs[j].originalLabel] = "";
                    }
                }
            }
        }
        //this is for values.
        jsonRepresentation.data.push(returnClonedJson(json));
        for (var items in json) {
            for (let x = 0; x < dataLocation.length; x++) {
                if (dataLocation[x].fieldNameMap[items] != undefined) {
                    for (let i = 0; i < dataLocation[x].fieldNameMap[items].length; i++) {
                        jsonRepresentation.data[0][items] = dataLocation[x].fieldNameMap[items][i].value;
                    }
                }
            }
        }

        //for options
        jsonRepresentation.data.push(returnClonedJson(json));
        for (var items in json) {
            for (let x = 0; x < dataLocation.length; x++) {
                if (dataLocation[x].fieldNameMap[items] != undefined) {
                    for (let i = 0; i < dataLocation[x].fieldNameMap[items].length; i++) {
                        if (dataLocation[x].fieldNameMap[items].length > 1) {
                            jsonRepresentation.data[1][items] += "" + dataLocation[x].fieldNameMap[items][i].checkedVal + ";";
                        }
                    }
                    if (jsonRepresentation.data[1][items] !== "") {
                        jsonRepresentation.data[1][items] = jsonRepresentation.data[1][items].slice(0, -1);
                    }
                }
            }
        }
    }

    convertJSONArrayToCSV(jsonRepresentation.data);
}

function createCSVFileFromRequiredFields() {
    var jsonRepresentation = { data: [] };
    var dataLocation = ext_getAgreementInterface().agreements;
    var json = {};

    //for empty json
    for (let x = 0; x < dataLocation.length; x++) {
        for (var items in dataLocation[x].fieldNameMap) {
            for (let i = 0; i < dataLocation[x].fieldNameMap[items].length; i++) {
                for (let j = 0; j < dataLocation[x].fieldNameMap[items][i].constraints.length; j++) {
                    if (dataLocation[x].fieldNameMap[items][i].constraints[j].constraintType == "REQUIRED") {
                        json[dataLocation[x].fieldNameMap[items][i].name] = "";
                    } else if(dataLocation[x].fieldNameMap[items][i].constraints[j].constraintType == "EVENTS") {
                        if(dataLocation[x].fieldNameMap[items][i].constraints[j].constraintValue.EVENT != undefined) {
                            if (dataLocation[x].fieldNameMap[items][i].constraints[j].constraintValue.EVENT["@op"] == "et") { 
                                json[dataLocation[x].fieldNameMap[items][i].name] = "";
                            }
                        } else {
                            for (let y = 0; y < dataLocation[x].fieldNameMap[items][i].constraints[j].constraintValue.length; y++) { 
                                if (dataLocation[x].fieldNameMap[items][i].constraints[j].constraintValue[y]["@op"] == "et") {
                                    json[dataLocation[x].fieldNameMap[items][i].name] = "";
                                }
                            }
                        }
                        
                    }
                }
            }
        }
    }
    //for events
    jsonRepresentation.data.push(returnClonedJson(json));
    var arrIndex = 0;
    for (let y = 0; y < dataLocation.length; y++) {
        for (var items in dataLocation[y].fieldNameMap) {
            for (let i = 0; i < dataLocation[y].fieldNameMap[items].length; i++) {
                for (let j = 0; j < dataLocation[y].fieldNameMap[items][i].constraints.length; j++) {
                    if (dataLocation[y].fieldNameMap[items][i].constraints[j].constraintType == "EVENTS") {
                        for (let x = 0; x < dataLocation[y].fieldNameMap[items][i].constraints[j].constraintValue.length; x++) {
                            var onlyMakeOneArray = false;
                            if (dataLocation[y].fieldNameMap[items][i].constraints[j].constraintValue[x]["@op"] == "et") {
                                if (!onlyMakeOneArray) {
                                    jsonRepresentation.data.push(returnClonedJson(json));
                                    arrIndex++;
                                    onlyMakeOneArray = true;
                                }
                                jsonRepresentation.data[arrIndex][items] = "reqField";
                                jsonRepresentation.data[arrIndex][dataLocation[y].fieldIdMap[dataLocation[y].fieldNameMap[items][i].constraints[j].constraintValue[x]["@field"]].name] 
                                = dataLocation[y].fieldNameMap[items][i].constraints[j].constraintValue[x]["@compare"];
                            } 
                        }
                    }
                }
            }
        }
    }
    //for values
    jsonRepresentation.data.push(returnClonedJson(json));
    arrIndex++;
    for (var items in json) {
        for (let x = 0; x < dataLocation.length; x++) {
            if (dataLocation[x].fieldNameMap[items] != undefined) {
                for (let i = 0; i < dataLocation[x].fieldNameMap[items].length; i++) {
                    jsonRepresentation.data[arrIndex][items] = dataLocation[x].fieldNameMap[items][i].value;

                }
            }
        }
    }
    convertJSONArrayToCSV(jsonRepresentation.data);
}

function returnClonedJson(jsonToClone) {
    return JSON.parse(JSON.stringify(jsonToClone));
}

// converts then downloads the csv file
function convertJSONArrayToCSV(arrayOfJson, filename = "bulkUploadFile") {
    var items = arrayOfJson;
    // var replacer = (key, value) => value === null ? '' : value;
    // var header = Object.keys(items[0]);
    // var csv = items.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join('","'));
    // csv.unshift(header.join(','));
    // csv = csv.join('\r\n');
    
    var str = '';
    var headers = new Array();

    for (var i = 0; i < items.length; i++) {
        var line = '';
        var data = items[i];
        for (var index in data) {
            headers.push(index);
            if (line != '') {
                line += ','
            }
            line += '"' + items[i][index] + '"';
        }
        str += line + ((items.length>1) ? '\r\n' : '');
        line = '';
    }

    headers = ArrNoDupe(headers);

    str = headers + '\r\n' + str;
    downloadFile(filename + ".csv", str);
}

function ArrNoDupe(a) {
    var temp = {};
    for (var i = 0; i < a.length; i++)
        temp[a[i]] = true;
    var r = [];
    for (var k in temp)
        r.push(k);
    return r;
}


//downloads the CSV file
function downloadFile(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

/**
 * Mapping Report - Create&download a report of unmapped field names&signatures in HTML format.
 * @param {string[]} templateGuids 
 */
function createHtmlMappingReport(templateGuids) {
    getLPInfos(templateGuids)
        .then((templateInfos)=>{
            let LPReport = createLPReport(templateInfos);
            let SDReport = createSDReport();

            // Remove mapped fields
            let mappedFieldNames = LPReport.fields.map(field =>field.name).filter(name=> -1 !== SDReport.fields.map(field=>field.name).indexOf(name));
            let LPUnmappedFields = LPReport.fields.filter(field => -1 === mappedFieldNames.indexOf(field.name));
            let SDUnmappedFields = SDReport.fields.filter(field => -1 === mappedFieldNames.indexOf(field.name));

            let stringFormulaComponents = LPReport.stringFormulas.flatMap((formula => formula.formulaComponents));
            let stringFormulaTarget = LPReport.stringFormulas.map((formula => formula.name));

            // Remove string formula fields
            LPUnmappedFields = LPUnmappedFields.filter(field => stringFormulaComponents.indexOf(field.name) === -1);
            SDUnmappedFields = SDUnmappedFields.filter(field => stringFormulaTarget.indexOf(field.name) === -1);
            // Remove extIn fields
            LPUnmappedFields = LPUnmappedFields.filter(LPField => !SDReport.fields.find(SDField=>SDField.extIn === LPField.name));
            SDUnmappedFields = SDUnmappedFields.filter(SDField => !LPReport.fields.find(LPField=>SDField.extIn === LPField.name));
            // Remove extOut fields
            LPUnmappedFields = LPUnmappedFields.filter(LPField => !SDReport.fields.find(SDField=>LPField.extOut === SDField.name));
            SDUnmappedFields = SDUnmappedFields.filter(SDField => !LPReport.fields.find(LPField=>LPField.extOut === SDField.name));

            // LP: Remove "AEXTransactionEmails" field
            LPUnmappedFields = LPUnmappedFields.filter(LPField => LPField.name != "AEXTransactionEmails");

            // SD: Remove Label type fields (type != 8)
            SDUnmappedFields = SDUnmappedFields.filter(SDField => parseInt(SDField.type) != 8);

            // SD: Remove hidden fields
            SDUnmappedFields = SDUnmappedFields.filter(field => field.visibility !== "hiddenDoNotPrint");
            
            let unmappedSignatures = SDReport.sigs.filter(sig => !isMappedSignature(sig));
            let str = createHtmlString({LPUnmappedFields,SDUnmappedFields,unmappedSignatures})
            downloadFile(SDReport.transactionName + " - Map Report.html",str)
        })
        .catch(err=>{
            console.error(err);
        })
}

/**
 * Mapping Report - Call server to retrieve template definitions for Landing Pages.
 * @param {string[]} templateGuids 
 */
function getLPInfos(templateGuids) {
    return new Promise((resolve,reject) => {
        let templateInfos = [];

        if (window.AgreementManager) {
            for (let i = 0; i < templateGuids.length; i++) {
                window.AgreementManager.callServer(
                    {},
                    '/api/TemplateBuilderServices/v3/templates/' + templateGuids[i],
                    'GET',
                    handleTemplateInfo,
                    'json'
                )
            }
        }

        function handleTemplateInfo(data) {
            let page = templateInfos.length + 1;
            templateInfos.push({...data, page});
            if (templateInfos.length >= templateGuids.length) {
                resolve(templateInfos);
            }
        }
    })
}

/**
 * Mapping Report - Create a report of Landing Pages.
 * @param {[]} templateInfos 
 */
function createLPReport(templateInfos) {
    let LPData = {};
    LPData.fields = [];
    LPData.stringFormulas = [];
    for (let i = 0; i < templateInfos.length; i++) {
        LPData.fields = LPData.fields.concat(templateInfos[i].fieldData.DOC.PAGE.FIELD.map(field => {
            return {
                name: field["@name"],
                extOut: field["@extOut"] || "",
                type: field["@type"],
                // page is always 1 in LP, so use the order/titles of LPs instead
                // page: templateInfos.length - templateInfos[i].page + 1,
                // templateGuid: templateInfos[i].templateGuid
                templateTitle: templateInfos[i].respData.root.meta.title
            }
        }));
        for (key in templateInfos[i].respData.customFields) {
            if (templateInfos[i].respData.customFields[key].type === "stringFormula") {
                let stringFormulaItem = {
                    name: templateInfos[i].respData.customFields[key].fieldName,
                    formulaComponents: templateInfos[i].respData.customFields[key].evaluationArguments.map((item => templateInfos[i].respData.components[item.$ref.id].params.name))
                }
                LPData.stringFormulas.push(stringFormulaItem);
            }
        }
    }
    let components = templateInfos.map(temp=>temp.respData.components)
    let componentNames = [];
    for (let i = 0; i < components.length; i ++) {
        for (key in components[i]) {
            componentNames.push(components[i][key].params.name)
        }   
    }
    LPData.fields = LPData.fields.filter(field=>!isFieldNameExcluded(field.name, mapReportLPExcludedFieldRegs));
    return LPData;
}

/**
 * Mapping Report - Create a report of field names&signatures for current Signing Documents.
 */
function createSDReport() {
    let SDData = {};
    SDData.fields = [];
    SDData.sigs = [];
    let agreements = ext_getAllAgreementInterfaces().map(interface=>interface.agreements).flat();
    agreements = removeDuplicateJsonByProperty(agreements, "masterTemplate");
    for (let i = 0; i < agreements.length; i++) {
        let fieldItems = [];
        let sigItems = agreements[i].PAGE.map(page=>page.Sigs.map(sig=>{
            return {
                uid: sig.uid,
                page: sig.page,
                docName: agreements[i].docName
            }
        })).flat();
        for (key in agreements[i].fieldIdMap) {
            if (!fieldItems.map(field=>field.name).includes(agreements[i].fieldIdMap[key].name)) {
                fieldItems.push({
                    name: agreements[i].fieldIdMap[key].name,
                    extIn: agreements[i].fieldIdMap[key].extIn || "",
                    // agreementId: agreements[i].fieldIdMap[key].agreementId,
                    type: agreements[i].fieldIdMap[key].type,
                    value: agreements[i].fieldIdMap[key].value || "",
                    page: agreements[i].fieldIdMap[key].page,                
                    visibility: agreements[i].fieldIdMap[key].constraints.find(constraint=>constraint["constraintType"] === "VISIBILITY")["constraintValue"],
                    docName: agreements[i].docName,
                })
            }
        }
        SDData.fields = SDData.fields.concat(fieldItems);
        SDData.sigs = SDData.sigs.concat(sigItems);
    }
    SDData.transactionName = ext_getAgreementInterface().transactionDefinition.name || "Unknown transaction";
    SDData.fields = SDData.fields.filter(field=>!isFieldNameExcluded(field.name, mapReportSDExcludedFieldRegs));
    return SDData;
}

/**
 * Remove duplicate json from an array, compare by a property
 * @param {Array} arr - Array of json
 * @param {string} prop - Property to compare
 */
function removeDuplicateJsonByProperty(arr, prop) {
    let obj = {};
    for (let i = 0; i < arr.length; i++) {
        if(!obj[arr[i][prop]]) obj[arr[i][prop]] = arr[i];
    }
    let result = [];
    for (key in obj) result.push(obj[key]);
    return result;
}

/**
 * Mapping Report - Test if a signature is mapped (valid email||systemSig||departmentSig)
 * @param {} sig 
 */
function isMappedSignature(sig) {
    const re = /\S+@\S+\.\S+/;
    if (re.test(sig.uid) || sig.uid.indexOf("system") !== -1 || sig.uid.indexOf("department") !== -1) {
        return true;
    } else {
        return false;
    }
}

/**
 * Mapping Report - Test if field name should be excluded from mapping report.
 * @param {string} fieldName 
 * @param {RegExp[]} arrayOfRegex 
 */
function isFieldNameExcluded(fieldName, arrayOfRegex) {
    return arrayOfRegex.some(regex=>fieldName.match(regex));
}

/**
 * Mapping Report - create final report in HTML.
 * @param {*} jsonOfArrays 
 */
function createHtmlString(jsonOfArrays) {
    let allTables = "";
        
    for (title in jsonOfArrays) {
        if (title == "SDUnmappedFields") {
            allTables += createCollapsableHtmlTableByProperty(title,jsonOfArrays[title],"docName");
        } else if (title == "LPUnmappedFields") {   
            allTables += createCollapsableHtmlTableByProperty(title,jsonOfArrays[title],"templateTitle");
        } else if (title == "unmappedSignatures"){
            allTables += createCollapsableHtmlTableByProperty(title,jsonOfArrays[title],"docName");
        } else {
            allTables += `<h2>${title}</h2>`
            let tableContent = "";
            let prevValue = {};
            for (let i = 0; i < jsonOfArrays[title].length; i++) {
                if (i == 0) {
                    tableContent += `<thead><tr><th>#</th>`
                    for (property in jsonOfArrays[title][i]) {
                        tableContent += `<th>${property}</th>`
                    }
                    tableContent += "</tr></thead>"
                }
                tableContent += `<tbody><tr><td>${i+1}</td>`
                for (property in jsonOfArrays[title][i]) {
                    if (prevValue[property] != jsonOfArrays[title][i][property] || jsonOfArrays[title][i][property] === "") {
                        if (property == "type") {
                            tableContent += `<td>${widgetTypeDictionary[jsonOfArrays[title][i][property].toString()]}</td>`
                        } else {
                            tableContent += `<td>${jsonOfArrays[title][i][property]}</td>`  
                        }
                    } else {
                        tableContent += `<td style="text-align:center">"</td>`
                    }
                    prevValue[property] = jsonOfArrays[title][i][property];
                }
                tableContent += "</tr></tbody>"
            }
            let completeTable = `<table class="pure-table">${tableContent}</table><br/>`
            allTables += completeTable;
        }
        
    }
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <style>
            body {
                font-family: Arial, Helvetica, sans-serif;
                padding-left: 3vw;
                padding-right: 3vw;
                padding-top: 2vh;
                padding-bottom:2vh;
            }
        
            table {
                width:100%;
                border-collapse: collapse;
            }
            
            th:first-letter {
                text-transform:capitalize;
            }
            
            th{
                background-color: #333333;
                color: #FFFFFF;
                text-align: left;                
            }
            
            td {
                word-wrap: break-word;
                max-width: 1px;
                text-align: center;
            }
            
            th, td {
                padding: 10px;
                border: 1px solid #ddd;
            }
            
            .collapsible {
                background-color: #777;
                color: white;
                cursor: pointer;
                padding: 15px;
                text-align: left;
            }
            
            .collapsible:hover {
                background-color: #555;
            }
            
            tr:hover {background-color:#f5f5f5;}
        </style>
        <title>Mapping Report</title>
    </head>
    <body>
        ${allTables}
    </body>
    <script>
        var coll = document.getElementsByClassName("collapsible");
        for (var i = 0; i < coll.length; i++) {
            coll[i].addEventListener("click", function() {
                var content = this.parentNode.parentNode.nextElementSibling;
                if (content.style.display == "none"){
                    content.style.display = "table-row-group";
                } else {
                    content.style.display = "none";                    
                } 
            });
        }
    </script>
    </html>`
}

/**
 * Create an HTML table in which each section can be collapsed.
 * @param {string} title - title of the table
 * @param {*} arrayOfJsons - array of json with the same structure(properties)
 * @param {string} groupBy - property that should be used to group records together
 */
function createCollapsableHtmlTableByProperty(title,arrayOfJsons,groupBy) {
    let result = `<h2>${title}</h2>`;
    let uniqValuesForGroupBy = [];
    let prevValue = {};
    for (let i = 0; i < arrayOfJsons.length; i ++) {
        if (i == 0) {
            result += `<thead><tr><th>#</th>`
            for (property in arrayOfJsons[i]) {
                result += `<th>${property}</th>`
            }
            result += "</tr></thead>"
        }
        if (!uniqValuesForGroupBy.includes(arrayOfJsons[i][groupBy])) {
            (uniqValuesForGroupBy.length > 0)? result += `</tbody>`: "";
            result += `<tbody>
			<tr>
                <td class="collapsible" colspan="${Object.keys(arrayOfJsons[i]).length + 1}">
                    <span style="float:left">&#x25BC; ${arrayOfJsons[i][groupBy]}</span>  <span style="float:right">${arrayOfJsons.filter((json)=>json[groupBy]==arrayOfJsons[i][groupBy]).length} Fields</span>
                </td>
			</tr>
            </tbody> <tbody class="content" style="display: none">`;
            uniqValuesForGroupBy.push(arrayOfJsons[i][groupBy]);
            prevValue = {}          
        }
        result += `<tr><td>${i+1}</td>`
        for (property in arrayOfJsons[i]) {
            if (property=="type") arrayOfJsons[i][property] = widgetTypeDictionary[arrayOfJsons[i][property].toString()];
            if (prevValue[property] != arrayOfJsons[i][property]) {
                result += `<td>${arrayOfJsons[i][property]}</td>`  
            } else {
                result += isNaN(arrayOfJsons[i][property])?`<td>"</td>`:`<td>${arrayOfJsons[i][property]}</td>`
            }
            prevValue[property] = arrayOfJsons[i][property];
        }
        result += "</tr>"
    }
    result += "</tbody>"
    result = `<table class="pure-table">${result}</table><br/>`
    return result;
}