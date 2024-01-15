class ChromeUtil {

    static sendMessage = (msg, obj) => {
        chrome.runtime.sendMessage({
            message: msg,
            obj
        });
    }

    static localStorage = chrome.storage.local;
    static syncStorage = chrome.storage.sync;
    static managedStorage = chrome.storage.managed;

    /**
     * Local Storage will be used by default if no storage is passed in.
     */
    static getFromStorage(keys, storage) {
        storage = storage || ChromeUtil.localStorage;
        return new Promise((resolve) => {
            storage.get(keys, (res) => {
                resolve(res);
            });
        });
    }

    static setToStorage(data, storage) {
        storage = storage || ChromeUtil.localStorage;
        return new Promise((resolve) => {
            storage.set(data, () => {
                resolve(chrome.runtime.lastError);
            });
        });
    }

    static addJsonToDatabase(inputList) {
        return ChromeUtil.getFromStorage("database")
            .then(({ database }) => {
                return ChromeUtil.setToStorage({ database: [...database, ...inputList] });
            });
    }

    static addJsonToDatabase_import(inputList) {
        return ChromeUtil.getFromStorage("database")
            .then(({ database }) => {
                const newDatabase = database.slice(0);
                inputList.forEach((newJson) => {
                    const index = database.findIndex((oldJson) => {
                        return oldJson.Date == newJson.Date;
                    });
                    if (index > -1) {
                        newDatabase[index] = newJson;
                    } else {
                        newDatabase.push(newJson);
                    }
                });
                return ChromeUtil.setToStorage({ database: newDatabase });
            });
    }

    static setAexCredentials(newCredentials) {
        return ChromeUtil.getFromStorage("credentials")
            .then(({ credentials }) => {
                return ChromeUtil.setToStorage({
                    credentials: {
                        ...credentials,
                        ...newCredentials
                    }
                });
            });
    }

    static clearAexCredentials() {
        return ChromeUtil.setToStorage({
            credentials: {}
        });
    }
}

export { ChromeUtil };