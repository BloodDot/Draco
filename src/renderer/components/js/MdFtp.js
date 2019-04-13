import * as crypto from 'crypto';
import * as http from 'http';
import { Global } from './Global';
import * as fsExc from './FsExecute';
import * as scp2 from 'scp2';
import * as archiver from "archiver";

// import { Client } from 'scp2'

export const serverList = [
    { name: "long", host: "47.107.73.43", user: "ftpadmin", password: "unclemiao", path: "/web/feature/long" },
    { name: "icecream", host: "47.107.73.43", user: "ftpadmin", password: "unclemiao", path: "/web/feature/icecream" },
    { name: "release", host: "47.107.73.43", user: "ftpadmin", password: "unclemiao", path: "/web/web/release" },
    { name: "develop", host: "47.107.73.43", user: "ftpadmin", password: "unclemiao", path: "/web/web/develop" },
];

export const channelList = [
    'shangwu',
    'bian_game'
];

var channel;
export function getChannel() { return channel; }
export function setChannel(value) { channel = value; }

var serverInfo;
export function getServerInfo() { return serverInfo; }
export function setServerInfo(value) { serverInfo = value; }

var uploadVersion;
export function getUploadVersion() { return uploadVersion; }
export function setUploadVersion(value) { uploadVersion = value; }

var policyNum;
export function getPolicyNum() { return policyNum; }
export function setPolicyNum(value) { policyNum = value; }

var whiteVersion;
export function getWhiteVersion() { return whiteVersion; }
export function setWhiteVersion(value) { whiteVersion = value; }

var normalVersion;
export function getNormalVersion() { return normalVersion; }
export function setNormalVersion(value) { normalVersion = value; }

export async function createEntrance() {
    if (!serverInfo) {
        Global.snack(`请先选择资源服务器`);
        return;
    }

    if (!channel) {
        Global.snack(`请先选择渠道号`);
        return;
    }

    let content = `
<script>
    function getVersion(callback) {
        let request = new XMLHttpRequest();
        let versionName = "${serverInfo.name}";
        let channel = "${channel}";
        let time = Math.floor(new Date().getTime() / 1000);
        let secret = "LznauW6GzBsq3wP6";
        let due = 1800;
        let token = "*";

        let url = "http://47.107.73.43:10001/getVersion?versionName=" + versionName + "&&channel=" + channel + "&&time=" + time + "&&due=" + due + "&&token=" + token;
        request.open("GET", url);
        request.onreadystatechange = function () {
            if (request.readyState !== 4) return;
            if (request.status === 200) {
                callback(request.responseText);
            } else {
                alert("获取版本号错误!");
            }
        }
        request.send(null);
    }

    getVersion((value) => {
        let data = JSON.parse(value);
        let policyNum = data.Data.Version;
        let versionXhr = new XMLHttpRequest();
        versionXhr.open('GET', './policyFile_v' + policyNum + '.json', true);
        versionXhr.addEventListener("load", function () {
            let gameVersion = "";
            if (versionXhr.status != 404) {
                let policyObj = JSON.parse(versionXhr.response);
                let account = localStorage.getItem("Account");
                if (policyObj.whiteList.indexOf(account) != -1) {
                    gameVersion = "_v" + policyObj.whiteVersion;
                } else {
                    gameVersion = "_v" + policyObj.normalVersion;
                }
                let hrefArr = location.href.split(".html");
                location.href = hrefArr[0] + gameVersion + ".html"
                    + "?gameVersion=" + gameVersion
                    + "&&displayVersion=" + policyObj.displayVersion
                    + "&&cdnUrl=" + policyObj.cdnUrl
                    + "&&versionType=" + policyObj.versionType
                    + "&&gameChannel=" + policyObj.channel
            } else {
                alert("游戏策略文件加载失败!");
            }
        });

        versionXhr.send();
    });
</script >`

    let indexPath = `${Global.svnPublishPath}/web/${uploadVersion}/index.html`;
    await fsExc.writeFile(indexPath, content);

    Global.toast('生成入口文件成功');
}

export async function modifyPolicyFile() {
    if (!uploadVersion) {
        Global.snack(`请先选择上传版本`);
        return;
    }
    if (!policyNum) {
        Global.snack(`请先设置策略版本`);
        return;
    }

    let releaseDir = `${Global.svnPublishPath}/web/${uploadVersion}`;
    let dir = await fsExc.readDir(releaseDir);
    let policyName = "policyFile.json";
    for (const iterator of dir) {
        if (iterator.indexOf("policyFile") != -1) {
            policyName = iterator;
        }
    }

    let policyPath = `${releaseDir}/${policyName}`;
    let content = await fsExc.readFile(policyPath);
    await fsExc.delFile(policyPath);

    let policyObj = JSON.parse(content);
    policyObj["whiteVersion"] = whiteVersion;
    policyObj["normalVersion"] = normalVersion;
    policyObj["channel"] = channel;
    content = JSON.stringify(policyObj);

    let newPolicyPath = `${releaseDir}/policyFile_v${policyNum}.json`;
    await fsExc.writeFile(newPolicyPath, content);

    Global.toast('修改策略文件成功');
}

