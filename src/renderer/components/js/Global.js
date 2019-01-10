import { ipcRenderer } from 'electron';

// global.svnCsvPath = global.svnPath + '/settings/csv';
// global.svnResPath = global.svnPath + '/settings/resource';
// global.svnArtPath = global.svnPath + '/art';
// global.svnPublishPath = global.svnPath + '/client/publish';

export var projPath = localStorage.getItem('client_project_path');
export var protoPath = localStorage.getItem('client_proto_path');
export var svnPath = localStorage.getItem('client_svn_path');
export var androidPath = localStorage.getItem('client_android_path');
export var iosPath = localStorage.getItem('client_ios_path');
export var weChatPath = localStorage.getItem('client_wechat_path');
export var svnCsvPath = svnPath + '/settings/csv';
export var svnResPath = svnPath + '/settings/resource';
export var svnArtPath = svnPath + '/art';
export var svnPublishPath = svnPath + '/client/publish';
export var pbMessagePath = protoPath + '/pbmessage';

var _objectCells = [];
export function getObjectCells() { return _objectCells; }
export function setObjectCells(value) { _objectCells = value; }

var _variaCells = [];
export function getVariaCells() { return _variaCells; }
export function setVariaCells(value) { _variaCells = value; }

var _materialCells = [];
export function getMaterialCells() { return _materialCells; }
export function setMaterialCells(value) { _materialCells = value; }

ipcRenderer.on('selected_client_project_path', (event, path) => {
    if (path) {
        projPath = path[0];
    }
});

ipcRenderer.on('selected_client_proto_path', (event, path) => {
    if (path) {
        protoPath = path[0];
    }
});

ipcRenderer.on('selected_client_svn_path', (event, path) => {
    if (path) {
        svnPath = path[0];
    }
});

ipcRenderer.on('selected_client_android_path', (event, path) => {
    if (path) {
        androidPath = path[0];
    }
});

ipcRenderer.on('selected_client_ios_path', (event, path) => {
    if (path) {
        iosPath = path[0];
    }
});

ipcRenderer.on('selected_client_wechat_path', (event, path) => {
    if (path) {
        weChatPath = path[0];
    }
});

export function toast(value) {
    ipcRenderer.send('client_show_toast', value);
}

export function snack(value, error) {
    if (error) {
        ipcRenderer.send('client_show_snack', `${value} ${error}`);
        console.error(value, error);
    } else {
        ipcRenderer.send('client_show_snack', value);
        console.error(value);
    }
}

export function dialog(value) {
    ipcRenderer.send('client_show_dialog', value);
}

export function showLoading() {
    ipcRenderer.send('client_show_loading');
}

export function hideLoading() {
    ipcRenderer.send('client_hide_loading');
}