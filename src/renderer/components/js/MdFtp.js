import * as crypto from 'crypto';
import * as http from 'http';
import { Global } from './Global';
import * as fsExc from './FsExecute';
import * as scp2 from 'scp2';
import * as archiver from "archiver";
import * as fs from 'fs';
import { Client } from "ssh2";
import * as url from 'url';
import { ModelMgr } from "./model/ModelMgr";
import * as qiniu from "qiniu";
import * as ExternalUtil from "./ExternalUtil";

export const serverList = [
    { name: "long", host: "47.107.73.43", user: "ftpadmin", password: "unclemiao", path: "/web/feature/long" },
    { name: "icecream", host: "47.107.73.43", user: "ftpadmin", password: "unclemiao", path: "/web/feature/icecream" },
    { name: "release", host: "47.107.73.43", user: "ftpadmin", password: "unclemiao", path: "/web/web/release" },
    { name: "develop", host: "47.107.73.43", user: "ftpadmin", password: "unclemiao", path: "/web/web/develop" },
];

export const channelList = [
    'shangwu',
    'bian_lesson',
    'bian_game'
];

export const versionTypes = ['强制更新', '选择更新', '静态更新'];

var versionType;
export function getVersionType() { return versionType; }
export function setVersionType(value) { versionType = value; }

var displayVersion;
export function getDisplayVersion() { return displayVersion; }
export function setDisplayVersion(value) { displayVersion = value; }

var needPatch;
export function setNeedPatch(value) { needPatch = value; }

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

export async function zipVersion() {
    let zipPath = `${Global.svnPublishPath}/zip/`;
    let webFilePath = `${Global.svnPublishPath}/web/${uploadVersion}/`;
    let cdnFilePath = `${Global.svnPublishPath}/cdn/${uploadVersion}/`;
    let files = await fsExc.readDir(webFilePath);
    let webZipName = needPatch ? "webPatch.zip" : "webRelease.zip";
    let cdnZipName = needPatch ? "cdnPatch.zip" : "cdnRelease.zip";
    for (const iterator of files) {
        if (iterator === "index.html"
            || iterator.indexOf("policyFile") != -1
            || iterator.indexOf(webZipName) != -1) {
            await fsExc.delFile(`${webFilePath}/${iterator}`);
        }
    }

    try {
        await zipProject(webFilePath, zipPath, webZipName);
        await zipProject(cdnFilePath, zipPath, cdnZipName);
    } catch (error) {
        Global.snack(`压缩zip失败`, err);
    }
}

export async function uploadVersionFile() {
    let zipPath = `${Global.svnPublishPath}/zip/`;
    let webZipName = needPatch ? "webPatch.zip" : "webRelease.zip";
    let cdnZipName = needPatch ? "cdnPatch.zip" : "cdnRelease.zip";

    let webZipPath = zipPath + webZipName;
    let cdnZipPath = zipPath + cdnZipName;

    if (!fsExc.exists(webZipPath)) {
        Global.snack(`不存在文件${webZipPath}`);
        return;
    }
    if (!fsExc.exists(cdnZipPath)) {
        Global.snack(`不存在文件${cdnZipPath}`);
        return;
    }
    await scpFile(webZipPath);
    await scpFile(cdnZipPath);

    await unzipProject(serverInfo.path, webZipName);
    await unzipProject(serverInfo.path, cdnZipName);
}

