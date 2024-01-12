
chrome.runtime.onMessage.addListener(
    (request) => {
        if (request.message == "simq_login") {
            document.getElementById("loginForm-UserName").value = request.data.id;
            document.getElementById("loginForm-UserPassword").value = request.data.pin;
            injectCode("aexUIHandler.loginSubmit()");
            setTimeout(() => {
                if (isLoginFail()) {
                    chrome.runtime.sendMessage({ message: "loggin_failed_simq" });
                    console.log("sent");
                } else if (isLoginFail() == false) {
                    setTimeout(() => {
                        openTransaction(request.data.meta, 1000);
                    }, 2000);
                }
            }, 1000);
        } else if (request.message == "playback_Called_from_PopUp_SKIP_LOGIN") {
            openTransaction(request.data.json.meta, 0);
        } 
    }
);

function isLoginFail() {
    if (window.location.href == "https://usdevstage.agreementexpress.net/html5/manager/agreementExpress.jsp"
        || window.location.href == "https://staging.agreementexpress.net/html5/manager/agreementExpress.jsp"
        || window.location.href == "https://uat.agreementexpress.net/html5/manager/agreementExpress.jsp") {
        return true
    } else if (window.location.href == "https://usdevstage.agreementexpress.net/html5/manager/agreementExpress.jsp#templateHomeNavigationPage"
        || window.location.href == "https://staging.agreementexpress.net/html5/manager/agreementExpress.jsp#templateHomeNavigationPage"
        || window.location.href == "https://uat.agreementexpress.net/html5/manager/agreementExpress.jsp#templateHomeNavigationPage") {
        return false;
    }
}

function openTransaction(transInfo, waitTime) {

    var companyId = transInfo.companyId;
    var folderId = transInfo.transactionFolderId;
    var companies = document.getElementById("selectCompany");
    var option = -1;

    for (var i = 0; i < companies.length; i++) {
        if (companies[i].value == companyId) {
            option = i;
            break;
        }
    }

    if (option == -1 && i > 0) {
        //send message that company not exist in the list
        return;
    } else {
        companies.selectedIndex = option;
        injectCode("aexUIHandler.selectCompany()");
    }

    setTimeout(() => {
        injectCode("aexUIHandler.setupTransactionPublish(" + folderId + ")");
    }, waitTime);

}

function injectCode(code) {
    var script = document.createElement('script');
    script.textContent = code;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
}