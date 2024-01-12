console.log("AEX Recorder ---- Content script successfully loaded!");

let pageLoadCounter = 0;
let datePickerCounter = 0;
let tempDocName;
let tempDocID;
let checkCompleteDialog = false;
const nextBtnKeyword = ["next", "start", "continue", "finish", "agree", "submit", "proceed"];
const prevBtnKeyword = ["previous", "back"];
const pageLoadedDelay = 500;

//-------------------------Utilities functions--------------------

function isNavBtnForSwitchSDs(element) {
    return (element.tagName === "DIV" && element.className.includes("ae-bubble") && element.parentElement.className.includes("ae-bubble-item"))
        || (element.onclick != null && String(element.onclick).includes("agreementInterface.switchDoc"))
        || (element.tagName === "IRON-ICON" && element.className.includes("docIcon"))
        || (element.tagName === "IMG" && element.parentElement && element.parentElement.id == "sigPointer" && sigPointer && sigPointer.nextReqObjDiffDoc);

}

function isNavBtnForSwitchSDsubpages(element) {
    return (element.tagName === "AE-FNB" && (element.icon === "chevron-right" || element.icon === "chevron-left"))
        || (element.tagName === "IRON-ICON" && element.id === "icon" && element.classList.contains("ae-fnb"))
        || (element.tagName === "DIV" && (element.parentElement.id === "nav_left" || element.parentElement.id === "nav_right" || element.classList.contains("ae-page-selector")))
        || (element.tagName === "IMG" && element.classList.contains("ae-page-selector"))
        || (element.tagName === "IMG" && element.parentElement && element.parentElement.id == "sigPointer" && sigPointer && !sigPointer.nextReqObjOnPage && !sigPointer.nextReqObjDiffDoc);
}

function isUselessElement(element) {
    const uFieldRegex = /^uField_(\d+|\d+\_\d+)$/;

    return element.disabled || (element.name === "" && element.tagName !== "A" && element.tagName !== "svg")
        || ((element.tagName === "DIV" || element.tagName === "PAPER-BUTTON" || element.tagName === "BUTTON"
            || element.tagName === "SPAN" || element.tagName === "IRON-ICON" || element.type === "password")
            && !element.id.match(uFieldRegex));
}

function isDatePicker(element) {
    const datePickerRegex = /^aexDatePicker.*$/;
    if (typeof element.className.match === "function" && element.className.match(datePickerRegex)) {
        return true;
    } else {
        return false;
    }
}

function isSignatureElement(element) {
    return element.tagName === "rect";
}

function isNextBtn(element) {
    return element.name === "IvariNextButton" || element.name === "AEXTransactionNext" || checkNextBtnText(element.text);
}

function isPrevBtn(element) {
    return element.name === "IvariPreviousButton" || element.name === "AEXTransactionPrevious" || checkPrevBtnText(element.text);
}

function isTitleStepper(element) {
    return element.classList.contains("title") && element.classList.contains("ae-lp-stepper");
}

function checkNextBtnText(text) {
    for (var i = 0; i < nextBtnKeyword.length; i++) {
        if (String(text).toLowerCase().includes(nextBtnKeyword[i])) {
            return true;
        }
    }
    return false;
}

function checkPrevBtnText(text) {
    for (var i = 0; i < prevBtnKeyword.length; i++) {
        if (String(text).toLowerCase().includes(prevBtnKeyword[i])) {
            return true;
        }
    }
    return false;
}

function locateCurDocName() {
    return ext_getAgreementInterface().currentDoc.docName;
}

function locateCurDocId() {
    return ext_getAgreementInterface().currentDoc.docID;
}

function spinner(condition, msg) {
    condition = condition ? "show" : "hide";
    if (hasCompoundController()) {
        compoundController.currentTransaction.showSpinner(condition, {
            text: msg,
            theme: "a",
            textVisible: true
        });
    } else {
        $.mobile.loading(condition, {
            text: msg,
            theme: "a",
            textVisible: true
        });
    }
}

function checkPageLoadedByDom(pageName) {
    return hasCompoundController() ?
        getHTMLWidget(getLastLoadedWidget(pageName).id) && locateCurDocName() === pageName :
        ext_getAgreementInterface().seleniumQueue.length === getPageNumberByName(pageName);
}

function checkPageLoadedByBtn(previousBtn) {
    const nextBtn = locateNextBtn();
    const docName = locateCurDocName();
    return typeof nextBtn !== "undefined" && nextBtn !== previousBtn && docName !== tempDocName;
}

function checkPageInitialLoad() {
    return typeof ext_getCurrentTransaction === "function" && ext_getCurrentTransaction() &&
        ext_getCurrentTransaction().$ ? ext_getCurrentTransaction().$('#fieldContainer').children().length !== 0 : false;
}

function getLastLoadedWidget(pageName) {
    const page = getAgreementPageByName(pageName).PAGE[0];
    return getLastValidWidget(page.AbsFields) || getLastValidWidget(page.DivFields) || getLastValidWidget(page.RelFields);
}

function getLastValidWidget(widgetArr) {
    if (widgetArr.length <= 0)
        return null;
    let widget;

    for (var i = widgetArr.length - 1; i >= 0; i--) {
        if (widgetArr[i].type <= 15) {
            widget = widgetArr[i];
            break;
        }
    }

    return typeof widget !== "undefined" ? widget : null;
}

function getAgreementPageByName(pageName) {
    const pages = ext_getAgreementInterface().agreements;
    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        if (page.docName == pageName)
            return page;
    }
    return null;
}

function getPageNumberByName(pageName) {
    const pages = ext_getAgreementInterface().agreements;
    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        if (page.docName == pageName)
            return i + 1;
    }
    return null;
}

function getHTMLWidget(id) {
    return ext_getDocument().querySelector('[data-uid=' + id + ']');
}

function numberFormatField(widget) {
    const formattedValue = ext_getAgreementInterface().formatNumberFormatField(widget.getId(), widget, widget.getValue());
    widget.setValue(formattedValue);
}

