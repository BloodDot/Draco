import { spawn } from "child_process";
import { ipcRenderer } from "electron";
import * as fs from "fs";
import * as archiver from "archiver";

function zipCsv(csvPath, projectPath, successMsg, errorMsg) {
    return new Promise((resolve, reject) => {
        let pa = fs.readdirSync(csvPath);
        let archive = archiver("zip");
        let fileName = "csv.zip";
        let filePath = projectPath + "/resource/assets/csv/";
        let output = fs.createWriteStream(filePath + fileName);
        archive.pipe(output);

        for (let i = 0; i < pa.length; i++) {
            const element = pa[i];
            if (element.indexOf(".csv") != -1) {
                archive.append(fs.createReadStream(csvPath + "/" + element), {
                    name: element
                });
            }
        }

        archive.on("error", error => {
            ipcRenderer.send("client_show_snack", errorMsg + error);
            reject();
        });
        output.on("close", () => {
            ipcRenderer.send("client_show_toast", successMsg);
            resolve();
        });
        archive.finalize();
    });
}

export const archiveExc = {
    zipCsv
}