import { Global } from './Global.js';
import { ModelMgr } from './model/ModelMgr'
import * as fsExc from './FsExecute';
import * as tableExc from './TableExecute';
import * as externalUtil from './ExternalUtil';
import * as iconv from "iconv-lite";
import * as xml2js from "xml2js";
/** 待处理的csv文件名称数组 */
var pendingCsvFileNames = [];

var csvTranslateContent = "";
var uiTranslateContent = "";
var lfCode = `<<LF\r\n`;

/** 处理csv文件 */
export async function executeCsv() {
    csvTranslateContent = "\r\n";
    pendingCsvFileNames = [];
    await loopFilterCsv();
    await loopCompareCsv();
}

/** 循环过滤csv文件 对比源文件 给当前语言环境新增或删除csv文件 */
async function loopFilterCsv() {
    let defaultCsvPath = Global.svnPath + ModelMgr.languageModel.defaultCsvPath;
    let defaultDir = await fsExc.readDir(defaultCsvPath);

    let zhCsvPath = Global.svnPath + ModelMgr.languageModel.zhCsvPath;
    let zhDir = await fsExc.readDir(zhCsvPath);

    let curCsvPath = Global.svnCsvPath;

    let addArr = externalUtil.getDiffInABArray(defaultDir, zhDir);
    let removeArr = externalUtil.getDiffInABArray(zhDir, defaultDir);

    if (removeArr.length > 0) {
        console.log(`--> remove csv file`, removeArr);
    }
    for (const iterator of removeArr) {
        await fsExc.delFile(`${zhCsvPath}/${iterator}`);
        await fsExc.delFile(`${curCsvPath}/${iterator}`);
    }

    //删除完多余文件后,生成待处理的csv文件名称数组
    pendingCsvFileNames = await fsExc.readDir(zhCsvPath);

    if (addArr.length > 0) {
        console.log(`--> add csv file`, addArr);
    }
    for (const iterator of addArr) {
        await fsExc.copyFile(`${defaultCsvPath}/${iterator}`, `${zhCsvPath}`);
        await fsExc.copyFile(`${defaultCsvPath}/${iterator}`, `${curCsvPath}`);
    }

}

/** 循环比较csv文件 */
async function loopCompareCsv() {
    let defaultCsvPath = Global.svnPath + ModelMgr.languageModel.defaultCsvPath;
    let zhCsvPath = Global.svnPath + ModelMgr.languageModel.zhCsvPath;
    let curCsvPath = Global.svnCsvPath;
    for (const iterator of pendingCsvFileNames) {
        await compareSingleCsv(iterator, `${defaultCsvPath}/${iterator}`, `${zhCsvPath}/${iterator}`, `${curCsvPath}/${iterator}`);
    }

    await writeCsvTranslateTxt();
}

async function writeCsvTranslateTxt() {
    let translatePath = `${Global.svnTranslatePath}/${ModelMgr.languageModel.curLanguage.csvTranslate}`;
    await fsExc.writeFile(translatePath, csvTranslateContent);
}

