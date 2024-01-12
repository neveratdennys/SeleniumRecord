console.log("AEX Recorder ---- Content script (new viewer) successfully loaded!");

let documentInfoArray = [];
let inputWidgetsNo = 0;
let btnWidgetsNo = 0;
let comboboxWidgetNo = 0;
let dropdownlistWidgetsNo = 0;
let checkWidgetCounter = 0;
let checkDialogCounter = 0;
let checkNextPageCounter = 0;
let currentDialogDefinition = {};
let currentDialogActions = [];
let checkDialogGoneCounter = 0;
let trackingChanges = false;
const dateMap = new Map([[1, 'Jan'], [2, 'Feb'], [3, 'Mar'], [4, 'Apr'], [5, 'May'],
[6, 'Jun'], [7, 'Jul'], [8, 'Aug'], [9, 'Sep'], [10, 'Oct'],
[11, 'Nov'], [12, 'Dec']]);

/**
 * get dom element
 */
const getDocument = () => (typeof compoundController !== "undefined") ? compoundController.currentTransaction.document : document;

/**
 * check if element/entry is useless
 */
const isUselessElement = (element) => (element.tagName == "path") && !isDateFieldIconClicked(element);
const isEmptyEntry = (entry) => entry.id == "" && entry.name == "" && entry.options == "" && entry.type == "";

/**
 * check if this page is last page
 */
const isLastPage = () => (getCurrentDocumentInfo() == documentInfoArray[documentInfoArray.length - 1])
    || getUploadedJsonPages()[getUploadedJsonPages().length - 1].docName == getCurrentDocumentInfo().pageName;

/**
 * find elements
 */
const locateNextBtn = () => {
    let buttons = [];
    if (locateFooterDiv().childElementCount > 1) {
        buttons = locateFooterDiv().children[1].querySelectorAll('button');
    } else {
        buttons = locateFooterDiv().children[0].querySelectorAll('button');
    }
    for (let i = 0; i < buttons.length; i++) {
        if (buttons[i].firstChild.innerHTML == "Next") {
            return buttons[i];
        }
    }
    return null;
}
const locatePrevBtn = () => locateFooterDiv().childElementCount > 1 ? locateFooterDiv().children[0] : null;
const locateHeaderDiv = () => document.querySelector("div.tpl-page").parentElement.children[0];
const locateBodyDiv = () => document.querySelector("div.tpl-page");
const locateFooterDiv = () => document.querySelector("div.tpl-page").parentElement.children[2];
const locateButtonElements = () => document.querySelectorAll("div.tpl-page button");
const locateDropdownElements = () => document.querySelectorAll("div.tpl-page div[role=button]");
const locateInputElements = () => document.querySelectorAll("div.tpl-page input");
const locateComboboxInputs = () => document.querySelectorAll("div.tpl-page div[role=combobox] input[type=text]");
const locateDropdownInputs = () => document.querySelectorAll("div.tpl-page input[type=hidden]");
const locateDialog = () => document.querySelector('div[role="dialog"]') ? document.querySelector('div[role="dialog"]') : null;
const locateDialogTitle = () => locateDialog().querySelector('div[role="document"] h2');
const locateDialogInputs = () => locateDialog().querySelectorAll('input');
const locateDialogButtons = () => locateDialog().querySelectorAll('button');
const locateDialogBackDrop = () => locateDialog().querySelector('div[aria-hidden="true"]');



/**
 * find current document name 
 */
const locateCurDocName = () => getCurrentDocumentInfo().pageName;

/**
 * count number of widgets on the page
 */
const countInputWidgets = () => Array.from(locateInputElements()).filter((input) => input.type !== "hidden" && !input.id.includes('downshift')).length;
const countBtnWidgets = () => locateButtonElements().length;
const countComboboxWidgets = () => locateComboboxInputs().length;
const countDropdownlistWidgets = () => locateDropdownElements().length;

/**
 * check the type of user input element
 */
const isDropdownlistDivElement = (element) => element.tagName === "DIV" && element.getAttribute("role") === "button";
const isDropdownlistInputElement = (element) => isDropdownlistDivElement(element.parentElement.querySelector("div[role=button]"));
const isComboBoxInput = (element) => element.tagName === "INPUT" && element.parentElement.parentElement.parentElement.getAttribute("role") === "combobox";
const isCheckBoxInput = (element) => element.tagName === "INPUT" && element.type === "checkbox";
const isComboBoxDropDownArrowClicked = (element) => element.tagName === "svg" && element.parentElement.parentElement.type === "button"
    && element.parentElement.parentElement.parentElement.parentElement.parentElement.getAttribute("role") === "combobox";
const isButtonElementClicked = (element) => isButtonElement(element) || (element.parentElement && isButtonElement(element.parentElement));
const isButtonElement = (element) => isDescendant(locateBodyDiv(), element) && element.tagName === "BUTTON"
    && element.textContent != "" && element.type === "button";
const isPhoneCountrySpan = (element) => element.tagName === "SPAN" && element.classList.contains("flag-icon");
const isPhoneCountryIconClicked = (element) => isPhoneCountrySpan(element) || (element.tagName !== "INPUT"
    && element.parentElement.querySelector('span') && isPhoneCountrySpan(element.parentElement.querySelector('span')));
const isDatePickerPath = (element) => element.tagName === "path" && element.getAttribute("d") && element.getAttribute("d").includes("0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11");
const isDateFieldInput = (element) => element.parentElement && element.parentElement.querySelector("path") && isDatePickerPath(element.parentElement.querySelector("path"));
const isDateFieldIconClicked = (element) => isDatePickerPath(element) || ((element.tagName === "svg" || element.tagName === "BUTTON")
    && element.querySelector("path") && isDatePickerPath(element.querySelector("path")));

/**
 * detect error on page
 */
const detectErrorParagraph = () => document.querySelectorAll("input[aria-invalid=true]").length > 0;

/**
 * detect save and send panel
 */
const detectSaveAndSendPanel = () => document.querySelector("div[role=dialog] h2") && document.querySelector("div[role=dialog] h2").innerText === "Save and Send";

/**
 * check if page initial load complete 
 */
const checkPageInitialLoad = () => document.getElementsByClassName("tpl-page").length > 0 && document.getElementsByClassName("tpl-page")[0].querySelector(".tpl-section")
    && document.getElementsByClassName("tpl-page")[0].querySelector(".tpl-section").children.length > 0;

/**
 * check if a element is a descendant of another
 */
const isDescendant = (parent, child) => {
    let node = child.parentNode;
    while (node != null) {
        if (node == parent) {
            return true;
        }
        node = node.parentNode;
    }
    return false;
}

const updateWidgetsNo = () => {
    inputWidgetsNo = countInputWidgets();
    btnWidgetsNo = countBtnWidgets();
    comboboxWidgetNo = countComboboxWidgets();
    dropdownlistWidgetsNo = countDropdownlistWidgets();
}

const addListenersToFields = () => {
    addClickListenerToNavElements();
    addClickListenerToButtons();
    addFocusListenersToDropdownlists();
    addOnChangeListenerToInputFields();
    addOnBlurListenerToCombobox();
    updateWidgetsNo();
}