function ext_setValueByName(name, value) {
    if (hasCompoundController()) {
        compoundController.currentTransaction.setFieldValueByName(name, value);
    } else {
        setFieldValueByName(name, value);
    }
}

function ext_getValueByName(name) {
    return hasCompoundController() ? compoundController.currentTransaction.getFieldValueByName(name) : getFieldValueByName(name);
}

function ext_getFieldByName(name) {
    return hasCompoundController() ? compoundController.currentTransaction.getFieldByName(name) : getFieldByName(name);
}

function ext_getFieldById(id) {
    return hasCompoundController() ? compoundController.currentTransaction.getFieldById(id) : getFieldById(id);
}

function getSeleniumJsonClickedSDs() {
    return (curDocInfo.status) < 15 ? seleniumJson.clickedSDs : seleniumJson.clickedSDs_recipient;
}

function getUploadedJsonClickedSDs() {
    return (curDocInfo.status) < 15 ? uploadedJson.clickedSDs : uploadedJson.clickedSDs_recipient;
}

function autoCloseAddAttachmentDialog() {
    var dialog = document.querySelector("ae-dialog-add-attachment");
    if (dialog && dialog.opened) {
        dialog.close();
    }
}

function detectErrorDialog() {
    var errorDialog = hasCompoundController() ? document.querySelector("ae-dialog-error-message") : document.getElementById("errorMsgPopup");
    return errorDialog && isVisible(errorDialog);
}

function detectSaveAndSendPanel() {
    var sendPanel = hasCompoundController() ? document.querySelector("ae-dialog-save-send") : document.querySelector("div#sendMail");
    return sendPanel && isVisible(sendPanel);
}

//------------------------------------Recording-----------------------------------

/**
 * Adds recording purpose click listeners to All buttons on the page,
 */
function addClickListenerToFields() {
    var buttons = ext_getDocument().querySelectorAll('a, rect');
    var datefields = ext_getDocument().getElementsByClassName('aexDatePicker');
    var steppers = document.querySelectorAll("div.ae-lp-stepper.title");

    //buttons
    for (var i = 0; i < buttons.length; i++) {
        if (isVisible(buttons[i])) {
            if (isNextBtn(buttons[i]) || isPrevBtn(buttons[i])) {
                buttons[i].addEventListener('mouseover', handleMouseoverNextPrevButton);
            }
            buttons[i].addEventListener('click', handleElementsFromEvents);
        }
    }

    //date picker
    for (var i = 0; i < datefields.length; i++) {
        if (isVisible(datefields[i])) {
            datefields[i].addEventListener('click', handleElementsFromEvents);
        }
    }

    //stepper
    Array.from(steppers).forEach(stepper => stepper.addEventListener('mouseover', handleMouseoverNextPrevButton));

    //document
    document.addEventListener('click', handleElementsFromEvents);
}

/**
 * Adds onchange listener 
 */
function addOnChangeListenerToInputFields() {
    var fields = ext_getDocument().querySelectorAll('textarea,input,select');
    fields.forEach(field => field.addEventListener('change', handleElementsFromEvents));
}

/**
 * Adds listener for ae-dialog-switch-document
 */
function addClickListnerForSwitchDocDialog() {
    var dialog = document.querySelector("ae-dialog-switch-document[role=dialog]");
    if (dialog && dialog.opened) {
        dialog.$.yes.addEventListener("click", PageNavigationInSD);
    };
}

/**
 * Adds listener for signatures
 */
function addListenerToSignatureElements() {
    ext_getDocument().querySelectorAll('rect').forEach(rect => rect.addEventListener("click", handleElementsFromEvents));
}

/**
 * combine click and onchange listeners
 */
function addListenersToFields() {
    addClickListenerToFields();
    addOnChangeListenerToInputFields();
}

/**
 * add listener for save and send button
 */
function addListenerForSendButton() {

    var sendButton = hasCompoundController() ? document.querySelector("#agreementSaveAndSendBtn") : document.querySelector("#sendBtn");
    if (sendButton) {
        sendButton.addEventListener("click", () => {
            setTimeout(() => {
                saveEntriesToJson();
                recordSaveAndSendInfo();
            }, 1000);
        });
    }
}

/**
 * remove all listeners
 */
function removeAllListeners() {
    var fields = ext_getDocument().querySelectorAll('a, textarea, input, select');
    var dialog = document.querySelector("ae-dialog-switch-document[role=dialog]");
    var datefields = ext_getDocument().getElementsByClassName('aexDatePicker');
    var steppers = document.querySelectorAll("div.ae-lp-stepper.title");

    for (var i = 0; i < fields.length; i++) {
        if (fields[i].tagName === 'A') {
            if (isNextBtn(fields[i]) || isPrevBtn(fields[i])) {
                fields[i].removeEventListener('mouseover', handleMouseoverNextPrevButton);
            }
            fields[i].removeEventListener('click', handleElementsFromEvents);

        } else {
            fields[i].removeEventListener('change', handleElementsFromEvents);
        }
    }

    Array.from(steppers).forEach(stepper => stepper.removeEventListener('mouseover', handleMouseoverNextPrevButton));
    Array.from(datefields).forEach(dp => dp.removeEventListener('click', handleElementsFromEvents));

    if (dialog) {
        dialog.$.yes.removeEventListener("click", PageNavigationInSD);
    }

    if (isPageSD()) {
        ext_getDocument().querySelectorAll('rect').forEach(rect => rect.removeEventListener("click", handleElementsFromEvents));
    }

    document.removeEventListener('click', handleElementsFromEvents);
}

/**
 * Handle hover next/prev button, save page entries to json
 * @param {event} e 
 */
function handleMouseoverNextPrevButton(e) {
    e.target.focus();
    setTimeout(() => {
        saveEntriesToJson();
    }, 200);
}

/**
 * handle all event from listeners
 * @param {event} e 
 */
