const udpElementAttributeFlag = "udpRecordId";

window.addEventListener("load", () => {
    chrome.runtime.onMessage.addListener(function (
        request,
        sender,
        sendResponse
    ) {
        if (request.message === "startRecord") {
            console.log("Content page has received start");
            addUdpRecordEventListenerToPage();
            startWatcher();
        } else if (request.message === "stopRecord") {
            removeUdpRecordEventListenerFromPage();
            stopWatcher();
        }
    });
});

// TODO:
// checks if the element has a UDP record element signature, this element should have some type of functionality associated to it
function isUdpRecordElement(element) {
    return element.hasAttribute(udpElementAttributeFlag);
}

// function to get add event listener to all elements. if you click on an inner element without a onclick action, it'll iterate to the parent until it finds a UDP record element
const clickEvent = (event) => {
    event.stopPropagation();
    let element = event.target;

    while (
        element &&
        element !== document.body &&
        !isUdpRecordElement(element)
    ) {
        element = element.parentNode;
    }

    if (element && element !== document.body) {
        const elementInfo = {
            type: "click",
            id: element.id,
        };

        // Send a message to the background script with the extracted data
        chrome.runtime.sendMessage({ data: elementInfo });
    }
};

// // function to get add event listener to all elements. if you click on an inner element without a onclick action, it'll iterate to the parent until it finds a UDP record element
// const clickEvent = (event) => {

//     let element = event.target;
//     console.log(element + 'this element was clicked logged')

//     const elementInfo = {
//         type: "click",
//         id: element.id,
//     };

//     // Send a message to the background script with the extracted data
//     chrome.runtime.sendMessage({ data: elementInfo });
// };

const inputEvent = (event) => {
    event.stopPropagation();
    const elementInfo = {
        type: "input",
        id: event.target.id,
        value: event.target.value,
    };

    // Send a message to the background script with the extracted data
    chrome.runtime.sendMessage({ data: elementInfo });
};

// function to add event listener to all UDP click elements
function addUdpRecordEventListenerToPage() {
    // let udpRecordElements = document.querySelectorAll('[id*="UDP_Record"');
    // let udpRecordElements = document.querySelectorAll("*");
    let udpRecordElements = document.querySelectorAll("[udpRecordId]");

    udpRecordElements.forEach((element) => {
        if (element.tagName.toLowerCase() == "input") {
            element.addEventListener("input", inputEvent);
            console.log(element.id + " input eventListener added");
        } else {
            element.addEventListener("click", clickEvent);
            console.log(element.id + " click eventListener added");
        }
    });
}

function removeUdpRecordEventListenerFromPage() {
    let udpRecordElements = document.querySelectorAll("[udpRecordId]");
    udpRecordElements.forEach((element) => {
        // let eventListeners = element.eventListeners
        // let eventListeners = getEventListeners(element)
        // console.log(eventListeners)
        // element.removeEventListener('click', clickEvent);
        // element.removeEventListener('input', inputEvent);
        // element.getEventListeners()
        // // remove click event listeners
        // if (eventListeners[clickEvent]) {
        //     console.log('removed click event listener')
        //     element.removeEventListener('click', clickEvent);
        // }
        // // remove input event listeners
        // if (eventListeners[inputEvent]) {
        //     console.log('removed input event listener')
        //     element.removeEventListener('input', inputEvent);
        // }
    });
}


// let ongoingRequests = {};
// let watcherActive = false;

// chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
//     if (request.action === "startWatcher") {
//         startWatcher();
//     } else if (request.action === "stopWatcher") {
//         stopWatcher();
//     }
// });

// function startWatcher() {
//     // Reset ongoing requests
//     ongoingRequests = {};

//     // Set the watcher as active
//     watcherActive = true;

//     // Add network request listeners
//     chrome.webRequest.onBeforeRequest.addListener(
//         onRequestStart,
//         { urls: ["<all_urls>"] },
//         ["blocking"]
//     );

//     chrome.webRequest.onCompleted.addListener(onRequestComplete, {
//         urls: ["<all_urls>"],
//     });

//     // Implement the logic for continuously watching for new network calls
//     // For demonstration purposes, we'll log a message for each new request
//     setInterval(function () {
//         if (watcherActive) {
//             console.log("Watching for new network calls...");
//             checkIfAllRequestsCompleted();
//         }
//     }, 500);
// }

// function stopWatcher() {
//     // Remove network request listeners
//     chrome.webRequest.onBeforeRequest.removeListener(onRequestStart);
//     chrome.webRequest.onCompleted.removeListener(onRequestComplete);

//     // Set the watcher as inactive
//     watcherActive = false;
// }

// function onRequestStart(details) {
//     // Mark the request as ongoing
//     ongoingRequests[details.requestId] = true;
// }

// function onRequestComplete(details) {
//     // Update the status of the completed request
//     delete ongoingRequests[details.requestId];
//     checkIfAllRequestsCompleted();
// }

// function checkIfAllRequestsCompleted() {
//     if (Object.keys(ongoingRequests).length === 0) {
//         removeUdpRecordEventListenerFromPage()
//         addUdpRecordEventListenerToPage()
//     }
// }