/**
 * add onClick for all navigation elements
 */
const addClickListenerToNavElements = () => {
    let nextBtn = locateNextBtn();
    let prevBtn = locatePrevBtn();
    let headerDiv = locateHeaderDiv();

    headerDiv.addEventListener('click', pageNavigation);
    if (nextBtn) nextBtn.addEventListener('click', pageNavigation);

    if (prevBtn !== null) {
        prevBtn.addEventListener('click', pageNavigation);
    }
}

/**
 * add onClick for all buttons, including all arrows from combobox and country for phone field
 */
const addClickListenerToButtons = () => {
    const buttons = locateButtonElements();
    buttons.forEach((button) => button.addEventListener('click', handleElementsFromEvents));
}

const addFocusListenersToDropdownlists = () => {
    const dropdownlists = locateDropdownElements();
    dropdownlists.forEach((dropdownlist) => dropdownlist.addEventListener('focus', handleElementsFromEvents));
}

const addOnChangeListenerToInputFields = () => {
    //get all text input fields, radio, checkbox and add onChange Listner
    const textInputFields = Array.from(locateInputElements()).filter((input) => input.type !== "hidden" && !input.id.includes('downshift'));
    textInputFields.forEach((input) => input.addEventListener('change', handleElementsFromEvents));
}

const addOnBlurListenerToCombobox = () => {
    //get combobox input and add onBlur     
    let comboboxInputs = locateComboboxInputs();
    comboboxInputs.forEach((comboboxInput) => comboboxInput.addEventListener('blur', handleElementsFromEvents));
}

const removeAllListeners = () => {

    //remove onChange Listeners for text fields
    let InputFields = Array.from(locateInputElements()).filter((input) => input.type !== "hidden" && !input.id.includes('downshift'));
    InputFields.forEach((field) => field.removeEventListener('change', handleElementsFromEvents));

    //remove onBlur Listeners for combobox inputs
    let comboboxInputs = locateComboboxInputs();
    comboboxInputs.forEach((field) => field.removeEventListener('blur', handleElementsFromEvents));

    //remove all Listeners for dropdownlist    
    let dropdownlists = locateDropdownElements();
    dropdownlists.forEach((field) => field.removeEventListener('focus', handleElementsFromEvents));

    //remove all click Listeners for nav element
    let buttons = locateButtonElements();
    let nextBtn = locateNextBtn();
    let prevBtn = locatePrevBtn();
    let headerDiv = locateHeaderDiv();

    buttons.forEach((field) => field.removeEventListener('click', handleElementsFromEvents));
    headerDiv.removeEventListener('click', pageNavigation);
    nextBtn.removeEventListener('click', pageNavigation);
    if (prevBtn != null) {
        prevBtn.removeEventListener('click', pageNavigation);
    }
}

const handleElementsFromEvents = (e) => {
    let element = e.target ? e.target : e;
    trackingChanges = false;

    if (!isUselessElement(element)) {
        if (isComboBoxDropDownArrowClicked(element)) {
            removeComboboxEntryWhenXisClicked(element);
        } else if (isComboBoxInput(element)) {
            //if input is not in the list, it will not save empty entry
            //this settimeout allow react to update the element value
            setTimeout(() => {
                saveFieldToPageEntry(element)
            }, 500);
        } else if (isDropdownlistDivElement(element)) {
            //record dropdownlist
            const dropdownInput = element.parentElement.children[1];
            if (dropdownInput) {
                trackingChanges = true;
                startTrackingChangesforDropdownlist(dropdownInput, dropdownInput.value);
            }
        } else if (isPhoneCountryIconClicked(element)) {
            //record phone input with country flag
            trackingChanges = true;
            startTrackingChangesforPhoneCountryIcon(element, getFlagCode(element));
        } else if (isDateFieldIconClicked(element)) {
            //record date field with calender
            const input = DataEntryWorker.getComponentByElement(element).querySelector("input");
            if (input) {
                trackingChanges = true;
                startTrackingChangesforDateFieldIcon(input, input.value);
            }
        } else {
            //record all other inputs
            saveFieldToPageEntry(element);
        }
    }
}

const removeComboboxEntryWhenXisClicked = (element) => {
    //remove comboxbox entry when clicking X icon
    let dropdownInput = element.parentElement.parentElement.parentElement.querySelector("input");
    if (dropdownInput && element.querySelector("path").getAttribute("d") !== "M7 10l5 5 5-5z") {
        removeComboboxEntry(dropdownInput);
    }
}

const startTrackingChangesforPhoneCountryIcon = (element, oldValue) => {
    if (!trackingChanges) {
        return;
    }

    if (getFlagCode(element) !== oldValue) {
        let phoneInput = element.parentElement.parentElement.parentElement.querySelector("input");
        if (phoneInput) {
            saveFieldToPageEntry(phoneInput, false);
        }
        trackingChanges = false;
    } else {
        setTimeout(() => {
            startTrackingChangesforPhoneCountryIcon(element, oldValue);
        }, checkFrequencyTime);
    }
}

const startTrackingChangesforDateFieldIcon = (element, value) => {
    if (!trackingChanges) {
        return;
    }

    if (element.value != value) {
        saveFieldToPageEntry(element);
        trackingChanges = false;
    } else {
        setTimeout(() => {
            startTrackingChangesforDateFieldIcon(element, value);
        }, checkFrequencyTime);
    }
}

const startTrackingChangesforDropdownlist = (element, oldValue) => {
    if (!trackingChanges) {
        return;
    }

    if (element.value !== oldValue) {
        saveFieldToPageEntry(element, false);
        trackingChanges = false;
    } else {
        setTimeout(() => {
            startTrackingChangesforDropdownlist(element, oldValue);
        }, checkFrequencyTime);
    }
}

/**
 * remove combobox entry after user click X button
 */
const removeComboboxEntry = (element) => {
    for (var i = 0; i < pageEntryArray.length; i++) {
        if (pageEntryArray[i].name === element.name) {
            sendLogMsgToBackground("Delete entry" + element.name);
            msgBox.print("Delete entry" + element.name);
            pageEntryArray.splice(i, 1);
        }
    }
}

/**
 *  check if new widgets are created after user input
 */