async function compareSingleCsv(csvName, defaultCsvPath, zhCsvPath, curCsvPath) {
    let defaultCsvContent = await tableExc.readCsvContent(defaultCsvPath);
    let rows = defaultCsvContent.split("\r\n");
    if (rows.length < 3) {
        let content = defaultCsvPath + "数据格式错误";
        alert(content);
        throw content;
    }
    let descs = rows[0].split(",");
    let attrs = rows[1].split(",");
    let types = rows[2].split(",");

    let defaultCells = await tableExc.getCsvCells(defaultCsvPath, true);
    let defaultCellMap = {};
    for (let d of defaultCells) {
        defaultCellMap[d.id] = d;
    }

    let zhCells = await tableExc.getCsvCells(zhCsvPath, true);
    let zhCellMap = {};
    for (let d of zhCells) {
        zhCellMap[d.id] = d;
    }

    let curCsvCells = await tableExc.getCsvCells(curCsvPath, true);
    let curCellMap = {};
    for (let d of curCsvCells) {
        curCellMap[d.id] = d;
    }

    let sameCellKeyMap = {};
    let addCellKeyMap = {};
    for (const key in defaultCellMap) {
        if (zhCellMap[key] != undefined) {
            sameCellKeyMap[key] = key;
        } else {
            addCellKeyMap[key] = key;
        }
    }

    let removeCellKeyMap = {};
    for (const key in zhCellMap) {
        if (sameCellKeyMap[key] === undefined) {
            removeCellKeyMap[key] = key;
        }
    }

    for (const key in addCellKeyMap) {
        console.log(`--> add cell key:${key}`, addCellKeyMap[key]);
        curCellMap[key] = zhCellMap[key] = defaultCellMap[key];
        for (let i = 0; i < attrs.length; i++) {
            let attr = attrs[i];
            if (!attr) {
                continue;
            }
            console.log(`新增属性 csv:${csvName} id:${key} attr:${attr} value:${defaultCellMap[key][attr]}`);
            addCsvAttrToTranslateTxt(csvName, key, attr, defaultCellMap[key][attr]);
        }
    }

    for (const key in removeCellKeyMap) {
        console.log(`--> remove cell key:${key}`, removeCellKeyMap[key]);
        delete zhCellMap[key];
        delete curCellMap[key];
    }

    for (const key in sameCellKeyMap) {
        let defaultCell = defaultCellMap[key];
        let zhCell = zhCellMap[key];
        let curCell = curCellMap[key];

        if ((zhCell !== undefined && curCell === undefined)
            || (zhCell === undefined && curCell !== undefined)) {
            console.log(`--> zh表数据和当前语言表数据不一致 csv:${csvName} id:${key}`);
            continue;
        }

        for (let i = 0; i < attrs.length; i++) {
            const attr = attrs[i];
            if (!attr) {
                continue;
            }
            //属性被删除了,同步
            if (defaultCell[attr] === undefined) {
                curCell[attr] = zhCell[attr] = undefined;
                continue;
            }

            //属性是新增的,同步,检测添加到翻译文件
            if (zhCell[attr] === undefined) {
                console.log(`新增属性 csv:${csvName} id:${key} attr:${attr} value:${defaultCell[attr]}`);
                curCell[attr] = zhCell[attr] = defaultCell[attr];
                addCsvAttrToTranslateTxt(csvName, key, attr, defaultCell[attr]);
                continue;
            }

            //属性比较,不一致的时候同步
            let defaultCellValue = JSON.stringify(defaultCell[attr]);
            let zhCellValue = JSON.stringify(zhCell[attr]);
            if (defaultCellValue !== zhCellValue) {
                console.log(`比较属性,属性不一致 csv:${csvName} id:${key} attr:${attr} defaultValue:${defaultCellValue} zhValue:${zhCellValue}`);
                curCell[attr] = zhCell[attr] = defaultCell[attr];
                addCsvAttrToTranslateTxt(csvName, key, attr, defaultCell[attr]);
                continue;
            }

            //比较一致,检查是否要加入翻译表
            addCsvAttrToTranslateTxt(csvName, key, attr, curCell[attr]);
        }
    }

    await generateCsv(zhCsvPath, descs, attrs, types, zhCellMap);
    await generateCsv(curCsvPath, descs, attrs, types, curCellMap);
}

function addCsvAttrToTranslateTxt(csvName, id, attr, attrValue) {
    let reg = new RegExp("[\\u4E00-\\u9FFF]+", "g");
    if (!reg.test(attrValue)) {
        return;
    }

    csvName = csvName.split(".")[0];
    csvTranslateContent += `${csvName}_${id}_${attr}:${attrValue}`;
    csvTranslateContent += lfCode;
}

async function generateCsv(csvPath, descs, attrs, types, cellMap) {
    let csvContent = "";
    csvContent += descs.join(",");
    csvContent += "\r\n";
    csvContent += attrs.join(",");
    csvContent += "\r\n";
    csvContent += types.join(",");

    for (const key in cellMap) {
        csvContent += "\r\n";
        let cell = cellMap[key];
        let isHead = true;
        for (const attr of attrs) {
            let value = "";
            if (cell[attr] === undefined) {
                value = "";
            } else {
                if (Array.isArray(cell[attr])) {
                    if (Array.isArray(cell[attr][0])) {
                        //二维数组
                        for (let i = 0; i < cell[attr].length; i++) {
                            if (i != 0) {
                                value += ";";
                            }
                            for (let j = 0; j < cell[attr][i].length; j++) {
                                const element = cell[attr][i][j];
                                if (j != 0) {
                                    value += `,${element}`;
                                } else {
                                    value += `${element}`;
                                }
                            }
                        }
                    } else {
                        //一维数组
                        for (let i = 0; i < cell[attr].length; i++) {
                            const element = cell[attr][i];
                            if (i != 0) {
                                value += `,${element}`;
                            } else {
                                value += `${element}`;
                            }
                        }
                    }
                    value = `\"${value}\"`;
                } else {
                    //单个值
                    value = `${cell[attr]}`;
                }
            }
            if (isHead) {
                csvContent += value;
                isHead = false;
            } else {
                csvContent += `,${value}`;
            }
        }
    }
    csvContent += "\r\n";

    let encoded = iconv.encode(csvContent, 'gbk');
    await fsExc.writeFile(csvPath, encoded);
}


