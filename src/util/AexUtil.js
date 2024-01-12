import { ChromeUtil } from "./ChromeUitl";

class AexUtil {

    static AexServer = {
        LOCAL: "LOCAL",
        DEVSTAGE: "DEVSTAGE",
        STAGING: "STAGING",
        UAT: "UAT",
        USPROD: "USPROD",
        CAPROD: "CAPROD"
    };

    static AexServerUrl = {
        LOCAL: "http://localhost:8080",
        DEVSTAGE: "https://usdevstage.agreementexpress.net",
        STAGING: "https://staging.agreementexpress.net",
        UAT: "https://uat.agreementexpress.net",
        USPROD: "https://us.agreementexpress.net",
        CAPROD: "https://agreementexpress.net"
    }

    static generatreFormData(obj) {
        const fd = new FormData();
        for (let key in obj) {
            fd.append(key, obj[key]);
        }
        return fd;
    }

    constructor(server) {
        this.server = server;
        this.secToken = null;
    }


    getCrendentials() {
        return ChromeUtil.getFromStorage("credentials")
            .then(({ credentials }) => {
                return credentials ? credentials[this.server] || {} : {};
            });
    }

    getServerUrl() {
        return AexUtil.AexServerUrl[this.server];
    }

    async login() {
        const { username, password } = await this.getCrendentials();
        if (!(username && password)) {
            return Promise.reject("No credentials is provided.");
        }
        return this.callServer({
            url: "/api/InboxUI/v3/login",
            option: {
                method: "POST",
                body: new URLSearchParams(AexUtil.generatreFormData({
                    AEX_USER_NAME: username,
                    AEX_USER_PASSWORD: password,
                    AEX_USER_LOGIN: false
                }))
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            useSecToken: false
        })
            .then(res => res.json())
            .then(({ errorCode, res }) => {
                console.log(errorCode);
                if(errorCode != 1){
                    return Promise.reject("Invalid Credential!");
                }

                this.secToken = res;
                return res;
            });
    }

    async getToken() {
        if (this.secToken) {
            return this.secToken;
        } else {
            return this.login();
        }
    }

    async callServer({ url, option, useSecToken }) {
        if (useSecToken) {
            option.headers = option.headers || {};
            option.headers["AEX_SEC_TOKEN"] = await this.getToken();
        }
        return fetch(`${this.getServerUrl()}${url}`, option);
    }

}

const aexUtils = {};

for (let key in AexUtil.AexServer) {
    const server = AexUtil.AexServer[key];
    aexUtils[server] = new AexUtil(server);
};

export { AexUtil, aexUtils };