const hasNewWidgetsCreated = () => {
    const totalWaitTime = 500;
    const btnNo = countBtnWidgets();
    const inputNo = countInputWidgets();
    const comboboxNo = countComboboxWidgets();
    const dropdownlistNo = countDropdownlistWidgets();
    let WidgetChanged = false;

    if (btnNo !== btnWidgetsNo) {
        if (btnNo > btnWidgetsNo) {
            addClickListenerToButtons();
        }
        btnWidgetsNo = btnNo;
        WidgetChanged = true;
    }

    if (inputNo !== inputWidgetsNo) {
        if (inputNo > inputWidgetsNo) {
            addOnChangeListenerToInputFields();
        }
        inputWidgetsNo = inputNo;
        WidgetChanged = true;
    }

    if (comboboxNo !== comboboxWidgetNo) {
        if (comboboxNo > comboboxWidgetNo) {
            addOnBlurListenerToCombobox();
        }
        comboboxWidgetNo = comboboxNo;
        WidgetChanged = true;
    }

    if (dropdownlistNo !== dropdownlistWidgetsNo) {
        if (dropdownlistNo > dropdownlistWidgetsNo) {
            addFocusListenersToDropdownlists();
        }
        dropdownlistWidgetsNo = dropdownlistNo;
        WidgetChanged = true;
    }

    if (!WidgetChanged) {
        if (hasExceedWaitTime(checkWidgetCounter, totalWaitTime)) {
            checkWidgetCounter = 0;
            return;
        } else {
            checkWidgetCounter++;
            setTimeout(() => {
                hasNewWidgetsCreated();
            }, checkFrequencyTime);
        }
    } else {
        checkWidgetCounter = 0;
    }

}

//===================================== Recording - Integration Dialogs ============================================

/**
 *  Check if dialog exists, takes a callback that will be called when confirmed no dialogs appeared.
 *  If dialog exists, add eventListener to elements in dialog and pass them the callback function.
 */
const hasIntegrationDialogAppeared = (callbackWhenNone = () => {}) => {
    const totalWaitTime = 1300;
    let dialogAppeared = false;
    
    if (document.querySelectorAll('div[role="dialog"]').length > 0) {
        addListenersToDialogElements(callbackWhenNone);
        dialogAppeared = true;
    }

    if (!dialogAppeared) {
        if (hasExceedWaitTime(checkDialogCounter, totalWaitTime)) {
            checkDialogCounter = 0;
            return callbackWhenNone();
        } else {
            checkDialogCounter++;
            setTimeout(() => {
                if(hasIntegrationDialogAppeared) hasIntegrationDialogAppeared(callbackWhenNone);
            }, checkFrequencyTime);
        }
    } else {
        checkDialogCounter = 0;
    }
}

/**
 *  Record dialog definition and dom reference in global variable, then add eventlistener to each element.
 */
const addListenersToDialogElements = (callbackWhenNone) => {
    
    currentDialogDefinition = getCurrentDialogDefinition();
    addOnChangeListenerToDialogInputs(callbackWhenNone);
    addClickListenerToDialogButtons(callbackWhenNone);
    addClickListenerToBackDrop(callbackWhenNone);
}

const getCurrentDialogDefinition = () => {
    let dialogTitle = locateDialogTitle().innerHTML || 'unknownTitle';
    let numOfInputs = locateDialogInputs().length || 0;
    let numOfButtons = locateDialogButtons().length || 0;
    let dialogInputs = locateDialogInputs();
    let dialogButtons = locateDialogButtons();
    let dialogBackDrop = locateDialogBackDrop();
    
    return {
        dialogTitle,
        numOfInputs,
        numOfButtons,
        dialogInputs,
        dialogButtons,
        dialogBackDrop
    }
}

const addOnChangeListenerToDialogInputs = (callbackWhenNone) => {
    currentDialogDefinition.dialogInputs.forEach((input) => input.addEventListener('change', handleDialogActions.bind(null, callbackWhenNone), false));
}

const addClickListenerToDialogButtons = (callbackWhenNone) => {
    currentDialogDefinition.dialogButtons.forEach((button) => button.addEventListener('click', handleDialogActions.bind(null, callbackWhenNone), false));
}

const addClickListenerToBackDrop = (callbackWhenNone) => {
    currentDialogDefinition.dialogBackDrop.addEventListener('click', handleDialogActions.bind(null, callbackWhenNone), false);
}

/**
 * Event handler for dialog elements, records user action and pass callbackWhenNone to checkIfDialogDisappearedOrChanged()
 */
const handleDialogActions = (callbackWhenNone, e) => {
    let element = e.currentTarget ? e.currentTarget : e;
    let elementIndex = findIndexOfDialogElement(element);
    if (element.tagName === "INPUT") {
        currentDialogActions.push({
            type: "input",
            index: elementIndex,
            value: element.value
        })
    } else if (element.tagName === "BUTTON") {
        currentDialogActions.push({
            type: "button",
            index: elementIndex,
            value: null
        })
    } else {
        currentDialogActions.push({
            type: "backdrop",
            index: elementIndex,
            value: null
        })
    }
    checkIfDialogDisappearedOrChanged(callbackWhenNone);
}

/**
 * Find index of an element in the array of the same element type.
 */
const findIndexOfDialogElement = (element) => {
    let elementsArray = []
    if (element.tagName === "BUTTON") {
        elementsArray = locateDialogButtons();
    } else if (element.tagName === "INPUT") {
        elementsArray = locateDialogInputs();        
    }
    for (let i = 0; i < elementsArray.length; i++) {
        if (elementsArray[i] === element) return i;
    }
    return -1;
}

/**
 * Called after a user action is detected on a dialog, checks if dialog disappeared/a new one popped up, if so, push the action list for current dialog to actual record(json entry),
 * and passes callbackWhenNone to another hasIntegrationDialogAppeared().
 * If dialog didn't disappear or change, do nothing.
 */
const checkIfDialogDisappearedOrChanged = (callbackWhenNone) => {
    const totalWaitTime = 1000;
    let dialogGone = false;
    
    if (!locateDialog() || !isSameDialogDefinition(currentDialogDefinition, getCurrentDialogDefinition())) {
        let diaLogDefToPush = {
            dialogTitle: currentDialogDefinition.dialogTitle,
            numOfInputs: currentDialogDefinition.numOfInputs,
            numOfButtons: currentDialogDefinition.numOfButtons 
        }
        addEntryToPageEntryArray({
            type:"dialogActions",
            dialogDefinition:diaLogDefToPush,
            actions:currentDialogActions
        })
        currentDialogDefinition = {};
        currentDialogActions = [];
        dialogGone = true;
        hasIntegrationDialogAppeared(callbackWhenNone);
    }

    if (!dialogGone) {
        if (hasExceedWaitTime(checkDialogGoneCounter, totalWaitTime)) {
            checkDialogGoneCounter = 0;
            return;
        } else {
            checkDialogGoneCounter++;
            setTimeout(() => {
                checkIfDialogDisappearedOrChanged(callbackWhenNone);
            }, checkFrequencyTime);
        }
    } else {
        checkDialogGoneCounter = 0;
        return;
    }
}

/**
 * Compare two dialog definitions by their title&number of each type of elements.
 */
const isSameDialogDefinition = (defA, defB) => {
    if (defA.dialogTitle === defB.dialogTitle && defA.numOfInputs === defB.numOfInputs && defA.numOfButtons === defB.numOfButtons) {
        return true;
    } else {
        return false;
    }
}

//===================================== End of Recording - Integration Dialogs ============================================

const saveFieldToPageEntry = (element) => {
    let entry;

    if (isButtonElementClicked(element)) {
        entry = populateButtonEntry(element);
        addEntryToPageEntryArray(entry);
    } else {
        entry = populateGeneralEntry(element);

        if (!isEmptyEntry(entry) && !searchAndUpdateDupEntry(entry)) {
            addEntryToPageEntryArray(entry);
        }
    }

    hasNewWidgetsCreated();
}

