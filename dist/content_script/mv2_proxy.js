chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {

        if (request.message == "mv2_login" || request.message == "mv2_login_Ivari") {
            loginToMV2(request.data.id, request.data.pin);
            sendResponse({ message: "clicked_loggin_button_mv2" });
        } else if (request.message == "open_ivari_transaction") {
            if (isLoginFail() == false) {
                switchCompanyAndOpenTransaction_Ivari(request.data.meta, 4000);
            } else {
                window.alert("AEX Recorder - Login fail! Please try again.")
            }
        } else if (request.message == "open_MV2_transaction") {
            if (isLoginFail() == false) {
                switchCompanyAndOpenTransaction(request.data.meta, 4000);
            } else {
                window.alert("AEX Recorder - Login fail! Please try again.")
            }
        } else if (request.message == "playback_Called_from_PopUp_SKIP_LOGIN") {
            switchCompanyAndOpenTransaction(request.data.json.meta, 0);
        } 
    }
);

function loginToMV2(login, password) {
    document.querySelector('#login').setAttribute('value', login);
    document.querySelector('#password').setAttribute('value', password);
    document.getElementById("loginbutton").click();
}

function isLoginFail() {
    if (window.location.href == "https://usdevstage.agreementexpress.net/mv2/"
        || window.location.href == "https://staging.agreementexpress.net/mv2/"
        || window.location.href == "https://uat.agreementexpress.net/mv2/") {
        return true;
    } else if (window.location.href == "https://usdevstage.agreementexpress.net/mv2/inbox.html"
        || window.location.href == "https://staging.agreementexpress.net/mv2/inbox.html"
        || window.location.href == "https://uat.agreementexpress.net/mv2/inbox.html") {
        return false;
    }
}

function switchCompanyAndOpenTransaction_Ivari(transInfo, waitTime) {
    var companyId = transInfo.companyId;
    setTimeout(() => {
        injectCode("AgreementManager.setCurrentCompany(" + companyId + ", false);");
        setTimeout(() => {
            document.getElementById("openTransaction").click();
        }, 3000);
    }, waitTime);
}

function switchCompanyAndOpenTransaction(transInfo) {
    var companyId = transInfo.companyId;
    var transactionFolderName = transInfo.transactionFolderName;
    setTimeout(() => {
        injectCode("AgreementManager.setCurrentCompany(" + companyId + ", false);");
        setTimeout(() => {
            openTranactionByFab(transactionFolderName);
        }, 3000);
    }, 4000);
}

function openTranactionByFab(transactionFolderName) {
    document.getElementById("expandableFab").click();
    setTimeout(() => {
        document.evaluate("//ae-document-right-panel//*[@id='transactions']//paper-item/div[text()[contains(., '"
            + transactionFolderName + "')]]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.click();
    }, 1000);
}

function injectCode(code) {
    var script = document.createElement('script');
    script.textContent = code;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
}