function handleElementsFromEvents(e) {
    var target = e.target;
    var element = target ? e.target : e;
    checkCompleteDialog = false;

    if (isNavBtnForSwitchSDs(element)) {
        PageNavigationInSD();
    } else if (isNavBtnForSwitchSDsubpages(element)) {
        pageSubNavigationInSD();
    } else if (isPrevBtn(element)) {
        transactionPrevNextHandler(true);
    } else if (isNextBtn(element)) {
        transactionPrevNextHandler();
    } else if (isTitleStepper(element)) {
        transactionPrevNextHandler();
    } else if (isVisible(element)) {
        if (isDatePicker(element)) {
            datePickerCounter = 0;
            trackChangesForDatePicker(element, element.value);
        } else if (isSignatureElement(element)) {
            handleSignatureClicked(element);
        } else if (!isUselessElement(element)) {
            setTimeout(() => {
                saveFieldToPageEntry(element);
            }, 100);
        }
    }
}

/**
 * Handle click for prev/next button
 * @param {boolean} goBack true for going back, false for going forward
 */
function transactionPrevNextHandler(goBack) {
    if (lastClick >= (Date.now() - delay)) {
        return;
    }
    lastClick = Date.now();

    var msg = goBack ? "Going back previous page..." : "Going to next page...";
    msgBox.print(msg);
    waitforPageChangeForRecord();
}

/**
 * Handle click for signature element 
 * @param {*} element 
 */
function handleSignatureClicked(element) {
    saveFieldToPageEntry(element.parentElement);
    setTimeout(() => {
        var signPanel = document.querySelector("ae-dialog-sign");
        if (signPanel && signPanel.opened) {
            //first time click signature and enter password
            saveSignatureInfoToJSON(signPanel);
        } else {
            actionsAfterSignatureClicked();
        }
    }, 1000);
}

/**
 * Save Field to Page Entry Array
 * @param {*} element 
 */
function saveFieldToPageEntry(element) {
    var entry = generateFieldEntry(element);

    if (!searchAndUpdateDupEntry(entry)) {
        addEntryToPageEntryArray(entry);
    }
}

/**
 * Generate field entry
 * @param {*} element 
 */
function generateFieldEntry(element) {
    var entry = {
        tagName: element.tagName,
        name: element.name,
        options: ext_getValueByName(element.name),
        isDate: isDatePicker(element),
        type: element.getAttribute("type"),
        id: element.id,
        isRequired: element.classList.contains("required")
    };

    if (isPageSD()) {
        entry.subPageNo = (entry.tagName === "svg") ? ext_getAgreementInterface().currentDoc.currentPage : ext_getFieldById(entry.id).page;
    }

    return entry;
}

/**
 * Search PageEntryArray if entry already exist, update. Else, addEntryToPageEntryArray.
 * @param {Object} entry 
 */
function searchAndUpdateDupEntry(entry) {
    for (let i = 0; i < pageEntryArray.length; i++) {
        if (isDupEntry(pageEntryArray[i], entry)) { // check if entry already exist
            if (isEmpty(entry.options)) {   //check if new entry's value is empty
                pageEntryArray.splice(i, 1);
                sendLogMsgToBackground("Remove entry from Page Array - " + entry.name);
                msgBox.print("Remove entry - " + entry.name);
                sendLogMsgToBackground(pageEntryArray);
                sendMsgforRecord();
            } else if (entry.options && entry.options !== pageEntryArray[i].options) { // check if new entry's value is same as old one
                pageEntryArray[i] = entry;
                sendLogMsgToBackground("Update data entry - " + entry.name + " : " + entry.options);
                msgBox.print("Update data entry - " + entry.name + " : " + entry.options);
                sendLogMsgToBackground(pageEntryArray);
                sendMsgforRecord();
            } else {
                sendLogMsgToBackground("Entry remains the same - " + entry.name);
            }
            return true;
        }
    }
    return false;
}

/**
 * Add entry to pageEntryArray
 * @param {Object} entry 
 */
function addEntryToPageEntryArray(entry) {
    if (entry.tagName !== "svg" && isEmpty(entry.options)) { //do not save entry with empty value, except signatures
        sendLogMsgToBackground("Skip empty entry - " + entry.name);
        return;
    }

    pageEntryArray.push(entry);
    pageEntryArray = pageEntryArray.filter(function (n) {
        return n != undefined
    });

    sendLogMsgToBackground(pageEntryArray);
    sendMsgforRecord();
    msgBox.print(pageEntryArray.length + " inputs are recored in current page");
}

/**
 * Compare two entries if same
 * @param {Object} oldEntry 
 * @param {Object} newEntry 
 */
function isDupEntry(oldEntry, newEntry) {
    return (newEntry.tagName === "svg" && oldEntry.id === newEntry.id) || (oldEntry.name === newEntry.name && oldEntry.id === newEntry.id);
}

/**
 * Add signature info to json
 * @param {*} signPanel 
 */
function saveSignatureInfoToJSON(signPanel) {
    var signBtn = signPanel.querySelector('paper-button#sign');

    if (signBtn) {
        signBtn.addEventListener("click", () => {
            var sigData = {
                user: signPanel.user,
                password: signPanel.password,
                sigId: signPanel.sigId
            }

            for (var i = 0; i < seleniumJson.sigData.length; i++) {
                if (seleniumJson.sigData[i].user === sigData.user) {
                    seleniumJson.sigData.splice(i, 1);
                }
            }
            seleniumJson.sigData.push(sigData);
            setTimeout(() => {
                actionsAfterSignatureClicked();
            }, 200);
        })
    }

}

/**
 * Once signature clicked, check if a pop-up shows up to save and send
 * 
 */
function actionsAfterSignatureClicked() {
    checkCompleteDialog = true;
    startCheckingSigingCompleteDialog();
    addClickListnerForSwitchDocDialog();
    addListenerToSignatureElements();
}

/**
 * display confirm box to ask user to stop recording if complete dialog shows up
 */