/**
 * Get the country code from phone input field
 * @param {*} element take the SPAN/svg element of phone input as param
 */
const getFlagCode = (element) => {
    const spanElement = (element.tagName === "svg") ? element.parentElement.querySelector("span") : element;
    const flagCodeArray = Array.from(spanElement.classList).filter(e => /^flag-icon-[a-z]{2}$/.test(e));
    return (flagCodeArray.length > 0) ? flagCodeArray[0].split('-')[2] : '';
}

const addEntryToPageEntryArray = (entry) => {
    pageEntryArray.push(entry);
    pageEntryArray = pageEntryArray.filter(n => n != undefined);

    sendLogMsgToBackground(pageEntryArray);
    sendMsgforRecord();
    msgBox.print(pageEntryArray.length + " inputs are recored in current page");
}

const searchAndUpdateDupEntry = (entry) => {
    for (let i = 0; i < pageEntryArray.length; i++) {
        if (pageEntryArray[i].name === entry.name) {
            if (entry.options != pageEntryArray[i].options) {
                pageEntryArray[i] = entry;
                sendLogMsgToBackground("Update data entry - " + entry.name + " : " + entry.options);
                msgBox.print("Update data entry for " + entry.name);
                sendLogMsgToBackground(pageEntryArray);
            } else if (entry.type === "tel" && pageEntryArray[i].flag !== entry.flag) {
                pageEntryArray[i] = entry;
                sendLogMsgToBackground("Update data entry - " + entry.name + " : " + entry.flag);
                msgBox.print("Update data entry for " + entry.name);
                sendLogMsgToBackground(pageEntryArray);
            }
            return true;
        }
    }

    return false;
}

const populateGeneralEntry = (element) => {
    let entry = {
        tagName: element.tagName,
        name: element.name ? element.name : "",
        options: isCheckBoxInput(element) ? element.checked : (element.value ? element.value : ""),
        type: element.type ? element.type : "",
        id: element.id ? element.id : "",
        isDisabled: element.disabled,
        isRequired: element.classList.contains("required")
    };

    if (element.type === "tel") {
        const spanField = element.parentElement.querySelector("span");
        if (spanField && getFlagCode(spanField) !== "") {
            entry.flag = getFlagCode(spanField);
        }
    }

    return entry;
}

const populateButtonEntry = (element) => {
    let buttonDiv = (element.tagName == "SPAN") ? element.parentElement : element;
    let buttonsArray = Array.from(locateBodyDiv().querySelectorAll("button[type=button]")).filter(element => element.textContent != "");

    let entry = {
        tagName: buttonDiv.tagName,
        name: buttonDiv.textContent,
        options: (buttonsArray.length > 0) ? buttonsArray.indexOf(buttonDiv) : -1,
        type: buttonDiv.type,
        id: buttonDiv.id ? buttonDiv.id : "",
        isDisabled: buttonDiv.disabled,
        isRequired: false
    };

    return entry;
}

const pageNavigation = (e) => {
    //avoid double click on the page Navigation
    if (lastClick >= (Date.now() - delay)) {
        return;
    }
    lastClick = Date.now();
    sendLogMsgToBackground("page navigation");
    trackingChanges = false;
    if (e.currentTarget.firstChild.innerHTML === "Finish") {
        saveEntriesToJson();
    }
    hasIntegrationDialogAppeared(()=>{
        saveEntriesToJson();        
        waitforPageChangeForRecord();
    });
}

const recordSaveAndSendInfo = () => {
    msgBox.print("Send draft to recipients");

    let sendButton;

    document.querySelectorAll("div[role=dialog] button").forEach(btn => {
        if (btn.querySelector("span").innerText === "SEND") {
            sendButton = btn;
        }
    })

    if (sendButton) {
        sendButton.addEventListener("click", sendSaveAndSendInfoToBackground);
    }
}

const sendSaveAndSendInfoToBackground = () => {
    const emailSpan = document.querySelector("div[role=dialog] div#undefined-to span");
    const recipientEmail = emailSpan ? emailSpan.innerText : "";
    const subject = document.querySelector("div[role=dialog] input").value;
    const message = document.querySelector("div[role=dialog] textarea[type=text]").value;

    seleniumJson.sendPanelInfo = {
        recipientEmail, message, subject
    };

    sendMsgforRecord();
}

const waitforPageChangeForRecord = () => {
    const pageChange = updateDocumentInfo();
    const totalWaitTime = 5000;

    if (pageChange) {
        pageChangeCounter = 0;
        recordNewPage();
        msgBox.print("Recording page #" + getCurrentDocumentInfo().pageNumber + " - " + getCurrentDocumentInfo().pageName);
    } else {
        if (detectSaveAndSendPanel()) {
            recordSaveAndSendInfo()
            pageChangeCounter = 0;
        } else {
            if (hasExceedWaitTime(pageChangeCounter, totalWaitTime)) {
                pageChangeCounter = 0;
            } else {
                pageChangeCounter++;
                setTimeout(() => {
                    waitforPageChangeForRecord();
                }, checkFrequencyTime);
            }
        }
    }
}

const buildPageEntryJson = () => {
    let documentInfo = getCurrentDocumentInfo();
    let page = {
        pageNumber: (documentInfo != null) ? parseInt(documentInfo.pageNumber) : 0,
        docName: (documentInfo != null) ? documentInfo.pageName : "",
        entries: pageEntryArray
    };
    return page;
}

/**
 * update the page status based on the page icon color/picture
 * return true if the focused page change, else false
 */

const updateDocumentInfo = () => {
    let pages = locateHeaderDiv().querySelectorAll("div.stepItem button");

    //first time scan
    if (!documentInfoArray.length) {
        for (let i = 0; i < pages.length; i++) {
            let pageNoDiv = pages[i].querySelector("text");
            let pageInfo = {
                pageName: pages[i].children[0].children[1].firstChild.innerHTML,
                pageNumber: (pageNoDiv != null) ? pageNoDiv.innerHTML : i + 1,
                pageStatus: analysisPageStatus(pages[i])
            }

            documentInfoArray.push(pageInfo);
        }
        return false;

    } else {
        let statusChange = false;

        for (let i = 0; i < pages.length; i++) {
            let curStatus = analysisPageStatus(pages[i]);
            if (documentInfoArray[i].pageStatus != curStatus) {
                documentInfoArray[i].pageStatus = curStatus;
                statusChange = true;
            }
        }
        return statusChange;
    }
}

const analysisPageStatus = (element) => {
    if (element.querySelector("path") != null) {
        return "completed";
    } else if (element.querySelector("svg").classList.length == 3) {
        return "focused";
    } else {
        return "incomplete";
    }
}

const getCurrentDocumentInfo = () => {
    if (documentInfoArray.length > 0) {
        for (let i = 0; i < documentInfoArray.length; i++) {
            if (documentInfoArray[i].pageStatus == "focused") {
                return documentInfoArray[i];
            }
        }
    }
    return null;
}

