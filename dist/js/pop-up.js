$(document).ready(function () {
  const startRecordBtn = document.getElementById("startBtn");
  const stopRecordBtn = document.getElementById("stopBtn");

  startRecordBtn.addEventListener("click", () => {
    chrome.storage.local.set({ popupState: {isRecording: true} }, function() {});
    startRecordBtn.disabled = true
    stopRecordBtn.disabled = false
    startRecording();
  });
  
  stopRecordBtn.addEventListener("click", () => {
    chrome.storage.local.set({ popupState: {isRecording: false} }, function() {});
    startRecordBtn.disabled = false
    stopRecordBtn.disabled = true
    stopRecording();
  });

  // Restore state from chrome.storage when the popup is opened
  function restorePopupState() {
    chrome.storage.local.get(['popupState'], function(result) {
        const stateData = result.popupState || {}; // Default to an empty object if not found
        if (stateData.isRecording) {
            stopRecordBtn.disabled = false;
            startRecordBtn.disabled = true
        } else {
            stopRecordBtn.disabled = true;
            startRecordBtn.disabled = false
        }
    });
  }

  restorePopupState();
});


/**
 * start Recording, send message to background and page
*/
function startRecording() {
  // send message to the content script
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    var activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, { message: "startRecord" });
  });

  // send message to the background script 
  chrome.runtime.sendMessage({ action: "startRecord" });
}

/**
 * Stop Recording
 */
function stopRecording() {
  // send message to the background script
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    var activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, { message: "stopRecord" });
  });

  // send message to the content script
  chrome.runtime.sendMessage({ action: "stopRecord" });
}


