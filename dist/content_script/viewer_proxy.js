
if (window.location.href.indexOf("workflow/?docId") >= 0) {
    //Inject content script into Page for new template builder
    injectScriptFileToPage("content_new_viewer.js");
} else {
    //Inject content script into Page for old viewer
    injectScriptFileToPage("content.js");
}

//Inject shared content script 
injectScriptFileToPage("content_shared.js");

//receive message from extension and make action in page
chrome.runtime.onMessage.addListener(
    (request) => {
        if (request.message == "msgbox_toggle") {
            postMessage({ extensionMessage: request.data, type: "msgbox_toggle" }, '*');
        } else if (request.message == "start_clicked_in_popup") {
            postMessage({ extensionMessage: request.data.version, type: "start_recording" }, '*');
        } else if (request.message.includes("playback_called_from_popup_Current_Page")) {
            postMessage({ extensionMessage: request.data, type: "playback_init" }, '*');
        } else if (request.message == "save_clicked_from_popup") {
            postMessage({ extensionMessage: request.data, type: "saveToLocalStorage" }, '*');
        } else if (request.message == "page_init_settings"){
            postMessage({ extensionMessage: request.data.settings, type: "recorder_settings" }, '*');
        } else if (request.message == "download_completed_in_background") {
            injectScriptCodeToPage("msgBox.printCompleteRecordingMessage();");
        } else if (request.message == "playback_error_noJSON") {
            injectScriptCodeToPage("msgBox.printErrorMessage(1);");
        } else if (request.message == "playback_error_general") {
            injectScriptCodeToPage("msgBox.printErrorMessage(0);");
        } else if (request.message == "stop_clicked_in_popup" || request.message == "download_clicked_in_popup"
            || request.message == "DISGARD_RECORD_OR_PLAYBACK" || request.message == "playback_in_wrong_transaction"
            || request.message == "Start_dataEntryWorker") {
            injectScriptCodeToPage(request.data.code);
        } else if(request.message == "requestCSVAll") {
            postMessage({ extensionMessage: request.data.version, type: "get_data_to_create_csv_bulk_upload_all" }, '*');
        } else if(request.message == "requestCSVRequired") {
            postMessage({ extensionMessage: request.data.version, type: "get_data_to_create_csv_bulk_upload_required" }, '*');
        }
    }
);


//receive data from injected content script
window.addEventListener("message", function (event) {
    // We only accept messages from ourselves
    if (event.source != window || !event.data.message) {
        return;
    }

    if (event.data.message === "FROM_PAGE_RECORD") {
        chrome.runtime.sendMessage({ message: "FROM_RECORD", data: event.data.data });
    } else if (event.data.message === "FROM_PAGE_RECORD_DOWNLOAD") {
        chrome.runtime.sendMessage({ message: "FROM_RECORD_DOWNLOAD" });
    } else if (event.data.message === "FROM_PAGE_RECORD_SAVE") {
        chrome.runtime.sendMessage({ message: "FROM_RECORD_SAVE", data: event.data.data });
    } else if (event.data.message === "FROM_PAGE_RECORD_COMPLETE") {
        chrome.runtime.sendMessage({ message: "FROM_RECORD_COMPLETE" });
    } else if (event.data.message === "FROM_PAGE_PLAYBACK_COMPLETE") {
        chrome.runtime.sendMessage({ message: "FROM_PLAYBACK_COMPLETE" });
    } else if (String(event.data.message).includes("FROM_PAGE_ERROR")) {
        chrome.runtime.sendMessage({ message: "FROM_PAGE_ERROR", data: event.data.data });
    } else if (event.data.message === "VIEWER_LOADED") {
        chrome.runtime.sendMessage({ message: "FROM_PAGE_INIT", data: event.data.data }, (response) => handlePageResponse(response));
    } else if (event.data.message === "CONFIRM_BOX_YES") {
        chrome.runtime.sendMessage({ message: "FROM_PAGE_CONFIRM_BOX_YES" }, (response) => handlePageResponse(response));
    } else if (event.data.message === "CONFIRM_BOX_NO") {
        chrome.runtime.sendMessage({ message: "FROM_PAGE_CONFIRM_BOX_NO" });
    } else if (event.data.message === "CONFIRM_BOX_CANCEL_DOWNLOAD") {
        chrome.runtime.sendMessage({ message: "FROM_PAGE_CONFIRM_BOX_STOP_DOWNLOAD" });
    } else if (event.data.message === "MAPPING_REPORT_BOX_YES") {
        chrome.runtime.sendMessage({ message: "FROM_PAGE_MAPPING_REPORT_BOX_YES" }, (response) => handlePageResponse(response));
    } else if (event.data.message === "FROM_PAGE_START_PLAYBACK_RECIPIENT") {
        chrome.runtime.sendMessage({ message: event.data.message });
    } else if (event.data.message === "FROM_PAGE_LOG") {
        chrome.runtime.sendMessage({ message: "FROM_PAGE_LOG", data: event.data.data });
    }
});

//this is used to inject file into page
function injectScriptFileToPage(filename) {
    var s = document.createElement('script');
    s.src = chrome.runtime.getURL('content_script/' + filename); // This is for new viewer
    s.onload = function () {
        this.parentNode.removeChild(this);
    };
    (document.head || document.documentElement).appendChild(s);
}

//this is used to inject code into page
function injectScriptCodeToPage(code) {
    var actualCode = code;
    var script = document.createElement('script');
    script.textContent = actualCode;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
}

//call back function for send page message to background
function handlePageResponse(response) {
    if (response) {
        if (response.message === "sendData_record") {
            postMessage({ extensionMessage: response.data, type: "record_pageUpdate" }, '*');
        } else if (response.message === "sendData_playback") {
            postMessage({ extensionMessage: response.data, type: "playback_pageUpdate" }, '*');
        } else if (response.message === "sendData_seleniumJson") {
            postMessage({ extensionMessage: response.data, type: "mapping_seleniumJson" }, '*');
        } else if (response.message === "open_confirm_dialog_recipient") {
            injectScriptCodeToPage("cfmBox.print(1); mapBox.print();");
        } else if (response.message === "open_confirm_dialog_same_transaction") {
            injectScriptCodeToPage("cfmBox.print(2); mapBox.print();");
        } else if (response.message === "open_confirm_dialog_diff_transaction") {
            injectScriptCodeToPage("cfmBox.print(3);");
        }
    }
}