export async function createPolicyFile() {
    if (!serverInfo) {
        Global.snack(`请先选择资源服务器`);
        return;
    }

    if (!channel) {
        Global.snack(`请先选择渠道号`);
        return;
    }

    let indexPath = `${Global.projPath}/rawResource/index.html`;
    let indexContent = await fsExc.readFile(indexPath);
    indexContent = indexContent.replace(`let versionName = "release";`, `let versionName = "${serverInfo.name}";`);
    indexContent = indexContent.replace(`let channel = "bian_game";`, `let channel = "${channel}";`);

    let rawPolicyPath = `${Global.projPath}/rawResource/policyFile.json`;
    let policyContent = await fsExc.readFile(rawPolicyPath);
    let policyObj = JSON.parse(policyContent);
    if (!ModelMgr.ftpModel.useCdn) {
        policyObj.cdnUrl = ``;
    }
    policyContent = JSON.stringify(policyObj);

    let indexFilePath = `${Global.svnPublishPath}/web/${uploadVersion}/index.html`;
    let policyFilePath = `${Global.svnPublishPath}/web/${uploadVersion}/policyFile.json`;
    try {
        await fsExc.writeFile(indexFilePath, indexContent);
        await fsExc.writeFile(policyFilePath, policyContent);
        Global.toast('生成策略文件成功');
    } catch (error) {
        Global.snack('生成策略文件错误', error);
    }
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

    let policyPath = `${Global.svnPublishPath}/web/${uploadVersion}/policyFile.json`;
    let content = await fsExc.readFile(policyPath);
    await fsExc.delFile(policyPath);

    let policyObj = JSON.parse(content);
    policyObj["whiteVersion"] = whiteVersion;
    policyObj["normalVersion"] = normalVersion;
    policyObj["channel"] = channel;
    policyObj["displayVersion"] = displayVersion;
    policyObj["versionType"] = versionTypes.indexOf(versionType);
    content = JSON.stringify(policyObj);

    let newPolicyPath = `${Global.svnPublishPath}/web/${uploadVersion}/policyFile_v${policyNum}.json`;
    await fsExc.writeFile(newPolicyPath, content);

    Global.toast('修改策略文件成功');
}

