/**
 * This is not being used as this method is limited by file size of 4M
 * 
 * get the current attachment List:
 * AttachmenUtil.getAttachmentList().then((attachmentList) => { do something with the attachmentList (ex. save it to json) });
 * 
 * upload the attachment to AEX using attachmentList from json:
 * const attachmentList = json.blahblah // get it from your json object
 * AttachmentUtil.uploadAttachmentUsingAPI(attachmentList);
 */
class AttachmentUtil { }
AttachmentUtil.attachmentList = [];
AttachmentUtil.running = false;
AttachmentUtil.viewableTypes = [".jpg", ".png", ".gif", ".jpeg"];
AttachmentUtil.documentType = ["pdf", "tiff", "tif", "png", "jpg", "jpeg", "doc", "docx", "gif", "rtf", "ppt", "xls"];
AttachmentUtil.getAttachmentList = function () {
    if (AttachmentUtil.running)
        return new Promise((resolve, reject) => {
            reject("AttachmentUtil is already running");
        });
    if(!AttachmentUtil.locateCurDocId())
        return new Promise((resolve, reject) => {
            reject("Invalid URL");
        });
    AttachmentUtil.running = true;
    AttachmentUtil.attachmentList = [];    
    const link = `${window.location.origin}/Html5Controller?cmd=getDocuments&guid=${AttachmentUtil.locateCurDocId()}`;
    return fetch(link)
        .then(res => res.json())
        .then(array => array.filter(doc => doc.isAttachment == '1'))
        .then(attachments => {
            const promises = attachments.map(attachment => AttachmentUtil.mapToBase64EncodedFileBaseOnType(attachment));
            return Promise.all(promises);
        })
        .then(() => {
            AttachmentUtil.running = false;
            return AttachmentUtil.attachmentList
        });
}

AttachmentUtil.locateCurDocId = function (){
    var url_string = window.location.href; 
    var url = new URL(url_string);
    return url.searchParams.get("docId");
}

AttachmentUtil.mapToBase64EncodedFileBaseOnType = function (attachment) {
    return fetch(AttachmentUtil.getAttachmentLink(attachment))
        .then(res => res.blob())
        .then(blob => {
            return AttachmentUtil.readFile(blob)
                .then((dataURL) => {
                    return {
                        dataURL,
                        displayName: attachment.displayName,
                        fileName: attachment.documentName,
                        options: {
                            type: blob.type,
                        },
                        isRaw: attachment.isRawAttachment == "1"
                    };
                })
                .then(serializedFile => AttachmentUtil.attachmentList.push(serializedFile));
        });
}

AttachmentUtil.readFile = function (file) {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.onload = (e) => {
            resolve(e.target.result);
        };
        fileReader.readAsDataURL(file);
    });
}

AttachmentUtil.isImageAttachment = function (fileName) {
    return AttachmentUtil.viewableTypes.some((type) => fileName.toLowerCase().endsWith(type));
}

AttachmentUtil.isDocumentTypeAttachment = function (fileName) {
    return AttachmentUtil.documentType.some((type) => fileName.toLowerCase().endsWith(type));
}

AttachmentUtil.getAttachmentLink = function (attachment) {
    return AttachmentUtil.isImageAttachment(attachment.documentName) ?
        `${window.location.origin}/Html5Controller?cmd=getImg&page=1&guid=${attachment.guid}` :
        `${window.location.origin}/Html5Controller?cmd=getAttachmentPDF&userEmail=${AttachmentUtil.locateCurUser()}&guid=${attachment.guid}`;
}

AttachmentUtil.locateCurUser = function () { 
    return window.location.href.includes("workflow") ? AgreementManager.currentUser : getAgreementInterface().currentUser;
}

AttachmentUtil.getArrayBufferFromDataUrl = function (dataurl) {
    var arr = dataurl.split(','),
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return [u8arr];
}

AttachmentUtil.deserializeFile = function (file) {
    return new File(
        AttachmentUtil.getArrayBufferFromDataUrl(file.dataURL),
        file.fileName,
        file.options
    );
}

AttachmentUtil.uploadAttachmentUsingAPI = function (attachmentList) {
    const promiseList = [];
    attachmentList.forEach(attachment => {
        const formData = new FormData();
        formData.append('attachment0', AttachmentUtil.deserializeFile(attachment));
        const link = `${window.location.origin}/Html5Controller?cmd=addAttachment&companyId=${uploadedJson.meta.companyId}&guid=${AttachmentUtil.locateCurDocId()}&userName=${AttachmentUtil.locateCurUser()}&rawUpload=${attachment.isRaw}&documentType=&documentGroup=&attachmentName=${attachment.displayName}&date=${Date.now()}`;
        
        const promise = fetch(link, {
            method: 'POST',
            body: formData
        })
            .then(res => res.text())
            .then(text => {
                const resArr = text.split('|,');
                const success = resArr[0].split('=')[1] === 'success';
                if (!success)
                    console.error(`Failed to upload ${attachment.displayName}; Attachment Type: ${attachment.isRaw ? 'File' : 'Document'}.`);
                return {
                    success,
                    name: attachment.displayName,
                    isRaw: attachment.isRaw,
                    response: resArr[1]
                }
            });
        promiseList.push(promise);
    });
    return Promise.all(promiseList)
        .then(resultList => {
            const successNumber = resultList.filter(result => result.success).length;
            console.log(`Attachment Uploaded, ${successNumber} succeeded, ${resultList.length - successNumber} failed, ${resultList.length} in total.`);
            return resultList;
        });
}

//This is used for MV2 old viewer upload
AttachmentUtil.uploadSerializedFilesAsAttachments = function (fileList) {
	fileList.forEach(file => AttachmentUtil.uploadFileToAttachment(file));
}

AttachmentUtil.uploadFileToAttachment = function (file) {
	window.top.loadDialogElement("ae-dialog-add-attachment-prompt", "addAttachmentPromptDialog");
	window.top.document.querySelector("#addAttachmentPromptDialog").files = [file];
	compoundController.currentTransaction.agreementInterface.uploadFile = [AttachmentUtil.deserializeFile(file)];
	compoundController.currentTransaction.agreementInterface.rawUpload = file.isRaw;
	compoundController.currentTransaction.agreementInterface.addAttachment();
}