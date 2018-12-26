import { spawn } from "child_process";
import { exec } from "child_process";

import * as global from './Global.js';

export function runSpawn(command, para, cwd, successMsg, errorMsg) {
    return new Promise((resolve, reject) => {
        let process = spawn(command, [para], { cwd: cwd });
        process.stdout.on("data", data => {
            console.log("stdout: " + data);
        });
        process.stderr.on("data", data => {
            console.log("stderr: " + data);
        });
        process.on("exit", code => {
            if (code == 0) {
                if (successMsg) {
                    global.toast(successMsg);
                }
                resolve();
            } else {
                if (errorMsg) {
                    global.snack(errorMsg);
                }
                reject();
            }
        });
    });
}

export function svnUpdate(path, successMsg, errorMsg) {
    return new Promise((resolve, reject) => {
        let process = spawn("svn", ["update"], { cwd: path });
        process.stdout.on("data", data => {
            console.log("stdout: " + data);
        });
        process.stderr.on("data", data => {
            console.log("stderr: " + data);
        });

        process.on("exit", code => {
            if (code == 0) {
                global.toast(successMsg);
                resolve();
            } else {
                global.snack(errorMsg, code);
                reject();
            }
        });
    });
}

export function gitPull(path, successMsg, errorMsg) {
    return new Promise((resolve, reject) => {
        let process = spawn("git", ["pull"], { cwd: path });
        process.stdout.on("data", data => {
            console.log("stdout: " + data);
        });

        process.stderr.on("data", data => {
            console.log("stderr: " + data);
        });

        process.on("exit", code => {
            if (code == 0) {
                global.toast(successMsg);
                resolve();
            } else {
                global.snack(errorMsg, code);
                reject();
            }
        });
    });
}

export function runCmd(cmd, cwd, successMsg, errorMsg) {
    return new Promise((resolve, reject) => {
        let process = exec(cmd, { cwd: cwd }, (error) => {
            if (error) {
                global.snack(errorMsg, error);
                reject();
            } else {
                global.toast(successMsg);
                resolve();
            }
        });

        process.stdout.on("data", data => {
            console.log("stdout: " + data);
        });
        process.stderr.on("data", data => {
            console.log("stderr: " + data);
        });
    });
}