export async function uploadPolicyFile() {
    let webFilePath = `${Global.svnPublishPath}/web/${uploadVersion}`;

    let files = await fsExc.readDir(webFilePath);
    for (const iterator of files) {
        if (iterator === "index.html"
            || iterator.indexOf("policyFile") != -1) {
            await scpFile(`${webFilePath}/${iterator}`);
        }
    }

    Global.toast('上传策略文件成功');
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
            console.log(`scp --> ${path} --> ${uploaded + 1}/${total}`);
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

function zipProject(fromPath, toPath, zipName) {
    return new Promise((resolve, reject) => {
        let output = fs.createWriteStream(toPath + zipName);
        let archive = archiver("zip");
        archive.pipe(output);
        archive.directory(fromPath, ``);

        archive.on("error", (err) => {
            // Global.snack(`压缩zip:${zipName}失败`, err);
            console.error(`压缩${zipName}失败`, err);
            reject();
        });
        output.on("close", () => {
            // Global.toast(`压缩zip${zipName}成功`);
            console.log(`压缩${zipName}成功`);
            resolve();
        });

        archive.finalize()
    })
}

function unzipProject(filePath, fileName) {
    return new Promise((resolve, reject) => {
        let client = new Client();

        client
            .on("ready", () => {
                console.log("Client :: ready");
                let unzipWeb =
                    "cd " +
                    filePath +
                    "\n" +
                    "unzip -o " +
                    fileName;

                console.log("cmd --> " + unzipWeb);

                client.exec(
                    unzipWeb,
                    { cwd: filePath },
                    (err, stream) => {
                        if (err) throw err;
                        stream
                            .on("close", (code, signal) => {
                                client.end();
                                if (code != 0) {
                                    reject();
                                    console.log("解压zip失败", code);
                                    return;
                                }

                                console.log("解压zip成功");
                                resolve();
                            })
                            .on("data", (data) => {
                                // console.log("STDOUT: " + data);
                            })
                            .stderr.on("data", (data) => {
                                console.log("STDERR: " + data);
                            });
                    }
                );
            })
            .connect({
                host: serverInfo.host,
                user: serverInfo.user,
                password: serverInfo.password,
                path: serverInfo.path
            });
    })
}

export async function applyPolicyNum() {
    if (!policyNum) {
        Global.snack(`请先设置策略版本`);
        return;
    }

    try {
        await ExternalUtil.applyPolicyNum(policyNum, serverInfo.name, channel);
        Global.toast('应用策略版本成功');
    } catch (error) {
        Global.snack('应用策略版本错误', error);
    }

    if (channel === 'bian_lesson') {
        let lessonUrl = "http://api.bellplanet.bellcode.com";
        let parseUrl = url.parse(lessonUrl);
        let getLessonData = `?policy_version=${policyNum}&description="aaa"`
        let lessonOptions = {
            host: parseUrl.hostname, // 请求地址 域名，google.com等..
            // port: 80,
            path: '/bell-planet.change-policy-version' + getLessonData, // 具体路径eg:/upload
            method: 'GET', // 请求方式
            headers: { // 必选信息,  可以抓包工看一下
                'Authorization': 'Basic YmVsbGNvZGU6ZDNuSDh5ZERESw=='
            }
        };
        http.get(lessonOptions, (response) => {
            let resData = "";
            response.on("data", (data) => {
                resData += data;
            });
            response.on("end", async () => {
                console.log(resData);
            });
            response.on("error", async (err) => {
                Global.snack(`应用平台版本号错误`, err);
            });
        });
    }
}

export function checkPolicyNum() {
    return ExternalUtil.getPolicyInfo(serverInfo.name, channel);
}

let maxUploadCount = 10;
export function uploadCdnVersionFile() {
    return new Promise(async (resolve, reject) => {
        let webUploadCount = 0;
        let cdnWebPath = `${Global.svnPublishPath}/web/${uploadVersion}/`;
        let webFilePathArr = [];
        await batchUploaderFiles(cdnWebPath, webFilePathArr);
        await checkUploaderFile(cdnWebPath, webFilePathArr, webUploadCount);

        let releaseUploadCount = 0;
        let cdnReleasePath = `${Global.svnPublishPath}/cdn/${uploadVersion}/`;
        let releaseFilePathArr = [];
        await batchUploaderFiles(cdnReleasePath, releaseFilePathArr);
        await checkUploaderFile(cdnReleasePath, releaseFilePathArr, releaseUploadCount, resolve, reject);
    });
}

export function uploadCdnPolicyFile() {
    return new Promise(async (resolve, reject) => {
        let uploadCount = 0;
        let webFilePath = `${Global.svnPublishPath}/web/${uploadVersion}`;
        let policyFilePathArr = [];
        let files = await fsExc.readDir(webFilePath);
        for (const iterator of files) {
            if (iterator === "index.html"
                || iterator.indexOf("policyFile") != -1) {
                let fullPath = `${webFilePath}/${iterator}`;
                policyFilePathArr.push(fullPath);
            }
        }

        await checkUploaderFile(webFilePath, policyFilePathArr, uploadCount, resolve, reject);
    });
}

async function batchUploaderFiles(rootPath, filePathArr) {
    let files = await fsExc.readDir(rootPath);
    for (const iterator of files) {
        let fullPath = `${rootPath}/${iterator}`;
        let isFolder = await fsExc.isDirectory(fullPath);
        if (isFolder) {
            await batchUploaderFiles(fullPath, filePathArr);
        } else {
            filePathArr.push(fullPath);
        }
    }
}

async function checkUploaderFile(rootPath, filePathArr, uploadCount, resolve, reject) {
    if (uploadCount > maxUploadCount) return;
    if (filePathArr.length == 0) return;

    let filePath = filePathArr.shift();
    let formUploader = new qiniu.form_up.FormUploader(ModelMgr.ftpModel.qiniuConfig);
    let fileKey = filePath.split(`${rootPath}/`)[1];
    let readerStream = fs.createReadStream(filePath);
    let putExtra = new qiniu.form_up.PutExtra();

    uploadCount++;
    formUploader.putStream(ModelMgr.ftpModel.uploadToken, fileKey, readerStream, putExtra, (rspErr, rspBody, rspInfo) => {
        uploadCount--;

        if (rspErr) {
            //单个文件失败
            console.error(rspErr);
        } else {
            if (rspInfo.statusCode == 200) {
                console.log(`cdn --> upload ${fileKey} success`);
                // console.log(rspBody);
            } else {
                console.log(rspInfo.statusCode);
                console.log(rspBody);
            }
        }

        if (filePathArr.length != 0) {
            checkUploaderFile(rootPath, filePathArr, uploadCount, resolve, reject);
        } else {
            if (resolve) {
                resolve();
                console.log(`上传cdn完成`);
            }
        }
    });
}