console.log("UDP Recorder has successfully loaded");

window.addEventListener("load", () => {
  addUdpRecordEventListenerToPage();
});

// function to get add event listener to all UDP click elemnets
const clickEvent = (event) => {
  const elementInfo = {
    type: 'click',
    id: event.target.id,
  };

  // Send a message to the background script with the extracted data
  chrome.runtime.sendMessage({ data: elementInfo });
};

// function to get add event listener to all UDP input elements
const inputEvent = (event) => {
  const elementInfo = {
    type: 'input',
    id: event.target.id,
    value: event.target.value
  };

  // Send a message to the background script with the extracted data
  chrome.runtime.sendMessage({ data: elementInfo });
};

// function to add event listener to all UDP click elements
function addUdpRecordEventListenerToPage() {
  console.log("add event listener to all object is run");
  //   let allElements = document.querySelectorAll('[id*="UDP_Record"');
  let allElements = document.querySelectorAll("*");

  allElements.forEach((element) => {
    // skip non udp recording elements
    // TODO: add more robust logic when id naming convention has been settled
    if (!element.id) {
      return;
    }

    if (element.tagName.toLowerCase() != "input") {
      element.addEventListener("click", clickEvent);
      console.log(element.id + " click eventListener added");
    } else if (element.tagName.toLowerCase() == "input") {
      element.addEventListener("input", inputEvent);
      console.log(element.id + " input eventListener added");
    }
  });
}

function removeUdpRecordEventListenerFromPage() {
  let allElements = document.querySelectorAll("*");

  allElements.forEach((element) => {
    let eventListeners = getEventListener(element);
    // remove click events 
    if (eventListeners && eventListeners[clickEvent]) {
      element.removeEventListener(clickEvent);
    }
    // remove form input events 
    if(eventListeners && eventListeners[inputEvent]){
        element.removeEventListener(inputEvent);
    }
  });
}

function waitForCondition(checkFunction, callbackFunction, interval = 50) {
  if (checkFunction()) {
    callbackFunction();
  } else {
    setTimeout(() => {
      waitForCondition(checkFunction, callbackFunction, interval);
    }, interval);
  }
}

// function updateAllUdpEventListeners() {
//   removeUdpRecordEventListenerFromPage();
//   addUdpRecordEventListenerToPage();
// }

// // Function to check if all network calls are completed
// function checkNetworkCallsCompleted() {
//   // Your logic to check if all network calls are completed
//   // For example, you can iterate through ongoing XMLHttpRequests
//   // and check their readyState and status properties.
// }

// function areHttpRequestsComplete(callback) {
//   // Track the number of ongoing requests
//   let ongoingRequests = 0;

//   // Event listener to decrement the ongoing requests count when a request completes
//   function onRequestComplete() {
//     ongoingRequests--;
//     checkAllRequestsComplete();
//   }

//   // Override XMLHttpRequest's open method to intercept new requests
//   const originalOpen = XMLHttpRequest.prototype.open;
//   XMLHttpRequest.prototype.open = function () {
//     ongoingRequests++;
//     this.addEventListener("load", onRequestComplete);
//     originalOpen.apply(this, arguments);
//   };

//   // Function to check if all requests are complete and invoke the callback
//   function checkAllRequestsComplete() {
//     if (ongoingRequests === 0) {
//       // All requests are complete
//       callback(true);
//     } else {
//       // Some requests are still ongoing
//       callback(false);
//     }
//   }

//   // Example: Perform asynchronous operations (e.g., AJAX requests)
//   // ...

//   // After initiating requests, call checkAllRequestsComplete to handle cases where there are no requests
//   checkAllRequestsComplete();
// }

// // Example usage:
// areHttpRequestsComplete(function (allComplete) {
//   if (allComplete) {
//     console.log("All HTTP requests are complete.");
//     // Your code here to handle the case where all requests are complete
//   } else {
//     console.log("Some HTTP requests are still ongoing.");
//     // Your code here to handle the case where some requests are still ongoing
//   }
// });

// // Listen for the page to be fully loaded
// window.addEventListener("load", function () {
//   waitForCondition(checkNetworkCallsCompleted, updateAllUdpEventListeners, 20);
// });

// // Listen for changes in the document (DOM) content
// document.addEventListener("DOMContentLoaded", function () {
//   waitForCondition(checkNetworkCallsCompleted, updateAllUdpEventListeners, 20);
// });

// // Listen for XMLHttpRequest changes to track ongoing network requests
// (function (open) {
//   XMLHttpRequest.prototype.open = function (method, url, async) {
//     this.addEventListener("load", function () {
//       // Handle the completion of the network request
//       // You may want to update a counter or perform additional checks
//       if (checkNetworkCallsCompleted()) {
//         // All network calls have been completed, you can proceed with your logic
//       } else {
//         // Network calls are still in progress, you may want to wait or handle accordingly
//       }
//     });

//     open.apply(this, arguments);
//   };
// })(XMLHttpRequest.prototype.open);
