import { spawnExc } from "./SpawnExecute.js";
import { fsExc } from "./FsExecute.js";
import { global } from "./Global.js";

async function updateGit() {
    await spawnExc.gitPull(global.protoPath, '更新git成功', '更新git错误');
}

async function composeProto() {
    let pa = await fsExc.readDir(global.protoPath);
    let content = "";
    content += "syntax = 'proto3';\r\n";
    content += "package Bian;\r\n";
    for (let i = 0; i < pa.length; i++) {
        const element = pa[i];
        if (element.indexOf(".proto") != -1) {
            let eleContent = await fsExc.readFile(global.protoPath + "/" + element);

            eleContent = eleContent
                .split("\n")
                .filter(i => {
                    return i.indexOf("import") !== 0;
                })
                .join("\n");

            eleContent = eleContent.replace("syntax = 'proto3';", "");
            eleContent = eleContent.replace('syntax = "proto3";', "");
            eleContent = eleContent.replace("package Bian;", "");

            eleContent = eleContent.replace("option go_package Bian;", "");
            content += "// ----- from " + element + " ---- \n";
            content += eleContent + "\n";
        }
    }

    try {
        let projectProtoPath =
            global.projectPath + "/resource/assets/proto/pbmessage.proto";
        await fsExc.writeFile(projectProtoPath, content);
        global.toast('合成proto成功');
    } catch (error) {
        global.snack('合成proto错误', error);
    }
}

async function createJs() {
    let cmdStr = "pbjs -t static-module -w commonjs -o "
        + global.protoPath
        + "/pbmessage.js "
        + global.projectPath
        + "/resource/assets/proto/pbmessage.proto";
    await spawnExc.runCmd(cmdStr, '生成js成功', '生成js错误');
}

async function createTs() {
    let cmdStr = "pbts -o "
        + global.projectPath
        + "/src/protocol/pbmessage.d.ts "
        + global.protoPath
        + "/pbmessage.js";
    await spawnExc.runCmd(cmdStr, '生成ts成功', '生成ts错误');
}

export const mdProto = {
    updateGit,
    composeProto,
    createJs,
    createTs
} 