export async function uploadVersionFile() {
    let webPath = `${Global.svnPublishPath}/web/${uploadVersion}`;
    let cdnPath = `${Global.svnPublishPath}/cdn/${uploadVersion}`;

    // let filePath = Global.svnPublishPath + "/versionList.json";
    await scpFile(webPath);
    await scpFile(cdnPath);

    Global.toast('上传版本成功');
}

async function scpFile(path) {
    // return new Promise((resolve, reject) => {

    //     var client = new Client({
    //         port: 22,
    //         host: serverInfo.host,
    //         username: serverInfo.user,
    //         privateKey: serverInfo.password,
    //         // password: 'password', (accepts password also)
    //     });

    //     client.on("transfer", (buffer, uploaded, total) => {
    //         console.log(`--------uploaded:${uploaded}, total:${total}`);
    //     });

    //     client.upload(path, serverInfo.path, (err) => {
    //         if (err) {
    //             reject();
    //             Global.snack("上传错误", err);
    //         } else {
    //             resolve();
    //         }
    //     });


    return new Promise((resolve, reject) => {
        var client = new scp2.Client();
        client.on("transfer", (buffer, uploaded, total) => {
            // console.log(`--------uploaded:${uploaded}, total:${total}`);
        });

        scp2.scp(
            path,
            {
                host: serverInfo.host,
                user: serverInfo.user,
                password: serverInfo.password,
                path: serverInfo.path
            },
            client,
            (err) => {
                if (err) {
                    reject();
                    Global.snack("上传错误", err);
                } else {
                    resolve();
                }
            }
        );
    });
}

function zipProject(path) {
    let pathArr = fsExc.getFilePath(path);
    let fileName = pathArr[0];
    let filePath = pathArr[1];

    let output = fs.createWriteStream(filePath + fileName + ".zip");
    let archive = archiver("zip");

    archive.on("error", function (err) {
        console.log("压缩zip失败,错误" + err);
        ipcRenderer.send("client_show_snack", "压缩zip失败");
    });
    output.on("close", function () {
        console.log("压缩zip成功");
        ipcRenderer.send("client_show_toast", "压缩zip成功");
    });

    archive.pipe(output);
    archive.directory(this.client_remote_assets_path, fileName);
    archive.finalize();
}

function unzipProject() {
    let pathArr = this.getFilePath(this.client_remote_assets_path);
    let fileName = pathArr[0];
    let filePath = pathArr[1];
    let conn = new Client();
    let self = this;

    conn
        .on("ready", function () {
            console.log("Client :: ready");
            let cmdStr =
                "cd " +
                self.client_remote_server_operate_path +
                "\n" +
                "unzip -o " +
                fileName +
                ".zip";

            console.log("cmd---" + cmdStr);

            conn.exec(
                cmdStr,
                { cwd: self.client_remote_server_operate_path },
                function (err, stream) {
                    if (err) throw err;
                    stream
                        .on("close", function (code, signal) {
                            conn.end();
                            console.log("解压zip成功");
                            ipcRenderer.send("client_show_toast", "解压zip成功");
                        })
                        .on("data", function (data) {
                            console.log("STDOUT: " + data);
                        })
                        .stderr.on("data", function (data) {
                            console.log("STDERR: " + data);
                        });
                }
            );
        })
        .connect({
            host: this.client_remote_server_ip,
            port: 22,
            username: this.client_remote_server_user,
            password: this.client_remote_server_password
        });
}

export function applyPolicyNum() {
    return new Promise((resolve, reject) => {
        if (!policyNum) {
            Global.snack(`请先设置策略版本`);
            resolve();
            return;
        }

        let versionName = serverInfo.name;
        let time = Math.floor(new Date().getTime() / 1000);
        let secret = "LznauW6GzBsq3wP6";
        let due = 1800;
        let tokenStr = versionName + channel + time + secret + due;
        let token = crypto
            .createHash('md5')
            .update(tokenStr)
            .digest('hex');

        let getData = `?versionName=${versionName}&&channel=${channel}&&time=${time}&&due=${due}&&token=${token}&&version=${policyNum}`

        let options = {
            host: '47.107.73.43', // 请求地址 域名，google.com等..
            port: 10001,
            path: "/setVersion" + getData, // 具体路径eg:/upload
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
            response.on("end", async () => {
                console.log(resData);

                let policyListPath = Global.svnPublishPath + "/policyList.json"
                let policyListContent = await fsExc.readFile(policyListPath);
                let policyList = JSON.parse(policyListContent);
                let policyStr = policyNum + "";
                if (policyList.policy.indexOf(policyStr) == -1) {
                    policyList.policy.push(policyNum + "")
                }
                await fsExc.writeFile(policyListPath, JSON.stringify(policyList));
                resolve();
            });
        })
    });
}

export function checkPolicyNum() {
    return new Promise((resolve, reject) => {
        let versionName = serverInfo.name;
        let channel = "bian_game";
        let time = Math.floor(new Date().getTime() / 1000);
        let due = 1800;
        let token = "*";
        // let token = crypto
        //     .createHash('md5')
        //     .update(tokenStr)
        //     .digest('hex');

        let getData = `?versionName=${versionName}&&channel=${channel}&&time=${time}&&due=${due}&&token=${token}`

        let options = {
            host: '47.107.73.43', // 请求地址 域名，google.com等..
            port: 10001,
            path: "/getVersion" + getData, // 具体路径eg:/upload
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
                console.log(resData);
                resolve(resData);
            });
        })
    });
}