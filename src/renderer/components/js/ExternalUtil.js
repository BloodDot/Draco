import * as http from 'http';
import * as crypto from 'crypto';

/** 获取策略信息 */
export function getPolicyInfo(versionName) {
    return new Promise((resolve, reject) => {
        let time = Math.floor(new Date().getTime() / 1000);
        let due = 1800;
        let token = "*";
        let channel = "bian_game"
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
                resolve();
            });
        })
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