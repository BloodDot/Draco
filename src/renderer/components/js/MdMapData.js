import * as spawnExc from "./SpawnExecute.js";
import * as fsExc from "./FsExecute.js";
import * as global from "./Global.js";

const m0Bat = 'MapDataBatchProcess.bat';
const m1Bat = 'XinshouMapBatchProcess.bat';

const projMapM0Path = global.projPath + '/resource/mapData/m0';
const projMapM1Path = global.projPath + '/resource/mapData/m1';
const svnMapPath = global.svnPath + '/client/mapdata';
const svnMapM0OutPath = svnMapPath + '/out';
const svnMapM1OutPath = svnMapPath + '/xinshoumapOut';

var _checkBoxData = ["m0", "m1"];
export function getCheckBoxData() { return _checkBoxData; }
export function setCheckBoxData(value) { _checkBoxData = value; }

var _checkBoxValues = ["m0", "m1"];
export function getCheckBoxValues() { return _checkBoxValues; }
export function setCheckBoxValues(value) { _checkBoxValues = value; }

export async function updateSvn() {
    await spawnExc.svnUpdate(svnMapPath, '更新mapData成功', '更新mapData错误');
}

export async function executeBatFile() {
    try {
        for (const iterator of _checkBoxData) {
            switch (iterator) {
                case 'm0':
                    await spawnExc.runSpawn(m0Bat, [], svnMapPath, null, '执行m0bat错误');
                    break;
                case 'm1':
                    await spawnExc.runSpawn(m1Bat, [], svnMapPath, null, '执行m1bat错误');
                    break;
            }
        }
        global.toast('执行bat成功');
    } catch (error) {
        global.snack('执行bat错误', error);
    }
}

export async function clearMapFile() {
    try {
        for (const iterator of _checkBoxData) {
            switch (iterator) {
                case 'm0':
                    await fsExc.delFiles(projMapM0Path);
                    break;
                case 'm1':
                    await fsExc.delFiles(projMapM1Path);
                    break;
            }
        }

        global.toast('清空文件成功');
    } catch (error) {
        global.snack('清空文件失败', error);
    }
}

export async function copyMapFile() {
    try {
        for (const iterator of _checkBoxData) {
            switch (iterator) {
                case 'm0':
                    await fsExc.makeDir(projMapM0Path);
                    await fsExc.copyFile(svnMapM0OutPath, projMapM0Path);
                    break;
                case 'm1':
                    await fsExc.makeDir(projMapM1Path);
                    await fsExc.copyFile(svnMapM1OutPath, projMapM1Path);
                    break;
            }
        }

        global.toast('拷入文件成功');
    } catch (error) {
        global.snack('拷入文件错误', error);
    }
}

export async function oneForAll() {
    await updateSvn();
    await executeBatFile();
    await clearMapFile();
    await copyMapFile();
}