//================================PlayingBack=========================================

const updateCurrentPageDialogActions = (pageIndex) => {
    uploadedCurrentPageDialogActions = getUploadedJsonPages()[pageIndex].entries.filter(entry=> entry.type === "dialogActions");
}

const fillDialogsIfExist = (callbackWhenNone) => {
    const totalWaitTime = 1300;
    let dialogAppeared = false;
    
    if (locateDialog()) {
        let dialogIndexInRecord = uploadedCurrentPageDialogActions.findIndex(record => isSameDialogDefinition(record.dialogDefinition, getCurrentDialogDefinition()));
        if (dialogIndexInRecord >= 0) {
            executeActionsInCurrentDialog(uploadedCurrentPageDialogActions[dialogIndexInRecord].actions);
            uploadedCurrentPageDialogActions.splice(dialogIndexInRecord,1);
            dialogAppeared = true;
        } else {
            console.error("Unknown Dialog Appeared");
            checkDialogCounter = 0;
            return;
        }
    }

    if (!dialogAppeared) {
        if (hasExceedWaitTime(checkDialogCounter, totalWaitTime)) {
            checkDialogCounter = 0;
            return callbackWhenNone();
        } else {
            checkDialogCounter++;
            setTimeout(() => {
                fillDialogsIfExist(callbackWhenNone);
            }, checkFrequencyTime);
        }
    } else {
        checkDialogCounter = 0;
        fillDialogsIfExist(callbackWhenNone)
    }
}

const executeActionsInCurrentDialog = (actions) => {
    for (let i = 0; i < actions.length; i++) {
        if (actions[i].type === "button") {
            locateDialogButtons()[parseInt(actions[i].index)].click();
        } else if (actions[i].type === "input") {
            // todo !!
        } else if (actions[i].type === "backdrop") {
            locateDialogBackDrop().click();
        }
    }
}

const enterFieldEntryByPage = (pageIndex, entryIndex) => {
    if (!playback) {
        return;
    }

    const pageEntry = getUploadedJsonPages()[pageIndex].entries;
    const field = pageEntry[entryIndex];

    try {
        const fieldElement = document.getElementsByName(field.name)[0];
        const name = field.name;
        const value = field.options;

        if (fieldElement || field.tagName == "BUTTON") {
            const type = checkFieldType(field);
            if (type == "text" || type == "email" || type == "url") {
                enterTextField(pageIndex, entryIndex);
                return;
            } else if (type == "phone") {
                enterPhoneInputField(pageIndex, entryIndex);
                return;
            } else if (type == "dropdownlist") {
                clickDropdownlistByName(pageIndex, entryIndex);
                return;
            } else if (type == "date") {
                handleDateField(pageIndex, entryIndex);
                return;
            } else if (type == "combobox") {
                clickComboBoxByName(name, value);
            } else if (type == "radio") {
                clickRadioButtonByName(name, value);
            } else if (type == "checkbox") {
                clickCheckBoxByName(name, value);
            } else if (type == "button") {
                clickButtonElement(name, value);
            } else {
                console.error("Skip unknown field: " + field);
            }
        } else if (field.type === "dialogActions") {
            
        } else {
            sendLogMsgToBackground("Unable to find field: " + field.name + " - Skipped");
        }
    } catch (err) {
        sendLogMsgToBackground("Error entering field: " + field.name + " - Skipped");
        console.error(err);
    }

    goingToNextEntry(pageIndex, entryIndex + 1);
}

const checkFieldType = (field) => {

    if (field.tagName === "INPUT" && field.type === 'text') {
        const fieldElement = document.getElementsByName(field.name)[0];
        if (field.id.includes("downshift")) {
            return "combobox";
        } else if (fieldElement && isDateFieldInput(fieldElement)) {
            return "date";
        } else {
            return "text";
        }
    }

    if (field.tagName === "INPUT" && field.type === "url") {
        return "url";
    }

    if (field.tagName === "INPUT" && field.type === "email") {
        return "email";
    }

    if (field.tagName === "INPUT" && field.type === "tel") {
        return "phone";
    }

    if (field.tagName === "INPUT" && field.type === "radio") {
        return "radio";
    }

    if (field.tagName === "INPUT" && field.type === "checkbox") {
        return "checkbox";
    }

    if (field.tagName === "INPUT" && field.type === "hidden") {
        return "dropdownlist";
    }

    if (field.tagName === "BUTTON" && field.type === "button") {
        return "button";
    }

    return "unknown";
}

const changeValue = (element, value) => {

    let lastValue = element.value;
    element.value = value;
    const event = new Event('input', { bubbles: true });
    event.simulated = true;
    let tracker = element._valueTracker;
    if (tracker) {
        tracker.setValue(lastValue);
    }
    element.dispatchEvent(event);
}

const changeValueCharByChar = (element, value, charIndex, pageIndex, entryIndex) => {
    if (charIndex <= value.length) {
        let newValue = value.substring(0, charIndex);
        changeValue(element, newValue);
        setTimeout(() => {
            changeValueCharByChar(element, value, ++charIndex, pageIndex, entryIndex);
        }, 50);
    } else {
        goingToNextEntry(pageIndex, entryIndex + 1);
    }
}

const enterTextField = (pageIndex, entryIndex) => {
    const pageEntry = getUploadedJsonPages()[pageIndex].entries;
    const field = pageEntry[entryIndex];
    if (field.options === "") {
        goingToNextEntry(pageIndex, entryIndex + 1);
    } else {
        const fieldElement = document.getElementsByName(field.name)[0];

        sendLogMsgToBackground("Entering Data: " + field.name + " - " + field.options);
        msgBox.print("Entering Data: " + field.name);

        if (demoMode) {
            scrollPageToCenterField(fieldElement);
            changeValueCharByChar(fieldElement, field.options, 1, pageIndex, entryIndex);
        } else {
            changeValue(fieldElement, field.options);
            goingToNextEntry(pageIndex, entryIndex + 1);
        }
    }
}