export async function executeUIText() {
    uiTranslateContent = "\r\n";
    let defaultUITextPath = `${Global.svnPath}${ModelMgr.languageModel.defaultUITextPath}/UILanguage.xml`;
    let defaultUIText = await fsExc.readFile(defaultUITextPath);
    let defaultParser = new xml2js.Parser();
    defaultParser.parseString(defaultUIText, async (err, defaultResult) => {
        if (err) {
            console.error(`读取defaultUIText错误`, err);
            return;
        }
        let defaultStringMap = createStringMap(defaultResult.resources.string);

        let zhUITextPath = `${Global.svnPath}${ModelMgr.languageModel.zhUITextPath}/UILanguage.xml`;
        let zhUIText = await fsExc.readFile(zhUITextPath);
        let zhParser = new xml2js.Parser();
        zhParser.parseString(zhUIText, async (err, zhResult) => {
            if (err) {
                console.error(`读取zhUIText错误`, err);
                return;
            }
            let zhStringMap = createStringMap(zhResult.resources.string);

            let curUITextPath = `${Global.svnPath}${ModelMgr.languageModel.curLanguage.UITextPath}/UILanguage.xml`;
            let curUIText = await fsExc.readFile(curUITextPath);
            let curParser = new xml2js.Parser();
            curParser.parseString(curUIText, async (err, curResult) => {
                if (err) {
                    console.error(`读取当前UIText错误`, err);
                    return;
                }
                let curStringMap = createStringMap(curResult.resources.string);

                let sameStringKeyMap = {};
                let addStringKeyMap = {};
                for (const key in defaultStringMap) {
                    if (zhStringMap[key] != undefined) {
                        sameStringKeyMap[key] = key;
                    } else {
                        addStringKeyMap[key] = key;
                    }
                }

                let removeStringKeyMap = {};
                for (const key in zhStringMap) {
                    if (sameStringKeyMap[key] === undefined) {
                        removeStringKeyMap[key] = key;
                    }
                }

                for (const key in addStringKeyMap) {
                    console.log(`--> add string key:${key}`);
                    curStringMap[key] = zhStringMap[key] = defaultStringMap[key];

                    addUiAttrToTranslateTxt(defaultStringMap[key]);
                }

                for (const key in removeStringKeyMap) {
                    console.log(`--> remove string key:${key}`);
                    delete zhStringMap[key];
                    delete curStringMap[key];
                }

                for (const key in sameStringKeyMap) {
                    let defaultString = defaultStringMap[key];
                    let zhString = zhStringMap[key];
                    let curString = curStringMap[key];

                    if ((zhString !== undefined && curString === undefined)
                        || (zhString === undefined && curString !== undefined)) {
                        console.log(`--> zh美术文字数据和当前美术文字数据不一致 key:${key}`);
                        continue;
                    }

                    //翻译比较,不一致的时候同步
                    if (defaultString._ !== zhString._) {
                        curStringMap[key] = zhStringMap[key] = defaultStringMap[key];
                        addUiAttrToTranslateTxt(defaultStringMap[key]);
                        console.log(`比较美术文字不一致 key:${key} default:${defaultString._} zh:${zhString._}`);
                        continue;
                    }

                    //比较一致,检查是否要加入翻译表
                    addUiAttrToTranslateTxt(curStringMap[key]);
                }

                await generateUiXml(zhUITextPath, zhStringMap);
                await generateUiXml(curUITextPath, curStringMap);
                await writeUiTranslateTxt();
            });
        });
    });
}

async function writeUiTranslateTxt() {
    let translatePath = `${Global.svnTranslatePath}/${ModelMgr.languageModel.curLanguage.uiTranslate}`;
    await fsExc.writeFile(translatePath, uiTranslateContent);
}

function addUiAttrToTranslateTxt(attrString) {
    let attrKey = attrString.$.name;
    let attrValue = attrString._;

    let reg = new RegExp("[\\u4E00-\\u9FFF]+", "g");
    if (!reg.test(attrValue)) {
        return;
    }

    uiTranslateContent += `${attrKey}:${attrValue}`;
    uiTranslateContent += lfCode;
}

