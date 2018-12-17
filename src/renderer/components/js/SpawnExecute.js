import { spawn } from "child_process";
import { exec } from "child_process";
import { ipcRenderer } from "electron";

import { global } from './Global.js';

function svnUpdate(path, successMsg, errorMsg) {
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
                ipcRenderer.send("client_show_toast", successMsg);
                resolve();
            } else {
                ipcRenderer.send("client_show_snack", errorMsg + ":" + code);
                reject();
            }
        });
    });
}

function gitPull(path, successMsg, errorMsg) {
    return new Promise((resolve, reject) => {
        let process = spawn("git", ["pull"], { cwd: path });
        process.stdout.on("data", data => {
            console.log("stdout: " + data);
        });

        process.stderr.on("data", data => {
            console.log("stderr: " + data);
        });

        process.on("exit", code => {
            if (code != 0) {
                ipcRenderer.send("client_show_snack", errorMsg + ":" + code);
                reject();
            } else {
                ipcRenderer.send("client_show_toast", successMsg);
                resolve();
            }
        });
    });
}

function runCmd(cmd, successMsg, errorMsg) {
    return new Promise((resolve, reject) => {
        let process = exec(cmd, (error) => {
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

export const spawnExc = {
    svnUpdate,
    gitPull,
    runCmd
}