function startCheckingSigingCompleteDialog() {
    if (!stop && checkCompleteDialog) {
        //check if signing complete dialog pop up
        if (detectSigningCompleteDialog()) {
            saveEntriesToJson();
            cfmBox.print(4);
        } else {
            setTimeout(() => {
                startCheckingSigingCompleteDialog();
            }, 1000);
        }
    }
}

/**
 * tracking if a date picker element value changes
 * @param {*} element 
 * @param {String} oldValue 
 */
function trackChangesForDatePicker(element, oldValue) {
    var curValue = element.value;

    if (curValue !== oldValue) {
        datePickerCounter = 0;
        saveFieldToPageEntry(element);
    } else {
        if (hasExceedWaitTime(datePickerCounter)) {
            datePickerCounter = 0;
        } else {
            datePickerCounter++;
            setTimeout(() => {
                trackChangesForDatePicker(element, oldValue);
            }, checkFrequencyTime);
        }
    }
}

/**
 * show spinner when switching documents in SD for recording
 */
function PageNavigationInSD() {
    sendLogMsgToBackground("Page Navigation in SD");
    saveEntriesToJson();
    setTimeout(() => {
        spinner(true, "Wait for Recorder to be ready");
    }, 500);
    setTimeout(() => {
        spinner(true, "Wait for Recorder to be ready");
    }, 1000);
    setTimeout(() => {
        addClickListnerForSwitchDocDialog();
        recordNewPage();
        msgBox.print("Recording page - " + locateCurDocName());
        spinner(false);
    }, 2000);    //wait SD page switch to load
}

/**
 * show spinner when switching pages for one document in SD during recording
 */
function pageSubNavigationInSD() {
    sendLogMsgToBackground("Sub Page Navigation in SD");
    setTimeout(() => {
        spinner(true, "Wait for Recorder to be ready");
    }, 500);
    setTimeout(() => {
        spinner(true, "Wait for Recorder to be ready");
    }, 1000);
    setTimeout(() => {
        addClickListenerToFields();
        addOnChangeListenerToInputFields();
        spinner(false);
    }, 2000);
}

/**
 * Save the document name/id to JSON when clicking a SD during recording
 * so that we know which document needs to playback
 */
function dataEntryClickedSDs() {
    for (var i = 0; i < getSeleniumJsonClickedSDs().length; i++) {
        if (getSeleniumJsonClickedSDs()[i].docName === locateCurDocName()) {
            getSeleniumJsonClickedSDs().splice(i, 1);
        }
    }

    var data = {
        docName: locateCurDocName(),
        docID: locateCurDocId()
    };

    getSeleniumJsonClickedSDs().push(data);
}

/**
 * update page number in json
 */
function rearragePageNo() {
    for (var i = 0; i < getSeleniumJsonPages().length; i++) {
        getSeleniumJsonPages()[i].pageNumber = i + 1;
    }
}

/**
 * return a JSON object with all information for recording a page 
 */
function buildPageEntryJson() {
    return {
        pageNumber: getSeleniumJsonPages().length + 1,
        docName: tempDocName,
        docID: tempDocID,
        isSD: isPageSD(),
        entries: pageEntryArray
    };
}

/**
 * search and return the next button on current page
 */
function locateNextBtn() {
    var fields = ext_getDocument().querySelectorAll('a');

    for (var i = 0; i < fields.length; i++) {
        if (String(fields[i].id).includes("uField") && isNextBtn(fields[i])) {
            return fields[i];
        }
    }

    return null;
}

/**
 * return true if page changed by comparing tempDocName and curDocName
 */
function updateDocumentInfo() {
    var curDocName = locateCurDocName();
    if (!tempDocName) {
        tempDocName = locateCurDocName();
        tempDocID = locateCurDocId();
    }

    if (curDocName !== tempDocName) {
        tempDocName = curDocName;
        tempDocID = locateCurDocId();
        return true;
    } else {
        return false;
    }
}

/**
 * check if page is changed by comparing the document name
 * if changed, continue recording. else, stop checking after 10 seconds
 */
function waitforPageChangeForRecord() {
    const pageChange = updateDocumentInfo();

    if (pageChange) {
        pageChangeCounter = 0;
        waitForElementToDisplayToRecord(tempDocName);
    } else {
        if (detectSaveAndSendPanel()) {
            recordSaveAndSendInfo();
            pageChangeCounter = 0;
        } else {
            if (hasExceedWaitTime(pageChangeCounter)) {
                pageChangeCounter = 0;
            } else {
                pageChangeCounter++;
                setTimeout(function () {
                    waitforPageChangeForRecord();
                }, checkFrequencyTime);
            }
        }
    }
}

/**
 * Save save and send information in JSON file and send to extension
 */
function recordSaveAndSendInfo() {
    msgBox.print("Send draft to recipients");
    var sendPanel = hasCompoundController() ? document.querySelector("ae-dialog-save-send") : document.querySelector("div#sendMail");
    if (sendPanel) {
        if (hasCompoundController()) {
            var sendButton = sendPanel.$.createAgreement;
            sendButton.addEventListener("click", function () {
                seleniumJson.sendPanelInfo = {
                    recipientList: sendPanel.recipientList,
                    recipientList2: sendPanel.recipientList2,
                    ccList: sendPanel.ccList,
                    message: sendPanel.message,
                    subject: sendPanel.subject
                };

                sendMsgforRecord();
                msgBox.print("Open link from email or open as signer to continue recording");
            });
        } else {
            var sendButton = sendPanel.querySelector("button#createAgreementBtn");
            sendButton.addEventListener("click", function () {
                var recipientList = [];
                var ccList = [];
                sendPanel.querySelectorAll("input[type=email]").forEach(input => {
                    if (isVisible(input)) {
                        if (input.id.includes("linksigid")) {
                            recipientList.push(input.placeholder);
                        } else {
                            ccList.push(input.placeholder);
                        }
                    }
                })

                seleniumJson.sendPanelInfo = {
                    recipientList,
                    ccList,
                    message: sendPanel.querySelector("#agreementExpressEmailSendingSubiect").value,
                    subiect: sendPanel.querySelector("#agreementExpressEmailSendingMessageBody").value
                };

                sendMsgforRecord();
            });
        }
    }
}

