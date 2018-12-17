import { global } from './Global.js';
import { tableExc } from './TableExecute.js';
import { textureExc } from './TextureExecute.js';
import { spawnExc } from "./SpawnExecute.js";
import { fsExc } from "./FsExecute.js";

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

var checkBoxValues = [
    "itemIcon",
    "mapcell",
    "material",
    "object",
    "objectDecorate"
]

var checkBoxData = [
    "itemIcon",
    "mapcell",
    "material",
    "object",
    "objectDecorate"
]

/**
 * 更新svn
 */
async function updateSvn() {
    await spawnExc.svnUpdate(global.svnResPath, "更新svn成功", "更新svn错误");
}

/**
 * 清空纹理
 */
async function clearTexture() {
    let inputPath = global.artPath + input_suffix_path;
    let outputPath = global.artPath + output_suffix_path;
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
async function copyTextureIn() {
    let inputPath = global.artPath + input_suffix_path;
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
async function clipTexture() {
    let input_path = global.artPath + input_suffix_path;
    let output_path = global.artPath + output_suffix_path;
    let object_csv_path = global.csvPath + object_csv;

    try {
        if (global.objectCells.length == 0) {
            global.objectCells = await tableExc.getCsvCells(object_csv_path);
        }

        let varia_csv_path = global.csvPath + varia_csv;
        if (global.variaCells.length == 0) {
            global.variaCells = await tableExc.getCsvCells(varia_csv_path);
        }

        let material_csv_path = global.csvPath + material_csv;
        if (global.materialCells.length == 0) {
            global.materialCells = await tableExc.getCsvCells(material_csv_path);
        }

        console.log('开始裁剪object纹理');
        for (const iterator of global.objectCells) {
            await textureExc.jimpPng(iterator, input_path, output_path);
        }
        console.log('裁剪object纹理完毕');

        console.log('开始裁剪varia纹理');
        for (const iterator of global.variaCells) {
            await textureExc.jimpPng(iterator, input_path, output_path);
        }
        console.log('裁剪varia纹理完毕');

        console.log('开始裁剪material纹理');
        for (const iterator of global.materialCells) {
            await textureExc.jimpPng(iterator, input_path, output_path);
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
async function packerTexture() {
    try {
        for (const iterator of checkBoxData) {
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
                    inputs.push(global.artPath + output_suffix_path);
                    break;
                case 'objectDecorate':
                    inputs.push(global.svnPath + '/settings/resource/objectDecorate');
                    break;
                default:
                    break;
            }
            output = global.svnPath + sheet_suffix_path + '/' + iterator;

            let cmdStr = getCmdPackerTexture(inputs, output);
            await spawnExc.runCmd(cmdStr, '处理纹理成功:' + inputs, '处理纹理错误:' + inputs);
        }

        global.toast('打包纹理成功');
    } catch (error) {
        global.snack('打包纹理错误', error);
    }
}

/**
 * 拷出纹理
 */
async function copyTextureOut() {
    let sheet_path = global.artPath + sheet_suffix_path;
    try {
        for (const iterator of checkBoxData) {
            let outputPath =
                global.projectPath +
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

async function oneForAll() {
    try {
        await updateSvn();
        if (checkBoxData.indexOf("object") != -1) {
            await clearTexture();
            await copyTextureIn();
            await clipTexture();
        }
        await packerTexture();
        await copyTextureOut();

        global.toast('One·for·All Success');
    } catch (e) {
        global.snack('One·for·All Error', e);
    }
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

export const mdTexture = {
    checkBoxData,
    checkBoxValues,

    updateSvn,
    clearTexture,
    copyTextureIn,
    clipTexture,
    packerTexture,
    copyTextureOut,
    oneForAll
}