const handleDateField = (pageIndex, entryIndex) => {
    const pageEntry = getUploadedJsonPages()[pageIndex].entries;
    const field = pageEntry[entryIndex];
    const fieldElement = document.getElementsByName(field.name)[0];

    if (field.options !== "" && fieldElement) {
        const smallestDate = new Date("1899-12-31").getTime();
        const biggestDate = new Date().getTime();
        const dateTime = new Date(field.options);

        if (dateTime == "Invalid Date" || dateTime == "NaN") {
            sendLogMsgToBackground(`Invalid Date format - ${field.name}`)
            goingToNextEntry(pageIndex, entryIndex + 1);
            return;
        }

        if (dateTime.getTime() >= smallestDate && dateTime.getTime() <= biggestDate) {
            const value = field.options;
            const year = value.split('-')[0];
            const month = value.split('-')[1];
            const day = value.split('-')[2];

            //open date picker
            const dateIcon = fieldElement.parentElement.querySelector("Button");
            dateIcon.click();

            //select year
            const yearSelect = document.querySelector("div[role=document] h3");
            yearSelect.click();
            const years = document.querySelectorAll("div[role=document] div[role=button]");
            Array.from(years).find(option => parseInt(option.innerText) === parseInt(year)).click();

            //select month        
            const diff = new Date().getMonth() + 1 - month;
            if (diff !== 0) {
                const monthSelectArrows = document.querySelectorAll("div[role=document] button[type=button]");
                const monthString = dateMap.get(parseInt(month));
                let arrow;
                if (diff > 0) {
                    arrow = monthSelectArrows[0];
                } else if (diff < 0) {
                    arrow = monthSelectArrows[1];
                }

                while (!document.querySelector("div[role=document] span p").innerText.includes(monthString)) {
                    arrow.click();
                }
            }
            //select day
            const days = Array.from(document.querySelectorAll("div[role=document] div[role=presentation]"));
            days.find(d => parseInt(d.firstChild.firstChild.innerText) === parseInt(day)).click();

            //save
            document.querySelector("div[role=document] button[aria-label=OK]").click();
        } else {
            //open date picker
            const dateIcon = fieldElement.parentElement.querySelector("Button");
            dateIcon.click();

            //save
            document.querySelector("div[role=document] button[aria-label=OK]").click();
        }
    }
    goingToNextEntry(pageIndex, entryIndex + 1);
}

const enterPhoneInputField = (pageIndex, entryIndex) => {
    const pageEntry = getUploadedJsonPages()[pageIndex].entries;
    const field = pageEntry[entryIndex];
    const fieldElement = document.getElementsByName(field.name)[0];
    let requireInputFlag = false;

    if (fieldElement) {

        let flagSpan = fieldElement.parentElement.querySelector("span");

        if (field.flag && flagSpan && getFlagCode(flagSpan) !== field.flag) {
            requireInputFlag = true;
        }

        if (requireInputFlag) {
            flagSpan.click();
            setTimeout(() => {
                selectCountryFlag(field, pageIndex, entryIndex);
            }, 50);
        } else {
            enterTextField(pageIndex, entryIndex);
        }

    } else {
        goingToNextEntry(pageIndex, entryIndex + 1);
    }
}

const selectCountryFlag = (field, pageIndex, entryIndex) => {
    const option = document.querySelector("li[role=option][data-region=" + field.flag.toUpperCase() + "]");

    if (option) {
        option.click();
        sendLogMsgToBackground(`Select country for phone field - ${field.name} - ${field.flag}`);
    } else {
        sendLogMsgToBackground(`Country option does not exist - ${field.name} - ${field.flag}`);
    }

    enterTextField(pageIndex, entryIndex);

}

const clickRadioButtonByName = (name, value) => {
    let options = document.getElementsByName(name);

    for (let i = 0; i < options.length; i++) {
        if (options[i].defaultValue == value) {
            scrollPageToCenterField(options[i]);
            options[i].click();
            sendLogMsgToBackground("Entering Data: " + name + " - " + value);
            msgBox.print("Entering Data: " + name);
            break;
        }
    }
}

const clickCheckBoxByName = (name, value) => {
    const element = document.getElementsByName(name)[0];

    if (element && (value != element.checked)) {
        scrollPageToCenterField(element);
        element.click();
        sendLogMsgToBackground("Entering Data: " + name + " - " + value);
        msgBox.print("Entering Data: " + name);
    }

}

const clickDropdownlistByName = (pageIndex, entryIndex, skipTryAgainOnError) => {
    const pageEntry = getUploadedJsonPages()[pageIndex].entries;
    const field = pageEntry[entryIndex];
    const name = field.name;
    const value = field.options;

    if (value !== "") {
        const dropdownInput = document.getElementsByName(name)[0];

        if (dropdownInput) {
            const dropdownLabelDiv = dropdownInput.parentElement.children[0];
            scrollPageToCenterField(dropdownLabelDiv);

            if (dropdownLabelDiv) {
                dropdownLabelDiv.click();
                const options = document.querySelectorAll("li[role=option]");

                if (!options.length && !skipTryAgainOnError) {
                    sendLogMsgToBackground(`${name} - Options not loaded, try again!`);
                    setTimeout(() => {
                        clickDropdownlistByName(pageIndex, entryIndex, true);
                    }, 500);
                    return;
                }

                let option;
                options.forEach(opt => {
                    if (opt.getAttribute("data-value") === value) {
                        option = opt;
                    }
                })

                if (option) {
                    option.click();
                    sendLogMsgToBackground(`Entering Data: ${name} - ${value}`);
                    msgBox.print(`Entering Data: ${name}`);
                } else {
                    sendLogMsgToBackground(`Unable to enter data: ${name} - option not availiable`);
                }

            } else {
                sendLogMsgToBackground(`Unable to enter data: ${name} - dropdown not exist`);
            }
        } else {
            sendLogMsgToBackground(`Unable to enter data: ${name} - field not exist`);
        }
    }

    setTimeout(() => {
        goingToNextEntry(pageIndex, entryIndex + 1);
    }, 500);
}

const clickComboBoxByName = (name, value) => {
    const comboboxInput = document.getElementsByName(name)[0];

    if (comboboxInput && value !== "") {
        changeValue(comboboxInput, value);
        const comboboxDiv = comboboxInput.closest('div[role=combobox]')
        if (comboboxDiv) {
            const option = comboboxDiv.querySelector("div[role=option]");
            if (option) {
                option.click();
            }
        }
    }
}

const clickButtonElement = (name, value) => {
    if (value == "") {
        return;
    }

    let buttonsArray = Array.from(locateBodyDiv().querySelectorAll("button[type=button]")).filter(element => element.textContent != "");

    if ((buttonsArray.length > value) && buttonsArray[value].textContent == name) {
        scrollPageToCenterField(buttonsArray[value]);
        buttonsArray[value].click();
        sendLogMsgToBackground("Click Button: " + name);
        msgBox.print("Click Button: " + name);
    }
}

const waitforPageChangeForPlayback = () => {
    let pageChange = updateDocumentInfo();
    let totalWaitTime = 1500;
    if (pageChange) {
        checkNextPageCounter = 0;
        FindPageEntryInJSON();
    } else {
        if (detectErrorParagraph()) {
            checkNextPageCounter = 0;
            msgBox.showResumeBtn(true);
        } else if (hasExceedWaitTime(checkNextPageCounter, totalWaitTime)) {
            checkNextPageCounter = 0;
            clickToNextPageAndContinuePlayback();
        } else {
            checkNextPageCounter++;
            setTimeout(() => {
                waitforPageChangeForPlayback();
            }, checkFrequencyTime);
        }
    }
}

const resumePlayback = () => {
    msgBox.hideResumeBtn();

    if (isLastPage()) {
        sendCompleteMessage();
    } else {
        clickToNextPageAndContinuePlayback();
    }
}

const preparePlaybackRecipientMode = () => {
    setTimeout(() => {
        if (locateNextBtn()) {
            locateNextBtn().click();
        }

        setTimeout(() => {
            if (detectSaveAndSendPanel()) {
                enterSaveAndSendInfo();
            } else {
                sendCompleteMessage(true);
            }
        }, 1000);

    }, 1000);
}

