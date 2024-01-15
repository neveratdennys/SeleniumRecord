console.log("UDP Recorder has successfully loaded");

window.addEventListener("load", () => {
  addUdpRecordEventListenerToPage();
});

// function to get add event listener to all UDP click elemnets
const clickEvent = (event) => {
  console.log("user clicked a button ");
  const data = event.target;
  const elementInfo = {
    type: event.target.tagName.toLowerCase(),
    id: event.target.id,
  };

  // Send a message to the background script with the extracted data
  chrome.runtime.sendMessage({ data: elementInfo });
};

// function to add event listener to all UDP click elements
function addUdpRecordEventListenerToPage() {
  console.log("add event listner to all object is run");
  // removeUdpRecordEventListenerFromPage()
  //   let allElements = document.querySelectorAll('[id*="UDP_Record"');
  let allElements = document.querySelectorAll("*");

  allElements.forEach((element) => {
    element.addEventListener("click", clickEvent);
  });
}

function removeUdpRecordEventListenerFromPage() {
  let allElements = document.querySelectorAll("*");

  allElements.forEach((element) => {
    let eventListeners = getEventListener(element);
    if (eventListeners && eventListeners[clickEvent]) {
      element.removeEventListener(clickEvent);
    }
  });
}

// // Function to check if all network calls are completed
// function checkNetworkCallsCompleted() {
//   // Your logic to check if all network calls are completed
//   // For example, you can iterate through ongoing XMLHttpRequests
//   // and check their readyState and status properties.
// }

// // Listen for the page to be fully loaded
// window.addEventListener("load", function () {
//   // Your code here that needs to run after the page has fully loaded

//   // Check if all network calls are completed
//   if (checkNetworkCallsCompleted()) {
//     // All network calls have been completed, you can proceed with your logic
//   } else {
//     // Network calls are still in progress, you may want to wait or handle accordingly
//   }
// });

// // Listen for changes in the document (DOM) content
// document.addEventListener("DOMContentLoaded", function () {
//   // Your code here that needs to run after the DOM content has loaded

//   // Check if all network calls are completed
//   if (checkNetworkCallsCompleted()) {
//     // All network calls have been completed, you can proceed with your logic
//   } else {
//     // Network calls are still in progress, you may want to wait or handle accordingly
//   }
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

// // function to watch for network changes
// function watchNetworkChange() {}

// function addClickeEvent(element) {
//   element.addEventListener(clickEvent);
// }