/**
 * After page is changed, we need to wait for HTML load complete in compoundController
 * Then apply listeners
 * @param {String} pageName 
 */
function waitForElementToDisplayToRecord(pageName) {
    if (stop) {
        sendLogMsgToBackground("Recording stopped");
        removeAllListeners();
        spinner(false);
    } else {
        if (checkPageLoadedByDom(pageName)) {
            setTimeout(() => {
                msgBox.print("Recording page: " + pageName);
                recordNewPage();
                spinner(false);
                pageLoadCounter = 0;
            }, pageLoadedDelay);
        } else {
            if (hasExceedWaitTime(pageLoadCounter)) {
                spinner(false);
                pageLoadCounter = 0;
                return;
            } else {
                sendLogMsgToBackground("Still waiting for " + pageName);
                pageLoadCounter++;
                spinner(true, "Wait for Recorder to be ready");
                setTimeout(function () {
                    waitForElementToDisplayToRecord(pageName);
                }, checkFrequencyTime);
            }
        }
    }
}

/**
 * check if all required fields on current page are fulfilled
 */
function checkAllValidationFullfilled() {
    var docName = locateCurDocName();
    var agreements = ext_getAgreementInterface().agreements;
    var pageNo = -1;

    for (var i = 0; i < agreements.length; i++) {
        if (agreements[i].docName == docName) {
            pageNo = i;
            break;
        }
    }

    if (pageNo == -1) {
        sendLogMsgToBackground("No matched document");
    } else if (agreements[pageNo].getRequiredFieldCount() != 0) {
        return false;
    }

    return true;
}

//============================Playback========================================

/**
 * Run javascript on AEX widgets when entering field's value
 * @param {*} element 
 */
function runJS(element) {
    if (element) {
        try {
            if (typeof element.runOnChangeJS === "function") {
                element.runOnChangeJS();
            }

            if (typeof element.runOnBlurJS === "function") {
                element.runOnBlurJS();
            }
        } catch (err) {
            sendLogMsgToBackground("Encounter runJS error: " + err);
        }
    }
}

/**
 * Transpose the value to all documents when entering field's value
 * @param {*} id 
 */
function transposeValue(id) {
    ext_getAgreementInterface().transpose(id);
}

/**
 * Change a text widget's value
 * @param {Object} field 
 */
function changeFieldValue(field) {
    var name = field.name;
    var id = field.id;
    var text = field.options;
    var iframeElement = ext_getFieldByName(name);

    if (iframeElement) {
        sendLogMsgToBackground("Entering Data...");
        ext_setValueByName(name, text);
        runJS(iframeElement);
        //work around for scenario when custom js clear the value unexpectly after runJS
        if (ext_getValueByName(name) !== text) {
            ext_setValueByName(name, text);
        }
        numberFormatField(iframeElement);
        transposeValue(id);
        sendLogMsgToBackground("Field '" + name + "' value: " + iframeElement.value);
        msgBox.print("Entering field - " + name + " - " + iframeElement.value);
    } else {
        sendLogMsgToBackground("Field '" + name + "' is not found, skipped!");
    }
}

/**
 * Click buttons
 * @param {*} id 
 */
function clickElementById(id) {
    var iframeElement = ext_getDocument().getElementById(id);
    var field = ext_getFieldById(id);

    if (iframeElement) {
        sendLogMsgToBackground("Entering Data...");
        runJS(field);
        iframeElement.click();
        sendLogMsgToBackground("Click Element: " + iframeElement.name);
    } else {
        sendLogMsgToBackground("Field '" + id + "' is not found, skipped!");
    }
}

/**
 * Click signatures, and enter password if needed
 * @param {*} sigId 
 */
function enterSignatureBySigId(sigId) {
    sendLogMsgToBackground("Entering Signatures: " + sigId);
    ext_getAgreementInterface().signatureClicked(sigId.substring(0, sigId.length - 5));

    if (hasCompoundController()) {
        var signDialog = document.querySelector("ae-dialog-sign#signDialog");
        if (signDialog && signDialog.opened) {
            var sigInfo = getSignatureInfoFromUploadedJson(sigId);
            if (sigInfo.password) {
                signDialog.password = sigInfo.password;
                signDialog.sign();
            } else {
                signDialog.close();
            }
        }
    } else {
        var signDialog = document.querySelector("#dialogIT-popup");
        if (signDialog && isVisible(signDialog)) {
            var sigInfo = getSignatureInfoFromUploadedJson(sigId);
            if (sigInfo.password) {
                signDialog.querySelector("input#password").value = sigInfo.password;
                var signButton = signDialog.querySelector("a#acceptbutton");
                if (signButton) {
                    signButton.click();
                }
            } else {
                var cancelButton = signDialog.querySelector("a[data-rel=back]");
                if (cancelButton) {
                    cancelButton.click();
                }
            }
        }
    }

}

/**
 * get signature id, username and password
 */
function getSignatureInfoFromUploadedJson(sigId) {
    var sigInfo = {};

    if (hasCompoundController()) {
        var svg = ext_getDocument().getElementById(sigId);
        var user = svg ? svg.querySelectorAll("tspan")[svg.querySelectorAll("tspan").length - 1].innerHTML : "";
    } else {
        var user = document.querySelector("#dialogIT-popup input#signer").value;
    }


    if (uploadedJson.sigData.length) {
        uploadedJson.sigData.forEach(sig => {
            if (sigId.includes(sig.sigId) || user === sig.user) {
                sigInfo = sig;
            }
        });

    }

    return sigInfo;
}

/**
 * Enter field by widget types
 * @param {int} pageIndex 
 * @param {int} entryIndex 
 */