const enterSaveAndSendInfo = () => {
    const recipientEmails = document.querySelectorAll("div[role=dialog] div#undefined-to div[role=button]");
    if (recipientEmails.length > 0) {
        //to do - handle multiple email recipients        
        recipientEmails[0].click();
        const emailInput = document.querySelector("div[role=dialog] div#undefined-to input[type=email]");
        const subjectInput = document.querySelector("div[role=dialog] input[type=text]");
        const MessageInput = document.querySelector("div[role=dialog] textarea[type=text]");
        const sendButton = document.querySelectorAll("div[role=dialog] button[type=button]")[1];

        if (emailInput) {
            changeValue(emailInput, uploadedJson.sendPanelInfo.recipientEmail);
        }

        if (subjectInput) {
            changeValue(subjectInput, uploadedJson.sendPanelInfo.subject);
        }

        if (MessageInput) {
            changeValue(MessageInput, uploadedJson.sendPanelInfo.message);
        }

        if (!sendButton.disable) {
            sendButton.click();
            sendMsgToContentScript("FROM_PAGE_START_PLAYBACK_RECIPIENT");
            detectPublishedDialogAndClosePage();
        } else {
            sendErrorMessage(7);
        }
    } else {
        sendErrorMessage(7);
    }
}

const detectPublishedDialogAndClosePage = () => {
    const publishedDialogTitle = document.querySelector("div[role=dialog] h2")
    if (publishedDialogTitle.innerText === "Published Agreement") {
        msgBox.print("Open transaction in recipient mode in 3 seconds...");
        setTimeout(() => {
            window.close();
        }, 3000);
    } else {
        setTimeout(() => {
            detectPublishedDialogAndClosePage();
        }, checkFrequencyTime);
    }
}

const saveAndSend = () => {
    if (locateNextBtn().firstElementChild && locateNextBtn().firstElementChild.innerText == "FINISH") {
        locateNextBtn().click();
        setTimeout(() => {
            if (document.querySelectorAll("div[role=document] button").length > 1) {
                if (document.querySelectorAll("div[role=document] button")[1].disabled) {
                    msgBox.printErrorMessage(5);
                } else {
                    document.querySelectorAll("div[role=document] button")[1].click();
                }
            }
        }, 1000);
    } else {
        locateNextBtn().click();
        setTimeout(() => {
            saveAndSend();
        }, 500);
    }
}

//===================================== Data Entry Worker ============================================

class DataEntryWorker { }

DataEntryWorker.components = [];

DataEntryWorker.emailDomain = "aexclienttest.net";

DataEntryWorker.startDataEntryWork = (emailDomain, repeatMax) => {
    DataEntryWorker.emailDomain = emailDomain;
    DataEntryWorker.repeatMax = repeatMax;
    DataEntryWorker.repeatCount = 0;
    DataEntryWorker.components = document.querySelectorAll(".component-cell");
    DataEntryWorker.enterField(0);
}

DataEntryWorker.enterField = (index) => {
    const numOfComponents = document.querySelectorAll(".component-cell").length;

    if (numOfComponents > DataEntryWorker.components.length) {
        DataEntryWorker.components = document.querySelectorAll(".component-cell");
    }

    if (index < DataEntryWorker.components.length) {
        const input = DataEntryWorker.components[index];
        const widgetType = DataEntryWorker.checkComponentFieldType(input);
        scrollPageToCenterField(input);
        DataEntryWorker.EnterWidgetByType(index, widgetType);
    } else {
        DataEntryWorker.fillBlankTextField();
        sendLogMsgToBackground("completed");
    }
}

DataEntryWorker.checkComponentFieldType = (div) => {
    let element;

    if (div.querySelector("input")) {
        element = div.querySelector("input");
    } else if (div.querySelector("button")) {
        element = div.querySelector("button");
    } else if (div.querySelector("div[role=combobox]")) {
        element = div.querySelector("div[role=combobox]");
    } else {
        element = div;
    }

    const field = {
        id: element ? element.id : '',
        name: element ? element.name : '',
        tagName: element ? element.tagName : '',
        type: element ? element.type : '',
    }

    return checkFieldType(field);
}

DataEntryWorker.EnterWidgetByType = (index, widgetType) => {
    switch (widgetType) {
        case "text":
            DataEntryWorker.enterText(index);
            break;
        case "email":
            DataEntryWorker.enterEmail(index);
            break;
        case "dropdownlist":
            DataEntryWorker.enterDropdownlist(index);
            break;
        case "phone":
            DataEntryWorker.enterPhoneNumber(index);
            break;
        case "combobox":
            DataEntryWorker.enterCombobox(index);
            break;
        case "checkbox":
            DataEntryWorker.enterCheckbox(index);
            break;
        case "radio":
            DataEntryWorker.enterRadioButtons(index);
            break;
        case "url":
            DataEntryWorker.enterURL(index);
            break;
        case "date":
            DataEntryWorker.enterDateField(index);
            break;
        case "button":
            DataEntryWorker.clickButton(index);
            break;
        case "unknown":
            DataEntryWorker.enterField(index + 1);
            break;
        default:
            sendLogMsgToBackground("unknown field");
    }
}

DataEntryWorker.enterText = (index) => {
    const div = DataEntryWorker.components[index];
    const input = div.querySelector("input");

    if (input.value == "") {
        changeValue(input, DataEntryWorker.generateValue(input));

        if (!stop) {
            saveFieldToPageEntry(input);
        }
    }

    DataEntryWorker.enterField(index + 1);
}

DataEntryWorker.generateValue = (input) => {
    let value = input.name;

    if (input.placeholder) {
        if (input.placeholder == "000-00-0000") {
            value = "213-12-1234";
        } else {
            value = input.placeholder;
        }
    }

    if (input.getAttribute("autocomplete") && input.getAttribute("autocomplete") == "number") {
        let maxNum = parseInt(input.max) || 1000000000,
            minNum = parseInt(input.min) || 0,
            maxLength = input.parentElement.parentElement.querySelector("p")? parseInt(input.parentElement.parentElement.querySelector("p").innerHTML.split("/")[1]) : 9,
            minLength = parseInt(input.getAttribute("minlength")) || 0;
        let realMax = Math.min(maxNum,parseInt("9".repeat(maxLength)) || 0);
        let realMin = Math.max(minNum,parseInt("1".repeat(minLength)) || 0);
        value = Math.floor(Math.random() * (realMax - realMin) + realMin);
    }

    const minlength = input.minLength;
    if (minlength && minlength !== -1 && value.length < minlength) {
        value += DataEntryWorker.generateRandomString(minlength - value.length);
    }

    const maxlength = DataEntryWorker.checkInputMaxLength(input);
    if( maxlength !== -1 && value.length > maxlength) {
        value = value.substring(0, maxlength);
    }   

    return value;
}

