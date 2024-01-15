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
  chrome.runtime.sendMessage({ action: "startRecord" });
}

/**
 * Stop Recording
 * If in viewer, send message to page, If not, send to background page
 */
function stopRecording() {
  chrome.runtime.sendMessage({ action: "stopRecord" });
}