function enterFieldEntryByPage(pageIndex, entryIndex) {
    if (!playback) {
        sendLogMsgToBackground("Playback stopped");
        return;
    }

    autoCloseAddAttachmentDialog();

    var pageEntry = getUploadedJsonPages()[pageIndex].entries;
    var field = pageEntry[entryIndex];
    var curSubPageNo = ext_getAgreementInterface().currentDoc.currentPage;

    if (isPageSD() && field.subPageNo && curSubPageNo !== field.subPageNo) { //when playback in SDs, switch sub pages if needed
        //switch sub page in SDs
        switchSubPageForSDs(pageIndex, entryIndex, field.subPageNo);
    } else {
        try {
            var fieldElement = field.id ? ext_getDocument().getElementById(field.id) : ext_getDocument().getElementsByName(field.name)[0];

            if (fieldElement) {
                //center the field on screen for demo mode
                scrollPageToCenterField(fieldElement);

                if (isVisible(fieldElement)) {
                    if (field.tagName === "INPUT" || field.tagName === "SELECT" || field.tagName === "TEXTAREA") {                        
                        //text, dropdown, textarea
                        inputFieldInPage(field);
                    } else if (field.tagName === "A" && !isNextBtn(fieldElement) && !isPrevBtn(fieldElement)) {
                        //button
                        clickElementById(field.id);
                    } else if (field.tagName === "svg") {
                        //signature
                        enterSignatureBySigId(field.id);
                    }
                } else {
                    sendLogMsgToBackground("Hidden field: " + field.name + " - Skipped");
                }

            } else {
                sendLogMsgToBackground("Unable to locate HTML Element: " + field.name + " - Skipped");
            }
            goingToNextEntry(pageIndex, entryIndex + 1);

        } catch (err) {
            sendLogMsgToBackground("Error entering field: " + field.name + " - Skipped");
            console.error(err);
            goingToNextEntry(pageIndex, entryIndex + 1);
        }
    }
}

/**
 * Checking if the input field is recorded in a old way (version old than 1.0.11)
 * @param {Object} field 
 */
function inputFieldInPage(field) {
    //first two conditions handle old json file
    if (isUsingOldJSON() && field.type === 'radio') {
        clickRadioButton(field.name, field.options);
    } else if (isUsingOldJSON() && field.type === 'checkbox') {
        clickCheckBox(field.name, field.options);
    } else if (!(field.isDate && ext_getValueByName(field.name) === field.options)) {
        changeFieldValue(field);
    } else {
        sendLogMsgToBackground("Skip date - " + field.name);
    }
}

/**
 * Switch sub page number in SD and continue playback
 * @param {Int} pageIndex 
 * @param {Int} entryIndex 
 * @param {Int} subPageNo 
 */
function switchSubPageForSDs(pageIndex, entryIndex, subPageNo) {
    if (hasCompoundController()) {
        compoundController.clickedToPage(subPageNo);
    } else {
        agreementInterface.switchPage(subPageNo)
    }

    checkSubPageLoadedAndContinueEnterField(pageIndex, entryIndex);
}

/**
 * After swiching sub page, check if page is loaded with specified element
 * if loaded, continue playback, else, stop waiting after max time
 * @param {Int} pageIndex 
 * @param {Int} entryIndex 
 */
function checkSubPageLoadedAndContinueEnterField(pageIndex, entryIndex) {
    var pageEntry = getUploadedJsonPages()[pageIndex].entries;
    var field = pageEntry[entryIndex];
    var element = ext_getDocument().getElementById(field.id);

    if (!element && !hasExceedWaitTime(pageChangeCounter)) {
        pageChangeCounter++;
        setTimeout(() => {
            checkSubPageLoadedAndContinueEnterField(pageIndex, entryIndex);
        }, checkFrequencyTime);
    } else {
        pageChangeCounter = 0;
        setTimeout(() => {
            enterFieldEntryByPage(pageIndex, entryIndex);
        }, 500);
    }

}

/**
 * Check page change for playback by comparing the document name
 */
function waitforPageChangeForPlayback() {
    var pageChange = updateDocumentInfo();
    if (pageChange) {
        waitForElementToDisplayForPlayBack(tempDocName);
        pageChangeCounter = 0;
    } else {
        if (detectErrorDialog()) {
            msgBox.showResumeBtn(true);
            pageChangeCounter = 0;
        } else {
            const waitTime = 4000;
            if (hasExceedWaitTime(pageChangeCounter, waitTime) || !checkAllValidationFullfilled()) {
                msgBox.showResumeBtn(true);
                pageChangeCounter = 0;
            } else {
                pageChangeCounter++;
                setTimeout(() => {
                    waitforPageChangeForPlayback()
                }, checkFrequencyTime);
            }
        }
    }
}

/**
 * After completing playback publisher data, continue playback recipient data
 */
function preparePlaybackRecipientMode() {
    if (hasCompoundController()) {
        enterRecipientEmails();
        setTimeout(() => {
            attemptOpenSendPanel();
        }, 1000);
    } else {
        sendToRecipientFromSimq();
    }
}

/**
 * enter recipient emails in save and send panel
 */
function enterRecipientEmails() {
    var recipientList = uploadedJson.sendPanelInfo.recipientList2;

    recipientList.forEach(recipient => {
        if (validateEmail(recipient.email)) {
            sendLogMsgToBackground("Swap email:" + recipient.originalLabel + " => " + recipient.email);
            for (var i = 0; i < compoundController.transactions.length; i++) {
                var curTrans = compoundController.transactions[i];
                var emailToReplace = getSaveAndSendEmailByOriginalLabel(curTrans.signingViewer, recipient.originalLabel);
                curTrans.signingViewer.swapSigEmails(emailToReplace, (recipient.level === 1) ? replaceEmailHostName(recipient.email) : recipient.email);
            }
        }
    })
}

/**
 * Get the email that is needed to be replaced 
 * @param {*} curSigningViewer 
 * @param {*} label 
 */