DataEntryWorker.checkInputMaxLength = (input) => {
    const p = Array.from(DataEntryWorker.getComponentByElement(input).querySelectorAll("div p")).find(p=>/^\d{1,4}\/\d{1,4}$/.test(p.innerText));
    return p ? p.innerText.split("/")[1] : -1;
}

DataEntryWorker.generateRandomString = (length) => {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    
    for (var i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    
    return text;
}

DataEntryWorker.enterEmail = (index) => {
    const input = DataEntryWorker.components[index].querySelector("input");
    if (input.value == "") {
        changeValue(input, curDocInfo.companyName.replace(/\s/g, '') + new Date().getTime()+ "@"+DataEntryWorker.emailDomain);
      
        if (!stop) {
            saveFieldToPageEntry(input);
        }
    }
    DataEntryWorker.enterField(index + 1);
}

DataEntryWorker.enterDropdownlist = (index) => {
    const div = DataEntryWorker.components[index];
    const input = div.querySelector("input");

    if (input.value == "") {
        input.parentElement.firstChild.click();

        setTimeout(() => {
            let length = document.querySelectorAll("li[role=option]").length;
            if (length > 0) {
                document.querySelectorAll("li[role=option]")[Math.floor(Math.random() * length)].click();
            }

            if (!stop) {
                saveFieldToPageEntry(input);
            }

            setTimeout(() => {
                DataEntryWorker.enterField(index + 1);
            }, 300);
        }, 200);
    } else {
        DataEntryWorker.enterField(index + 1);
    }
}

DataEntryWorker.enterPhoneNumber = (index) => {
    const input = DataEntryWorker.components[index].querySelector("input");

    if (input.value == "") {
        if (input.placeholder) {
            changeValue(input, input.placeholder);
        } else {
            const span = DataEntryWorker.components[index].querySelector("span")
            span.click();
            setTimeout(() => {
                let options = document.querySelectorAll("li[role=option][data-region]");
                let length = options.length;
                if (options) {
                    options[Math.floor(Math.random() * length)].click();
                }
                changeValue(input, input.placeholder);
            }, 50);
        }

        if (!stop) {
            saveFieldToPageEntry(input);
        }
    }

    DataEntryWorker.enterField(index + 1);
}

DataEntryWorker.enterCombobox = (index) => {
    const div = DataEntryWorker.components[index];
    const input = div.querySelector("input");
    const label = div.querySelector("label");

    if (input.value == "") {
        if (label && label.innerText.toLowerCase().includes("country")) {
            changeValue(input, "United States");
            const comboboxDiv = input.closest('div[role=combobox]')
            if (comboboxDiv) {
                const option = comboboxDiv.querySelector("div[role=option]");
                if (option) {
                    option.click();
                }
            }
        } else {
            const btn = div.querySelector("Button");
            if (btn) {
                btn.click();
                let length = document.querySelectorAll("div[role=option]").length;
                if (length > 0) {
                    div.querySelectorAll("div[role=option]")[Math.floor(Math.random() * length)].click();
                }
            }
        }

        if (!stop) {
            saveFieldToPageEntry(input);
        }

        setTimeout(() => {
            DataEntryWorker.enterField(index + 1);
        }, 300);
    } else {
        DataEntryWorker.enterField(index + 1);
    }
}

DataEntryWorker.clickButton = (index) => {
    const div = DataEntryWorker.components[index];

    div.querySelectorAll("button").forEach(btn => {
        if (!btn.disabled && btn.innerText.toLowerCase().includes("add")) {
            while (!btn.disabled && DataEntryWorker.repeatCount < DataEntryWorker.repeatMax) {
                btn.click();
                DataEntryWorker.repeatCount ++;

                if (!stop) {
                    saveFieldToPageEntry(btn);
                }
            }
        }
    })

    setTimeout(() => {
        DataEntryWorker.enterField(index + 1);
    }, 300);
}

DataEntryWorker.enterCheckbox = (index) => {
    const input = DataEntryWorker.components[index].querySelector("input");
    if (input && !input.checked) {
        input.click();

        if (!stop) {
            saveFieldToPageEntry(input);
        }

        setTimeout(() => {
            DataEntryWorker.enterField(index + 1);
        }, 10);
    } else {
        DataEntryWorker.enterField(index + 1);
    }
}

DataEntryWorker.enterURL = (index) => {
    const input = DataEntryWorker.components[index].querySelector("input");
    if (input.value == "") {
        let cleanValue = input.name.replace(/([^a-z]+)/gi, '');
        changeValue(input, "https://www." + cleanValue + ".com");

        if (!stop) {
            saveFieldToPageEntry(input);
        }
    }

    DataEntryWorker.enterField(index + 1);
}

DataEntryWorker.enterRadioButtons = (index) => {
    const div = DataEntryWorker.components[index];
    let length = div.querySelectorAll("input").length;
    let radioInput;
    if (length > 0) {
        radioInput = div.querySelectorAll("input")[Math.floor(Math.random() * length)];
        radioInput.click();
    }

    if (!stop) {
        saveFieldToPageEntry(radioInput);
    }

    setTimeout(() => {
        DataEntryWorker.enterField(index + 1);
    }, 10);
}

DataEntryWorker.enterDateField = (index) => {
    const input = DataEntryWorker.components[index].querySelector("input");
    if (input.value == "") {
        // callback for DOM mutation: if OK button is added, click; if dialog is removed, proceed to next data entry
        const observerCallback = function(mutationsList, me) {
            mutationsList.forEach(function(mutation) {
                if (mutation.addedNodes.length > 0 && mutation.addedNodes[0].nodeName == "DIV" && mutation.addedNodes[0].querySelector("div[role=document] button[aria-label=OK]")) {
                        mutation.addedNodes[0].querySelector("div[role=document] button[aria-label=OK]").click();
                } else if (mutation.removedNodes.length > 0 && mutation.removedNodes[0].nodeName == "DIV" && mutation.removedNodes[0].attributes.role && mutation.removedNodes[0].attributes.role.value === "dialog") {
                    // disconnect observer
                    me.disconnect();
                    if (!stop) {
                        saveFieldToPageEntry(input);
                    }
                    DataEntryWorker.enterField(index + 1);
                }
            })
        }
        let observer = new MutationObserver(observerCallback);
        observer.observe(document.body, { childList: true, subtree: true });
        const dateIcon = input.parentElement.querySelector("Button");
        dateIcon.click();
    } else {
        DataEntryWorker.enterField(index + 1);
    }
}

DataEntryWorker.generateRandomDate = () => {
    let start = new Date(1900, 1, 1);
    let end = new Date();
    let d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

DataEntryWorker.fillBlankTextField = () => {
    Array.from(document.querySelectorAll("input[type=text]")).forEach(input => {
        if (input.value == "" && !isDateFieldInput(input)) {
            changeValue(input, DataEntryWorker.generateValue(input));

            if (!stop) {
                saveFieldToPageEntry(input);
            }
        }
    });
}

DataEntryWorker.getComponentByElement = (element) => {
    let node = element.parentNode;
    while (node != null) {
        if (node.classList && node.classList.contains('component-cell')) {
            return node;
        }
        node = node.parentNode;
    }
    return null;
}