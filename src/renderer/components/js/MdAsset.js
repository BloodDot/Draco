
import * as global from './Global.js';
import * as fsExc from './FsExecute';
import * as path from 'path';

const assetSuffix = '/resource/assets';
const defaultResSuffix = '/resource/default.res.json';

const asyncSuffix = '/resource/async';
const asyncResSuffix = '/resource/async.res.json';


const indieSuffix = '/resource/indie';
const indieResSuffix = '/resource/async.res.json';

const mapDataSuffix = '/resource/mapData';
const mapDataResSuffix = '/resource/mapData.res.json'

export async function importDefault() {
  try {
    let default_folder_path = global.projPath + assetSuffix;
    let defaultConfig = {
      groups: [
        { name: 'preload', keyArr: [], keys: '' },
        { name: 'fairyGui', keyArr: [], keys: '' },
        { name: 'loading', keyArr: [], keys: '' }
      ],
      resources: []
    };
    await importFolderFile(default_folder_path, defaultConfig);

    for (const iterator of defaultConfig.groups) {
      let keys = '';
      for (let i = 0; i < iterator.keyArr.length; i++) {
        const element = iterator.keyArr[i];
        if (i == iterator.keyArr.length - 1) {
          keys += element;
        } else {
          keys += element + ',';
        }
        iterator.keys = keys;
      }
      delete iterator.keyArr;
    }

    let content = JSON.stringify(defaultConfig);
    let configPath = global.projPath + defaultResSuffix;
    await fsExc.writeFile(configPath, content);

    global.toast('导入default成功');
  } catch (error) {
    global.snack('导入default错误', error);
  }
}

export async function importAsync() {
  try {
    let async_folder_path = global.projPath + asyncSuffix;
    let asyncConfig = {
      groups: [],
      resources: []
    };
    await importFolderFile(async_folder_path, asyncConfig);
    let content = JSON.stringify(asyncConfig);
    let configPath = global.projPath + asyncResSuffix;
    await fsExc.writeFile(configPath, content);

    global.toast('导入async成功');
  } catch (error) {
    global.snack('导入async错误', error);
  }
}

export async function importIndie() {
  try {
    let indie_folder_path = global.projPath + indieSuffix;
    let indieConfig = {
      groups: [],
      resources: []
    };
    await importFolderFile(indie_folder_path, indieConfig, '', false, true);

    for (const iterator of indieConfig.groups) {
      let keys = '';
      for (let i = 0; i < iterator.keyArr.length; i++) {
        const element = iterator.keyArr[i];
        if (i == iterator.keyArr.length - 1) {
          keys += element;
        } else {
          keys += element + ',';
        }
        iterator.keys = keys;
      }
      delete iterator.keyArr;
    }

    let content = JSON.stringify(indieConfig);
    let configPath = global.projPath + indieResSuffix;
    await fsExc.writeFile(configPath, content);

    global.toast('导入indie成功');
  } catch (error) {
    global.snack('导入indie错误', error);
  }
}

export async function importMapData() {
  try {
    let map_data_folder_path = global.projPath + mapDataSuffix;
    let mapDataConfig = {
      groups: [],
      resources: []
    };
    await importFolderFile(map_data_folder_path, mapDataConfig);
    let content = JSON.stringify(mapDataConfig);
    let configPath = global.projPath + mapDataResSuffix;
    await fsExc.writeFile(configPath, content);

    global.toast('导入mapData成功');
  } catch (error) {
    global.snack('导入mapData错误', error);
  }
}

export async function oneForAll() {
  await importDefault();
  await importAsync();
  await importIndie();
  await importMapData();
}

async function importFolderFile(folderPath, config, group = '', isSheet = false, isRootGroupFolder = false, useOriginGroup = false) {
  let files = await fsExc.readDir(folderPath);
  for (const file of files) {
    let curPath = folderPath + '/' + file;
    if (await fsExc.isDirectory(curPath)) {
      if (!useOriginGroup) {
        if (file == 'preload' || file == 'loading' || file == 'fairyGui') {
          group = file;
        } else if (
          group == 'preload' ||
          group == 'loading' ||
          group == 'fairyGui'
        ) {
        } else {
          group = '';
        }

        if (isRootGroupFolder) {
          group = file;
        }
      }

      console.log(
        '---isRootGroupFolder:' + isRootGroupFolder + '---group:' + group
      );

      if (file == 'sheet') {
        isSheet = true;
      } else {
        isSheet = false;
      }
      await importFolderFile(curPath, config, group, isSheet, false, isRootGroupFolder);
    } else {
      await importSingleFile(curPath, config, group, isSheet);
    }
  }
}

async function importSingleFile(filePath, config, group, isSheet) {
  let relative = path.relative(global.projPath + '/resource', filePath);
  let url = relative.replace(/\\/g, '/');
  let parsedPath = path.parse(filePath);
  let extname = parsedPath.ext;
  let type = getType(extname, isSheet);
  let name = parsedPath.name + extname.replace('.', '_');
  if (!isSheet || extname == '.json') {
    if (isSheet) {
      let subkeys = '';
      let content = await fsExc.readFile(filePath);

      let contentObj = JSON.parse(content);

      if (contentObj.frames) {
        let isFirst = true;
        for (const key in contentObj.frames) {
          if (isFirst) {
            subkeys += key;
            isFirst = false;
          } else {
            subkeys += ',' + key;
          }
        }
      }
      config.resources.push({
        name: name,
        type: type,
        url: url,
        subkeys: subkeys
      });
    } else {
      config.resources.push({ name: name, type: type, url: url });
    }

    switch (group) {
      case '':
        break;
      default:
        let groupExist = false;
        for (const iterator of config.groups) {
          if (iterator.name == group) {
            groupExist = true;
            iterator.keyArr.push(name);
          }
        }

        if (!groupExist) {
          let keyArr = { name: group, keyArr: [name], keys: '' };
          config.groups.push(keyArr);
        }
        break;
    }
  }
}

function getType(extname, isSheet) {
  if (isSheet) {
    return 'sheet';
  }
  switch (extname) {
    case '.json':
      return 'json';
    case '.fnt':
      return 'font';
    case '.txt':
    case '.proto':
      return 'text';
    case '.mp3':
    case '.wav':
    case '.m4a':
      return 'sound';
    case '.png':
    case '.jpg':
    case '.jpeg':
    case '.bmp':
    case '.gif':
      return 'image';
    default:
      return 'bin';
      break;
  }
}