function getSaveAndSendEmailByOriginalLabel(curSigningViewer, label) {
    var sasEmailList = curSigningViewer.getSaveAndSendEmailObjects().emailObjList;
    var email = label;
    Object.keys(sasEmailList).forEach(key => {
        if (sasEmailList[key].originalLabel === label) {
            email = sasEmailList[key].email;
        }
    })
    return email;
}

/**
 * open save and send panel for MV2 or simq
 */
function attemptOpenSendPanel() {
    if (isPageSD()) {
        compoundController.launchCorrectPanel()
    } else {
        ext_getAgreementInterface().navigationNext();
    }

    setTimeout(() => {
        if (detectSaveAndSendPanel()) {
            sendAgreementToRecipient();
        } else {
            sendCompleteMessage(true);
        }
    }, 1000);
}

/**
 * email recipient from simq
 */
function sendToRecipientFromSimq() {
    ext_getAgreementInterface().saveAndSend();
    setTimeout(() => {
        if (document.querySelector("#publishedAgreement-popup") && isVisible(document.querySelector("#publishedAgreement-popup"))) {
            sendMsgToContentScript("FROM_PAGE_START_PLAYBACK_RECIPIENT");
            if (uploadedJson.pages_recipient.length) {
                msgBox.print("Open transaction in recipient mode in 3 seconds...");
                setTimeout(() => {
                    window.close();
                }, 3000);
            } else {
                sendCompleteMessage(true);
            }
        }
    }, 4000);
}

/**
 * email recipient from MV2
 */
function sendAgreementToRecipient() {
    var sendPanel = document.querySelector("ae-dialog-save-send");
    sendPanel.ccList = uploadedJson.sendPanelInfo.ccList;
    sendPanel.subject = uploadedJson.sendPanelInfo.subject ? uploadedJson.sendPanelInfo.subject : "Title";
    sendPanel.message = uploadedJson.sendPanelInfo.message ? uploadedJson.sendPanelInfo.message : " ";
    sendPanel.createAgreement();
    detectPublishedDialogAndClosePage();
}

/**
 * check if published dialog shows up. 
 */
function detectPublishedDialogAndClosePage() {
    var publishedDialog = document.querySelector("ae-dialog-published-agreement");
    var accessProtectionDialog = document.querySelector("ae-dialog-enhanced-access-protection-setup");

    if (!uploadedJson.pages_recipient.length) {
        sendCompleteMessage(true);
    } else {
        if (publishedDialog) {
            msgBox.print("Open transaction in recipient mode in 3 seconds...");
            sendMsgToContentScript("FROM_PAGE_START_PLAYBACK_RECIPIENT");
            setTimeout(() => {
                window.close();
            }, 3000);
        } else if (accessProtectionDialog) {
            msgBox.print("Open link from email maunally to continue playback in recipient mode...");
        } else {
            setTimeout(() => {
                detectPublishedDialogAndClosePage();
            }, checkFrequencyTime);
        }
    }
}

/**
 * if the user block is empty, remove it from save and send panel
 */
function removeEmptyUserBlock() {
    var sendPanel = document.querySelector("ae-dialog-save-send");

    if (sendPanel) {
        sendPanel.querySelectorAll("ae-user-block").forEach(userBlock => {
            if (!userBlock.email.includes("@qa.aexclienttest.net")) {
                sendPanel.removeEmail = userBlock.email;
                sendPanel.doRemoveRecipient();
            }
        })
    } else {
        sendErrorMessage(7);
    }

}

/**
 * if the input email is not a maillator email, replace it.
 * @param {String} email 
 */
function replaceEmailHostName(email) {
    return email.split("@")[0] + "@qa.aexclienttest.net";
}

/**
 * resume playback for a pause mode or error detect
 */
function resumePlayback() {
    msgBox.hideResumeBtn();

    if (isPageSD()) {
        autoCloseSwitchDocDialog();
        sendCompleteMessage();
    } else {
        if (locateCurDocName() === getUploadedJsonPages()[getUploadedJsonPages().length - 1].docName) {
            sendCompleteMessage();
        } else {
            clickToNextPageAndContinuePlayback();
        }
    }
}

/**
 * After page change during playback, check if HTML is loaded completed and continue playback
 * @param {String} pageName 
 */
function waitForElementToDisplayForPlayBack(pageName) {
    if (!playback) {
        sendLogMsgToBackground("Stop called in WFED");
        removeAllListeners();
    } else {
        if (checkPageLoadedByDom(pageName)) {
            setTimeout(() => {
                pageLoadCounter = 0;
                FindPageEntryInJSON();
                sendLogMsgToBackground("Page load complete");
                msgBox.print("Playback --" + pageName);
            }, pageLoadedDelay);
        } else {
            if (hasExceedWaitTime(pageLoadCounter)) {
                sendLogMsgToBackground("Stop waiting page load.");
                pageLoadCounter = 0;
            } else {
                pageLoadCounter++;
                setTimeout(function () {
                    waitForElementToDisplayForPlayBack(pageName);
                }, checkFrequencyTime);
            }
        }
    }
}

//==============code for old JSON file===================

function getSelectOptions(select) {
    let arr = [];
    for (var i = 0; i < select.length; i++) {
        arr.push(select[i].value);
    }
    return arr;
}

function getSelectedOptionValue(select) {
    if (select.selectedIndex == -1) {
        return getSelectOptions(select)
    }
    return select.options[select.selectedIndex].value;
}


function getCheckedRadioButton(radio) {
    var radioOptions = ext_getDocument().getElementsByName(radio);
    for (var i = 0; i < radioOptions.length; i++) {
        if (radioOptions[i].checked) {
            return i + 1;
        }
    }
}


function clickRadioButton(name, option) {
    var iframeElements = ext_getDocument().getElementsByName(name);
    var field = ext_getFieldByName(name);

    if (typeof iframeElements !== "undefined" && iframeElements.length >= option) {
        sendLogMsgToBackground("Entering Data...");
        iframeElements[option - 1].click();
        runJS(field);
        sendLogMsgToBackground("Click Element: " + name);
    } else {
        sendLogMsgToBackground("Field '" + name + "' is not found, skipped!");
    }
}

