import * as http from 'http';
import * as crypto from 'crypto';

/** 获取策略信息 */
export function getPolicyInfo(versionName) {
    return new Promise((resolve, reject) => {
        let time = Math.floor(new Date().getTime() / 1000);
        let due = 1800;
        let token = "*";
        let channel = "bian_game"

        let policyQueryServer = 'policy-server.wkcoding.com';
        let url = new URL('//' + policyQueryServer + '/getVersion', window.location);
        url.searchParams.append('versionName', versionName);
        url.searchParams.append('channel', channel);
        url.searchParams.append('time', time);
        url.searchParams.append('due', due);
        url.searchParams.append('token', token);
        let request = new XMLHttpRequest();
        request.open("GET", url);
        request.onreadystatechange = () => {
            if (request.readyState !== 4) return;
            if (request.status === 200) {
                console.log(request.responseText);
                resolve(request.responseText);
            } else {
                reject("获取版本号错误!");
            }
        }
        request.send(null);
    });
}

/** 应用策略版本号 */
export function applyPolicyNum(policyNum, versionName, channel) {
    return new Promise((resolve, reject) => {
        let time = Math.floor(new Date().getTime() / 1000);
        let secret = "LznauW6GzBsq3wP6";
        let due = 1800;
        let tokenStr = versionName + channel + time + secret + due;
        let token = crypto
            .createHash('md5')
            .update(tokenStr)
            .digest('hex');

        let policyQueryServerOld = '47.107.73.43:10001';
        let oldUrl = new URL('//' + policyQueryServerOld + '/setVersion', window.location);
        oldUrl.searchParams.append('versionName', versionName);
        oldUrl.searchParams.append('channel', channel);
        oldUrl.searchParams.append('time', time);
        oldUrl.searchParams.append('due', due);
        oldUrl.searchParams.append('token', token);
        oldUrl.searchParams.append('version', policyNum);
        let oldRequest = new XMLHttpRequest();
        oldRequest.open("GET", oldUrl);
        oldRequest.onreadystatechange = () => {
            if (oldRequest.readyState !== 4) return;
            if (oldRequest.status === 200) {
                console.log(`47: ${oldRequest.responseText}`);
                resolve(oldRequest.responseText);
            } else {
                reject("获取版本号错误!");
            }
        }
        oldRequest.send(null);

        let policyQueryServer = 'policy-server.wkcoding.com';
        let url = new URL('//' + policyQueryServer + '/setVersion', window.location);
        url.searchParams.append('versionName', versionName);
        url.searchParams.append('channel', channel);
        url.searchParams.append('time', time);
        url.searchParams.append('due', due);
        url.searchParams.append('token', token);
        url.searchParams.append('version', policyNum);
        let request = new XMLHttpRequest();
        request.open("GET", url);
        request.onreadystatechange = () => {
            if (request.readyState !== 4) return;
            if (request.status === 200) {
                console.log(`wkcoding:${request.responseText}`);
                resolve();
            } else {
                reject("获取版本号错误!");
            }
        }
        request.send(null);
    });
}

/** 获取a和b数组的差集 */
export function getDiffInABArray(a, b, compareFunc) {
    let diffArr = [];
    let dd = false;
    for (let i = 0; i < a.length; i++) {
        for (let j = 0; j < b.length; j++) {
            if (compareFunc) {
                dd = compareFunc(a[i], b[i])
            } else {
                dd = a[i] === b[j];
            }

            if (dd) {
                break;
            }
        }

        if (!dd) {
            diffArr.push(a[i]);
        }
    }

    return diffArr;
}

/** 获取a和b对象的差集 */
export function getDiffInABObject(a, b, compareFunc) {
    let diffArr = [];
    for (const key in a) {
        let dd = false;
        if (compareFunc) {
            dd = compareFunc(a[key], b[key]);
        } else {
            dd = a[key] === b[key];
        }

        if (!dd) {
            let result = {};
            result[key] = a[key];
            diffArr.push(result);
        }
    }

    return diffArr;
}