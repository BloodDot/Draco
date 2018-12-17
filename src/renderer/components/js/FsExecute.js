import * as path from "path";
import * as del from 'delete';
import * as fs from 'fs';
import * as cpy from 'cpy';

/**
 * 拷贝指定路径的文件
 * @param {*} fromPath 来源路径 可以是文件路径,也可以是文件夹路径
 * @param {*} toPath 目标路径
 * @param needLoop 是否循环文件夹拷贝
 */
async function copyFile(fromPath, toPath, needLoop) {
    if (!needLoop) {
        await cpy(fromPath, toPath);
        return;
    }

    let files = await fs.readdirSync(fromPath);

    for (const file of files) {
        let pathName = path.join(fromPath, file);
        if (await isDirectory(pathName)) {
            await copyFile(pathName, toPath + "/" + file, needLoop);
        } else {
            await copyFile(pathName, toPath);
        }
    }
}

/**
 * 删除指定文件夹下所有文件
 * @param {*} path 
 */
async function delFile(path) {
    await fs.unlinkSync(path);
    // await del.sync(path, { force: true });
}


/**
 * 删除指定文件夹下所有文件
 * @param {*} path 
 */
async function delFiles(path) {
    await del.sync([path + '/*'], { force: true });
}

/**
 * 删除指定文件夹
 * @param {*} path 
 */
async function delFolder(path) {
    await del.sync([path], { force: true });
}

/**
 * 路径是否是目录
 * @param {*} path 
 */
async function isDirectory(path) {
    return await fs.statSync(path).isDirectory();
}

/**
 * 创建文件夹 只有不存在的时候才会创建
 * @param {*} path 
 */
async function makeDir(path) {
    let exists = await fs.existsSync(path);
    if (!exists) {
        await fs.mkdirSync(path);
    }
}

/**
 * 读取路径
 * @param {*} path 
 */
async function readDir(path) {
    return await fs.readdirSync(path);
}

/**
 * 读取文件
 * @param {*} path 
 */
async function readFile(path) {
    return fs.readFileSync(path, "utf-8");
}

/**
 * 写文件
 * @param {*} path 
 * @param {*} content 
 */
async function writeFile(path, content) {
    await fs.writeFileSync(path, content);
}


export const fsExc = {
    copyFile,
    isDirectory,
    delFile,
    delFiles,
    delFolder,
    makeDir,
    readDir,
    readFile,
    writeFile
}