function createStringMap(stringArr) {
    let stringMap = {};
    for (const iterator of stringArr) {
        stringMap[iterator.$.name] = iterator;
    }

    return stringMap;
}

export async function applyTranslate() {
    await loopApplyCsvTranslate();
    await applyUiTranslate();
}

/** 循环应用csv文件 */
async function loopApplyCsvTranslate() {
    let curDir = await fsExc.readDir(Global.svnCsvPath);
    let csvMap = {};
    for (const iterator of curDir) {
        let cells = await tableExc.getCsvCells(`${Global.svnCsvPath}/${iterator}`, true);
        let cellMap = {};
        for (let d of cells) {
            cellMap[d.id] = d;
        }

        let csvName = iterator.split(".")[0];
        csvMap[csvName] = cellMap;
    }

    let translatePath = `${Global.svnTranslatePath}/${ModelMgr.languageModel.curLanguage.csvTranslate}`;
    let translateContent = await fsExc.readFile(translatePath);
    let translateArr = translateContent.split(lfCode);
    for (const iterator of translateArr) {
        let index = iterator.indexOf(":");
        let key = iterator.slice(0, index);
        let value = iterator.slice(index + 1, iterator.length);
        if (!key && !value) {
            continue;
        }

        if (!key || !value) {
            console.error(`翻译错误: key:${key} value:${value}`);
            continue;
        }

        let keyInfo = key.split("_");
        let csvName = keyInfo[0];
        let id = keyInfo[1];
        let attr = keyInfo[1];

        if (csvMap[csvName] === undefined) {
            console.error(`翻译字段的配置表不存在: csv:${csvName}`);
            continue;
        }

        if (csvMap[csvName][id] === undefined) {
            console.error(`翻译字段的id不存在: csv:${csvName} id:${id}`);
            continue;
        }

        console.log(`翻译字段信息 csvName:${csvName} id:${id} attr:${attr} value:${value}`);
        csvMap[csvName][id][attr] = value;
    }

    for (const key in csvMap) {
        const cellMap = csvMap[key];
        let csvPath = `${Global.svnCsvPath}/${key}.csv`;
        let csvContent = await tableExc.readCsvContent(csvPath);
        let rows = csvContent.split("\r\n");
        if (rows.length < 3) {
            let content = csvPath + "数据格式错误";
            alert(content);
            throw content;
        }
        let descs = rows[0].split(",");
        let attrs = rows[1].split(",");
        let types = rows[2].split(",");

        await generateCsv(csvPath, descs, attrs, types, cellMap);
    }

    console.log(`应用csv翻译完毕`);
}

async function applyUiTranslate() {
    let curUITextPath = `${Global.svnPath}${ModelMgr.languageModel.curLanguage.UITextPath}/UILanguage.xml`;
    let curUIText = await fsExc.readFile(curUITextPath);
    let curParser = new xml2js.Parser();
    curParser.parseString(curUIText, async (err, curResult) => {
        if (err) {
            console.error(`读取当前UIText错误`, err);
            return;
        }
        let uiStringMap = createStringMap(curResult.resources.string);

        let translatePath = `${Global.svnTranslatePath}/${ModelMgr.languageModel.curLanguage.uiTranslate}`;
        let translateContent = await fsExc.readFile(translatePath);
        let translateArr = translateContent.split(lfCode);
        for (const iterator of translateArr) {
            let index = iterator.indexOf(":");
            if (index === -1) {
                continue;
            }

            let key = iterator.slice(0, index);
            let value = iterator.slice(index + 1, iterator.length);
            if (!key && !value) {
                continue;
            }

            if (!key || !value) {
                console.error(`翻译错误: key:${key} value:${value}`);
                continue;
            }

            if (uiStringMap[key] === undefined) {
                console.error(`翻译字段的配置不存在:key:${key}`);
                continue;
            }

            uiStringMap[key]._ = value;
        }

        await generateUiXml(curUITextPath, uiStringMap);

        console.log(`应用ui翻译完毕`);
    });
}

async function generateUiXml(uiXmlPath, stringMap) {
    let stringObj = {
        resources: {
            string: []
        }
    }
    for (const key in stringMap) {
        if (stringMap.hasOwnProperty(key)) {
            const element = stringMap[key];
            stringObj.resources.string.push(element);
        }
    }

    let builder = new xml2js.Builder({ xmldec: { encoding: "utf-8" } });
    let content = builder.buildObject(stringObj);
    await fsExc.writeFile(uiXmlPath, content);
}