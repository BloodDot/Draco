import { Global } from "../Global";
import * as fsExc from "../FsExecute";
import * as ExternalUtil from "../ExternalUtil";
import * as http from 'http';

export class PublishModel {
    oldVersionList;
    oldVersion;
    whiteList;
    policyObj;
    cdnUrl;
    releaseVersion;

    async init() {
        await this.initOldVersionList();
        await this.initPolicyObj();
        await this.initReleaseVersion();
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

    async initReleaseVersion() {
        return new Promise(async (resolve, reject) => {
            let value = await ExternalUtil.getPolicyInfo("release", "bian_game");
            let data = JSON.parse(value);
            if (data.Code != 0) return;
            let policyNum = +data.Data.Version;
            let options = {
                host: '47.107.73.43', // 请求地址 域名，google.com等..
                // port: 10001,
                path: `/web/release/policyFile_v${policyNum}.json`, // 具体路径eg:/upload
                method: 'GET', // 请求方式, 这里以post为例
                headers: { // 必选信息,  可以抓包工看一下
                    'Content-Type': 'application/json'
                }
            };
            http.get(options, (response) => {
                let resData = "";
                response.on("data", (data) => {
                    resData += data;
                });
                response.on("end", () => {
                    // console.log(resData);
                    let obj = JSON.parse(resData);
                    this.releaseVersion = parseInt(obj.normalVersion) + 1;
                    resolve();
                });
            })
        });
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