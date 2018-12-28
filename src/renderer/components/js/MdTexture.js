import * as global from './Global.js';
import * as tableExc from './TableExecute.js';
import * as jimpExc from './JimpExecute';
import * as spawnExc from "./SpawnExecute.js";
import * as fsExc from "./FsExecute.js";

const input_suffix_path = '/TextureInput/object';
const output_suffix_path = '/TextureOutput/object';
const sheet_suffix_path = '/TextureSheet';
const project_sheet_suffix_path = '/resource/assets/preload/sheet';

const object_csv = '/EntityBuildObject.csv';
const varia_csv = '/EntityVaria.csv';
const material_csv = '/EntityMaterial.csv';

const copy_in_suffix_arr = [
    '/settings/resource/object',
    '/settings/resource/object_varia'
];

var _checkBoxValues = [
    "itemIcon",
    "mapcell",
    "material",
    "object",
    "objectDecorate"
]
export function getCheckBoxValues() { return _checkBoxValues; }
export function setCheckBoxValues(value) { _checkBoxValues = value; }

var _checkBoxData = [
    "itemIcon",
    "mapcell",
    "material",
    "object",
    "objectDecorate"
]
export function getCheckBoxData() { return _checkBoxData; }
export function setCheckBoxData(value) { _checkBoxData = value; }

/**
 * 更新svn
 */
export async function updateSvn() {
    await spawnExc.svnUpdate(global.svnResPath, "更新svn成功", "更新svn错误");
}

/**
 * 清空纹理
 */
export async function clearTexture() {
    let inputPath = global.svnArtPath + input_suffix_path;
    let outputPath = global.svnArtPath + output_suffix_path;
    try {
        await fsExc.delFiles(inputPath);
        await fsExc.delFiles(outputPath);
        global.toast('清空纹理成功');
    } catch (error) {
        global.snack('清空纹理失败', error);
    }
}

/**
 * 拷入纹理
 */
export async function copyTextureIn() {
    let inputPath = global.svnArtPath + input_suffix_path;
    try {
        await fsExc.makeDir(inputPath);
        for (const iterator of copy_in_suffix_arr) {
            let copyInPath = global.svnPath + iterator;
            await fsExc.copyFile(copyInPath, inputPath, true);
        }

        global.toast('拷入纹理成功');
    } catch (error) {
        global.snack('拷入纹理错误', error);
    }
}

/**
 * 裁剪纹理
 */
export async function clipTexture() {
    let input_path = global.svnArtPath + input_suffix_path;
    let output_path = global.svnArtPath + output_suffix_path;

    try {
        let object_csv_path = global.svnCsvPath + object_csv;
        if (global.getObjectCells().length == 0) {
            global.setObjectCells(await tableExc.getCsvCells(object_csv_path));
        }

        let varia_csv_path = global.svnCsvPath + varia_csv;
        if (global.getVariaCells().length == 0) {
            global.setVariaCells(await tableExc.getCsvCells(varia_csv_path));
        }

        let material_csv_path = global.svnCsvPath + material_csv;
        if (global.getMaterialCells().length == 0) {
            global.setMaterialCells(await tableExc.getCsvCells(material_csv_path));
        }

        console.log('开始裁剪object纹理');
        for (const iterator of global.getObjectCells()) {
            await jimpExc.jimpPng(iterator, input_path, output_path);
        }
        console.log('裁剪object纹理完毕');

        console.log('开始裁剪varia纹理');
        for (const iterator of global.getVariaCells()) {
            await jimpExc.jimpPng(iterator, input_path, output_path);
        }
        console.log('裁剪varia纹理完毕');

        console.log('开始裁剪material纹理');
        for (const iterator of global.getMaterialCells()) {
            await jimpExc.jimpPng(iterator, input_path, output_path);
        }
        console.log('裁剪material纹理完毕');

        global.toast('裁剪纹理成功');
    } catch (error) {
        global.snack('裁剪纹理失败', error);
    }
}

/**
 * 打包纹理
 */
export async function packerTexture() {
    try {
        for (const iterator of _checkBoxData) {
            let inputs = [];
            let output;
            switch (iterator) {
                case 'itemIcon':
                    inputs.push(global.svnPath + '/settings/resource/item_icon');
                    break;
                case 'mapcell':
                    inputs.push(global.svnPath + '/settings/resource/mapcell');
                    break;
                case 'material':
                    inputs.push(global.svnPath + '/settings/resource/material');
                    break;
                case 'object':
                    inputs.push(global.svnArtPath + output_suffix_path);
                    break;
                case 'objectDecorate':
                    inputs.push(global.svnPath + '/settings/resource/objectDecorate');
                    break;
                default:
                    break;
            }
            output = global.svnArtPath + sheet_suffix_path + '/' + iterator;

            let cmdStr = getCmdPackerTexture(inputs, output);
            await spawnExc.runCmd(cmdStr, null, '处理纹理成功:' + inputs, '处理纹理错误:' + inputs);
        }

        global.toast('打包纹理成功');
    } catch (error) {
        global.snack('打包纹理错误', error);
    }
}

/**
 * 拷出纹理
 */
export async function copyTextureOut() {
    let sheet_path = global.svnArtPath + sheet_suffix_path;
    try {
        for (const iterator of _checkBoxData) {
            let outputPath =
                global.projPath +
                project_sheet_suffix_path;

            let targetPa = await fsExc.readDir(outputPath);
            for (const element of targetPa) {
                if (element.indexOf(iterator + "-") != -1
                    && (element.indexOf(".png") != -1
                        || element.indexOf(".json") != -1)
                ) {
                    await fsExc.delFile(outputPath + "/" + element);
                }
            }

            let fromPa = await fsExc.readDir(sheet_path);
            for (const element of fromPa) {
                if (
                    element.indexOf(iterator + "-") != -1
                    && (element.indexOf(".png") != -1
                        || element.indexOf(".json") != -1)
                ) {
                    let inputPath = sheet_path + "/" + element;
                    await fsExc.copyFile(inputPath, outputPath);
                }
            }
        }

        global.toast('拷出纹理成功');
    } catch (error) {
        global.snack('拷出纹理错误', error);
    }
}

export async function oneForAll() {
    await updateSvn();
    if (_checkBoxData.indexOf("object") != -1) {
        await clearTexture();
        await copyTextureIn();
        await clipTexture();
    }
    await packerTexture();
    await copyTextureOut();
}

function getCmdPackerTexture(inputPaths, outputPath) {
    let cmd =
        'texturePacker' +
        ' --multipack' +
        ' --sheet' +
        ' ' +
        outputPath +
        '-{n}.png' +
        ' --data' +
        ' ' +
        outputPath +
        '-{n}.json' +
        ' --texture-format png' +
        ' --format Egret' +
        ' --max-size 1024' +
        ' --algorithm MaxRects' +
        ' --maxrects-heuristics Best' +
        ' --size-constraints WordAligned' +
        ' --pack-mode Best' +
        ' --shape-padding 1' +
        ' --border-padding 1' +
        ' --trim-mode Trim' +
        ' --disable-rotation' +
        ' --trim-margin 1' +
        ' --opt RGBA8888' +
        ' --scale 1' +
        ' --scale-mode Smooth' +
        ' --alpha-handling KeepTransparentPixels';

    for (const iterator of inputPaths) {
        cmd += ' ' + iterator;
    }

    return cmd;
}