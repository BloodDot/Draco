import { Global } from "../Global";
import * as fsExc from "../FsExecute";

export class PublishModel {
    oldVersionList;
    oldVersion;
    whiteList;
    policyObj;
    cdnUrl;

    async init() {
        await this.initOldVersionList();
        await this.initPolicyObj();
    }

    async initOldVersionList() {
        this.oldVersionList = [];
        let webDir = await fsExc.readDir(Global.svnPublishPath + "/web/");
        let reg = /[A-Za-z]_*/g;
        for (const iterator of webDir) {
            if (iterator.indexOf("release") != -1) {
                let version = iterator.replace(reg, "");
                this.oldVersionList.push(version);
            }
        }

        this.oldVersionList = this.oldVersionList.sort((a, b) => {
            return a - b;
        });

        if (this.oldVersionList.length > 0) {
            this.oldVersion = this.oldVersionList[this.oldVersionList.length - 1];
        }
    }

    async initPolicyObj() {
        let content = await fsExc.readFile(
            Global.rawResourcePath + "/policyFile.json"
        );
        this.policyObj = JSON.parse(content);
        this.cdnUrl = this.policyObj.cdnUrl;
        this.whiteList = this.policyObj.whiteList;
    }

    async setCdnUrl(value) {
        this.policyObj.cdnUrl = value;
        this.savePolicyObj();
    }

    async setWhiteList(value) {
        this.policyObj.whiteList = value;
        this.savePolicyObj();
    }

    async savePolicyObj() {
        await fsExc.writeFile(
            Global.rawResourcePath + "/policyFile.json",
            JSON.stringify(this.policyObj)
        );
    }
}