function clickCheckBox(name, value) {
    var iframeElements = ext_getDocument().getElementsByName(name);
    var field = ext_getFieldByName(name);

    if (iframeElements && iframeElements.length !== 0) {
        for (var i = 0; i < iframeElements.length; i++) {
            if (iframeElements[i].checked != value) {
                sendLogMsgToBackground("Entering Data...");
                iframeElements[i].click();
                runJS(field);
                sendLogMsgToBackground("Click Element: " + name);
            }
        }
    } else {
        sendLogMsgToBackground("Field '" + name + "' is not found, skipped!");
    }

}

function selectElement(name, valueToSelect) {
    var field = ext_getFieldByName(name);

    if (field) {
        sendLogMsgToBackground("Entering Data...");
        ext_setValueByName(name, valueToSelect);
        runJS(field);
        field.runOnChangeJS();
        sendLogMsgToBackground("Field '" + name + "' value: " + valueToSelect);
    }
}


//=========================================DataEntryWorker==========================================

class DataEntryWorker { }

DataEntryWorker.numOfInputFields = 0;

DataEntryWorker.startDataEntryWork = () => {
    const tempNumber = DataEntryWorker.enterDataOnce();

    if (tempNumber == 0 || tempNumber == DataEntryWorker.numOfInputFields) {
        sendLogMsgToBackground("Complete Data Entry");
    } else {
        DataEntryWorker.numOfInputFields = tempNumber;
        setTimeout(() => {
            DataEntryWorker.startDataEntryWork();
        }, 300);
    }
}

DataEntryWorker.enterDataOnce = () => {
    const uFieldRegex = /^uField_(\d+|\d+\_\d+)$/;
    const curTrans = (typeof compoundController !== "undefined") ? compoundController.currentTransaction : this;
    const textInputs = Array.from(curTrans.document.querySelectorAll("input[type=text], textarea")).filter(
        input => input.id.match(uFieldRegex) !== null && isVisible(input) && isEmpty(curTrans.getFieldValueById(input.id)) && !input.disabled
    );
    const dropdownInputs = Array.from(curTrans.document.querySelectorAll("select")).filter(
        input => input.id.match(uFieldRegex) !== null && isVisible(input) && isEmpty(curTrans.getFieldValueById(input.id)) && !input.disabled
    );
    const checkboxInputs = Array.from(curTrans.document.querySelectorAll("input[type=checkbox]")).filter(
        input => input.id.match(uFieldRegex) !== null && isVisible(input) && !input.checked && !input.disabled
    );

    const radioInputs = Array.from(curTrans.document.querySelectorAll("input[type=radio]")).filter(
        input => input.id.match(uFieldRegex) !== null && isVisible(input) && !input.checked && !input.disabled
    );

    dropdownInputs.forEach(input => {
        let isExtendedLookup = curTrans.getFieldById(input.id).getConstraint("IS_EXTENDED_LOOKUP")
            && (curTrans.getFieldById(input.id).getConstraintValue("IS_EXTENDED_LOOKUP") === "true");
        let valueLabel = isExtendedLookup ? "value" : "@value";
        let options = isExtendedLookup ? curTrans.agreementInterface.lookupDataArray[curTrans.getFieldById(input.id).getConstraintValue("LOOKUP_NAME")]
            : curTrans.getFieldById(input.id).getConstraintValue("RANGE");
        if (options && options.length >= 2) {
            const randomOption = options[Math.floor(Math.random() * Math.floor(options.length - 2)) + 1][valueLabel];
            curTrans.setFieldValueByName(input.name, randomOption.replace(/ /g, "+"));
            curTrans.agreementInterface.transpose(input.id);

            if (!stop) {
                saveFieldToPageEntry(input);
            }
        }
    });

    textInputs.concat(checkboxInputs).forEach(input => {
        curTrans.setFieldValueById(input.id, DataEntryWorker.formatFieldName(input));
        curTrans.agreementInterface.transpose(input.id);
        if (!stop) {
            saveFieldToPageEntry(input);
        }
    });

    radioInputs.forEach(input => {
        if (isEmpty(curTrans.getFieldValueByName(input.name))) {
            let radioGroups = curTrans.document.getElementsByName(input.name);
            let selectedRadio = radioGroups[Math.floor(Math.random() * Math.floor(radioGroups.length - 1))];
            selectedRadio.click();
            if (!stop) {
                saveFieldToPageEntry(selectedRadio);
            }
        }
    })

    return textInputs.length + dropdownInputs.length;
}

DataEntryWorker.formatFieldName = (input) => {
    let formattedString;
    const name = input.name;
    const curTrans = (typeof compoundController !== "undefined") ? compoundController.currentTransaction : this;

    if (input.type == "checkbox") {
        formattedString = curTrans.getFieldById(input.id).checkedVal;
    } else {
        if (name.toLowerCase().indexOf("phone") > 0 || name.toLowerCase().indexOf("fax") > 0) {
            formattedString = "1234567890";
        } else if (name.toLowerCase().indexOf("number") > 0 || name.includes("SIN") || name.includes("SSN") || name.includes("TIN")) {
            formattedString = "555666777";
        } else if (name.toLowerCase().indexOf("email") > 0) {
            formattedString = curDocInfo.companyName.replace(/\s/g, '') + Math.floor(Math.random() * 100000 + 1) + "@"+ DataEntryWorker.emailDomain;
        } else if (name.includes("Zip") || name.toLowerCase().includes("postal")) {
            formattedString = "12345";
        } else if (name.includes("Website")) {
            formattedString = "www." + name + ".com";
        } else if (input.getAttribute("numberformattype") == "Number" || input.getAttribute("numberformattype") == "Currency") {
            formattedString = Math.floor(Math.random() * 10) + 1;
        } else {
            formattedString = name.replace(/([A-Z])/g, ' $1').trim();
        }
    }

    return formattedString;
} 