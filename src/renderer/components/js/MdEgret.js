import { Global } from "./Global.js";
import * as spawnExc from "./SpawnExecute.js";

var excProcess;

export async function egretRun() {
    let cmdStr = "egret run";
    excProcess = await spawnExc.runCmd(cmdStr, Global.projPath, null, '运行游戏错误');
}

export async function stopRun() {
    if (excProcess) {
        excProcess.kill();
        excProcess = null;
    }
}