import { ipcRenderer } from "electron";

var projectPath = localStorage.getItem("client_project_path");
var svnPath = localStorage.getItem("client_svn_path");
var protoPath = localStorage.getItem("client_proto_path");
var csvPath = svnPath + "/settings/csv";
var svnResPath = svnPath + "/settings/resource";
var artPath = svnPath + "/art";

var objectCells = [];
var variaCells = [];
var materialCells = [];

function toast(value) {
    ipcRenderer.send("client_show_toast", value);
}

function snack(value, error) {
    if (error) {
        ipcRenderer.send("client_show_snack", `value ${error}`);
    } else {
        ipcRenderer.send("client_show_snack", value);
    }
}

function dialog(value) {
    ipcRenderer.send("client_show_dialog", value);
}

function showLoading() {
    ipcRenderer.send("client_show_loading");
}

function hideLoading() {
    ipcRenderer.send("client_hide_loading");
}

export const global = {
    projectPath,
    svnPath,
    csvPath,
    svnResPath,
    artPath,
    protoPath,

    objectCells,
    variaCells,
    materialCells,

    toast,
    snack,
    dialog,
    showLoading,
    hideLoading
};