<template>
  <div>
    <mu-container >
      <div class="button-wrapper">
        <mu-button v-loading="isPublishProjectLoading" data-mu-loading-size="24" color="pink500" @click="onPublishProjectClick">发布项目</mu-button>
        <mu-button v-loading="isMergeVersionLoading" data-mu-loading-size="24" color="orange500" @click="onMergetVersionClick">比较版本</mu-button>
        <!-- <mu-button v-loading="isPublishProjectLoading" data-mu-loading-size="24" color="cyan500" @click="publishProject">发布项目</mu-button> -->
      </div>
      <div class="button-wrapper">
        <mu-button full-width color="red" @click="oneForAll">One·for·All</mu-button>
      </div>
    </mu-container>
    <mu-container>
      <div>
        <mu-text-field class="text-version" v-model="cur_version" label="发布版本号" label-float/>
      </div>
      <div class="control-group">
        <mu-row gutter>
          <mu-col span="12" lg="2" sm="6">
            <mu-text-field class="text-version" v-model="new_version" label="新版本号" :disabled="true" />
          </mu-col>
          <mu-col span="12" lg="8" sm="6">
            <mu-text-field class="text-path" v-model="new_version_path" label="选择新版本目录" @change="onNewVersionPathChange" label-float />
          </mu-col>
          <mu-col span="2" lg="2" sm="6">
            <mu-button color="pink500" @click="onNewVersionClick">选择</mu-button>
          </mu-col>
        </mu-row>
      </div>
      <div class="control-group">
        <mu-row gutter>
          <mu-col span="12" lg="2" sm="6">
            <mu-text-field class="text-version" v-model="old_version" label="旧版本号" :disabled="true" />
          </mu-col>
          <mu-col span="12" lg="8" sm="6">
            <mu-text-field class="text-path" v-model="old_version_path" label="选择旧版本目录" @change="onOldVersionPathChange" label-float />
          </mu-col>
          <mu-col span="2" lg="2" sm="6">
            <mu-button color="orange500" @click="onOldVersionClick">选择</mu-button>
          </mu-col>
        </mu-row>
      </div>
    </mu-container>
  </div>
</template>

<script>
const exec = require("child_process").exec;
const spawn = require("child_process").spawn;
const ipcRenderer = require("electron").ipcRenderer;
const remote = require("electron").remote;
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const thmFilePath = "resource/default.thm.json";
const defaultResPath = "resource/default.res.json";
const mapDataResPath = "resource/mapData.res.json";

export default {
  data() {
    return {
      project_path: "",
      publish_path: "",
      isPublishProjectLoading: false,
      isMergeVersionLoading: false,
      publish_version: "",
      new_version: "",
      new_version_path: "",
      old_version: "",
      old_version_path: "",
      cur_version: ""
    };
  },
  watch: {},
  methods: {
    onNewVersionPathChange() {
      this.refreshNewVersion();
    },
    onOldVersionPathChange() {
      this.refreshOldVersion();
    },
    onNewVersionClick() {
      ipcRenderer.send("open_new_version_path");
    },
    onOldVersionClick() {
      ipcRenderer.send("open_old_version_path");
    },
    onPublishProjectClick() {
      if (!this.cur_version) {
        ipcRenderer.send("client_show_snack", "请先输入发布版本号");
        return;
      }

      return new Promise((resolve, reject) => {
        this.isPublishProjectLoading = true;

        let cmdStr = "egret publish --version " + this.cur_version;
        console.log(cmdStr);
        exec(cmdStr, { cwd: this.project_path }, (error, stdout, stderr) => {
          if (error) {
            this.isPublishProjectLoading = false;
            ipcRenderer.send("client_show_snack", "发布项目错误:" + error);
            console.error("发布项目错误:" + error);
            reject();
          } else {
            this.isPublishProjectLoading = false;

            let content = JSON.stringify({
              version: this.cur_version,
              tag: false
            });
            let ppath =
              this.project_path +
              "/bin-release/web/" +
              this.cur_version +
              "/version.json";
            console.log(ppath);
            try {
              fs.writeFileSync(ppath, content);
              ipcRenderer.send("client_show_message", "发布项目成功");
              resolve();

              this.new_version_path =
                this.project_path + "/bin-release/web/" + this.cur_version;
              this.new_version = this.cur_version;
            } catch (error) {
              ipcRenderer.send(
                "client_show_snack",
                "写入版本文件错误:" + error
              );
              console.error("写入版本文件错误:" + error);
              reject();
            }
          }

          if (stdout) {
            console.log("stdout: " + stdout);
          }
          if (stderr) {
            console.log("stderr: " + stderr);
          }
        });
      });
    },
    async onMergetVersionClick() {
      if (!this.new_version) {
        ipcRenderer.send("client_show_snack", "新版本目录错误");
        return;
      }
      if (this.old_version && this.old_version >= this.new_version) {
        ipcRenderer.send("client_show_snack", "新版本号应该比旧版本号大");
        return;
      }

      if (!this.publish_path) {
        ipcRenderer.send("client_show_snack", "请在设置选项中设置发布目录");
        return;
      }
      this.isMergeVersionLoading = true;

      try {
        if (this.old_version) {
          await this.mergeVersion(this.new_version, this.old_version, true);
        } else {
          await this.mergeVersion(this.new_version, null, true);
        }
        this.isMergeVersionLoading = false;
      } catch (error) {
        this.isMergeVersionLoading = false;
        ipcRenderer.send("client_show_snack", "比较版本错误:" + error);
        console.error("比较版本错误:" + error);
      }
    },
    async mergeVersion(newVersion, oldVersion, isRelease) {
      let releasePath;
      if (isRelease) {
        releasePath = this.publish_path + "/release_v" + newVersion;
      }

      let patchPath;
      if (oldVersion) {
        patchPath =
          this.publish_path + "/patch_v" + oldVersion + "-" + newVersion;
      } else {
        patchPath = this.publish_path + "/patch_v" + newVersion;
      }

      newVersion = newVersion.replace(new RegExp("[.]", "g"), "-");
      if (oldVersion) {
        oldVersion = oldVersion.replace(new RegExp("[.]", "g"), "-");
      }
      try {
        if (releasePath) {
          await this.checkCreateFolder(releasePath);
        }
        await this.checkCreateFolder(patchPath);

        //不用比较,直接拷贝的
        if (releasePath) {
          await this.copyFileInVersion("index.html", releasePath);
        }
        await this.copyFileInVersion("index.html", patchPath);

        if (releasePath) {
          await this.copyFileInVersion("manifest.json", releasePath);
        }
        await this.copyFileInVersion("manifest.json", patchPath);

        if (releasePath) {
          await this.copyFileInVersion("version.json", releasePath);
        }
        await this.copyFileInVersion("version.json", patchPath);

        if (releasePath) {
          this.folderCopyFileInVersion("js", releasePath);
        }
        this.folderCopyFileInVersion("js", patchPath);

        if (releasePath) {
          await this.checkCreateFolder(releasePath + "/resource");
        }
        await this.checkCreateFolder(patchPath + "/resource");

        if (releasePath) {
          this.folderCopyFileInVersion("resource/skins", releasePath);
        }
        this.folderCopyFileInVersion("resource/skins", patchPath);

        //不存在旧版本,所有的都用最新的版本
        if (!oldVersion) {
          //default.thm.json
          if (releasePath) {
            await this.copyFileInVersion(thmFilePath, releasePath, newVersion);
          }
          await this.copyFileInVersion(thmFilePath, patchPath, newVersion);

          //default.res.json
          await this.resFileHandle(
            defaultResPath,
            newVersion,
            releasePath,
            patchPath
          );

          //mapData.res.json
          await this.resFileHandle(
            mapDataResPath,
            newVersion,
            releasePath,
            patchPath
          );
        } else {
          //default.thm.json
          let oldThmPath = "resource/default.thm" + "_v" + oldVersion + ".json";
          await this.mergeFileInVersion(
            oldThmPath,
            thmFilePath,
            releasePath,
            patchPath,
            oldVersion,
            newVersion
          );

          //default.res.json
          await this.resFileHandle(
            defaultResPath,
            newVersion,
            releasePath,
            patchPath,
            oldVersion
          );

          //mapData.res.json
          await this.resFileHandle(
            mapDataResPath,
            newVersion,
            releasePath,
            patchPath,
            oldVersion
          );
        }

        let versionListContent = await fs.readFileSync(
          this.publish_path + "/versionList.json",
          "utf-8"
        );
        let versionList = JSON.parse(versionListContent);
        if (versionList.versionList.indexOf(this.new_version) == -1) {
          versionList.versionList.push(this.new_version);
          versionListContent = JSON.stringify(versionList);
          await fs.writeFileSync(
            this.publish_path + "/versionList.json",
            versionListContent
          );
        }

        this.isMergeVersionLoading = false;
        ipcRenderer.send("client_show_message", "比较版本成功");
      } catch (error) {
        this.isMergeVersionLoading = false;
        ipcRenderer.send("client_show_snack", "比较版本错误:" + error);
        console.error("比较版本错误:" + error);
      }
    },
    //根据res配置文件,添加版本号到文件和配置中
    async resFileHandle(
      resFilePath,
      newVersion,
      releasePath,
      patchPath,
      oldVersion
    ) {
      let useNew = false;
      let newResContent = await fs.readFileSync(
        this.new_version_path + "/" + resFilePath,
        "utf-8"
      );
      let newResObj = JSON.parse(newResContent);
      let resources = newResObj.resources;
      if (oldVersion) {
        let oldResPath = this.addVersionToPath(resFilePath, oldVersion);
        let resEqual = await this.mergeFileInVersion(
          oldResPath,
          resFilePath,
          releasePath,
          patchPath,
          oldVersion,
          newVersion
        );
        console.log("oldResPath:" + oldResPath);
        if (!resEqual) {
          for (const iterator of resources) {
            let newPath = "resource/" + iterator.url;
            let oldPath = this.addVersionToPath(
              "resource/" + iterator.url,
              oldVersion
            );

            let resFileEqual = false;
            //处理纹理集配置内索引的图片地址
            if (iterator.type == "sheet") {
              //是图集,比较图集配置文件中的图片是否相同
              let newConfigContent = await fs.readFileSync(
                this.new_version_path + "/" + newPath
              );
              let newConfigObj = JSON.parse(newConfigContent);
              let newFilePath =
                "resource/" +
                this.getFileFolder(iterator.url) +
                "/" +
                newConfigObj.file;

              let oldConfigContent = await fs.readFileSync(
                this.old_version_path + "/" + oldPath
              );
              let oldConfigObj = JSON.parse(oldConfigContent);
              let oldFilePath =
                "resource/" +
                this.getFileFolder(iterator.url) +
                oldConfigObj.file;

              //判断图集配置是否相同
              resFileEqual = await this.mergeFileInVersion(
                oldFilePath,
                newFilePath,
                releasePath,
                patchPath,
                oldVersion,
                newVersion
              );

              //图集配置处理
              await this.sheetConfigHandle(
                resFileEqual,
                releasePath,
                patchPath,
                oldPath,
                newPath,
                oldVersion,
                newVersion,
                iterator.url
              );
            } else {
              //不是图集,直接比较
              resFileEqual = await this.mergeFileInVersion(
                oldPath,
                newPath,
                releasePath,
                patchPath,
                oldVersion,
                newVersion
              );
            }

            //修改图集配置中的版本号
            if (resFileEqual) {
              iterator.url = this.addVersionToPath(iterator.url, oldVersion);
            } else {
              iterator.url = this.addVersionToPath(iterator.url, newVersion);
            }
          }
        } else {
          useNew = true;
        }
      } else {
        useNew = true;
      }

      if (useNew) {
        for (const iterator of resources) {
          //处理纹理集配置内索引的图片地址
          if (iterator.type == "sheet") {
            let oldPath;
            if (oldVersion) {
              oldPath = this.addVersionToPath(
                "resource/" + iterator.url,
                oldVersion
              );
            }
            let newPath = "resource/" + iterator.url;
            let newConfigContent = await fs.readFileSync(
              this.new_version_path + "/" + newPath
            );
            let newConfigObj = JSON.parse(newConfigContent);
            let filePath =
              "resource/" +
              this.getFileFolder(iterator.url) +
              newConfigObj.file;
            //拷贝图集中的图片
            if (releasePath) {
              this.copyFileInVersion(filePath, releasePath, newVersion);
            }
            await this.copyFileInVersion(filePath, patchPath, newVersion);

            //图集配置处理,不相等,直接用新的
            await this.sheetConfigHandle(
              false,
              releasePath,
              patchPath,
              oldPath,
              newPath,
              oldVersion,
              newVersion,
              iterator.url
            );
          } else {
            //其他文件只要拷贝配置就好了
            let targetPath = "resource/" + iterator.url;
            if (releasePath) {
              await this.copyFileInVersion(targetPath, releasePath, newVersion);
            }
            await this.copyFileInVersion(targetPath, patchPath, newVersion);
          }

          //修改配置中的版本号
          iterator.url = this.addVersionToPath(iterator.url, newVersion);
        }
      }

      //修改res配置中的版本号
      newResContent = JSON.stringify(newResObj);
      let resUrl = this.addVersionToPath(resFilePath, newVersion);
      if (releasePath) {
        await fs.writeFileSync(releasePath + "/" + resUrl, newResContent);
      }
      await fs.writeFileSync(patchPath + "/" + resUrl, newResContent);
    },
    async sheetConfigHandle(
      resFileEqual,
      releasePath,
      patchPath,
      oldPath,
      newPath,
      oldVersion,
      newVersion,
      sheetUrl
    ) {
      if (resFileEqual) {
        //相等
        if (releasePath) {
          await this.copyFile(
            this.old_version_path + "/" + oldPath,
            releasePath + "/" + newPath,
            oldVersion
          );
        }
      } else {
        //不相等
        //release
        if (releasePath) {
          await this.copyFile(
            this.new_version_path + "/" + newPath,
            releasePath + "/" + newPath,
            newVersion
          );
        }

        //patch
        await this.copyFile(
          this.new_version_path + "/" + newPath,
          patchPath + "/" + newPath,
          newVersion
        );

        //修改图集配置文件
        if (releasePath) {
          let releaseFileContent = await fs.readFileSync(
            this.new_version_path + "/resource/" + sheetUrl
          );

          let releaseFileObj = JSON.parse(releaseFileContent);
          let originFileName = releaseFileObj.file;
          releaseFileObj.file = this.addVersionToPath(
            releaseFileObj.file,
            newVersion
          );
          releaseFileContent = JSON.stringify(releaseFileObj);
          await fs.writeFileSync(
            releasePath +
              "/resource/" +
              this.addVersionToPath(sheetUrl, newVersion),
            releaseFileContent
          );
        }

        let patchFileContent = await fs.readFileSync(
          this.new_version_path + "/resource/" + sheetUrl
        );
        let patchFileObj = JSON.parse(patchFileContent);
        let originFileName = patchFileObj.file;
        patchFileObj.file = this.addVersionToPath(
          patchFileObj.file,
          newVersion
        );
        patchFileContent = JSON.stringify(patchFileObj);
        await fs.writeFileSync(
          patchPath +
            "/resource/" +
            this.addVersionToPath(sheetUrl, newVersion),
          patchFileContent
        );
      }
    },
    async oneForAll() {
      ipcRenderer.send("client_show_loading");
      try {
        await this.onPublishProjectClick();
        await this.onMergetVersionClick();
        ipcRenderer.send("client_hide_loading");
        ipcRenderer.send("client_show_message", "One·for·All Success");
      } catch (e) {
        ipcRenderer.send("client_hide_loading");
        ipcRenderer.send("client_show_snack", "One·for·All Error:" + e);
      }
    },
    //刷新新版本号
    async refreshNewVersion() {
      let versionPath = this.new_version_path + "/version.json";
      if (fs.existsSync(versionPath)) {
        let content = await fs.readFileSync(versionPath, "utf-8");
        this.new_version = JSON.parse(content).version;
      } else {
        this.new_version = "";
        ipcRenderer.send("client_show_snack", "新版本不存在version.json");
      }
    },
    //刷新旧版本号
    async refreshOldVersion() {
      let versionPath = this.old_version_path + "/version.json";
      if (fs.existsSync(versionPath)) {
        let content = await fs.readFileSync(versionPath, "utf-8");
        this.old_version = JSON.parse(content).version;
      } else {
        this.old_version = "";
        ipcRenderer.send("client_show_snack", "旧版本不存在version.json");
      }
    },
    //根据两个版本比较文件
    async mergeFileInVersion(
      oldFilePath,
      newFilePath,
      releasePath,
      patchPath,
      oldVersion,
      newVersion
    ) {
      let newFileExist = await fs.existsSync(
        this.new_version_path + "/" + newFilePath
      );
      let oldFileExist = await fs.existsSync(
        this.old_version_path + "/" + oldFilePath
      );
      if (!newFileExist) {
        console.log("不存在文件:" + this.new_version_path + "/" + newFilePath);
        return false;
      }

      let fileEqual = false;
      if (oldFileExist) {
        fileEqual = await this.mergeFileByMd5(
          this.old_version_path + "/" + oldFilePath,
          this.new_version_path + "/" + newFilePath
        );
      }

      if (fileEqual) {
        // console.log(
        //   "fileEqual:true---" +
        //     "----oldPath:" +
        //     this.old_version_path +
        //     "/" +
        //     oldFilePath +
        //     "-----newPath:" +
        //     this.new_version_path +
        //     "/" +
        //     newFilePath
        // );
        if (releasePath) {
          await this.copyFileInVersion(newFilePath, releasePath, oldVersion);
        }
      } else {
        // console.log(
        //   "fileEqual:false---" +
        //     "----oldPath:" +
        //     this.old_version_path +
        //     "/" +
        //     oldFilePath +
        //     "-----newPath:" +
        //     this.new_version_path +
        //     "/" +
        //     newFilePath
        // );
        if (releasePath) {
          await this.copyFileInVersion(newFilePath, releasePath, newVersion);
        }
        await this.copyFileInVersion(newFilePath, patchPath, newVersion);
      }
      return fileEqual;
    },
    //比较两个文件的MD5
    async mergeFileByMd5(oldFilePath, newFilePath) {
      let oldFile = await fs.readFileSync(oldFilePath);
      let newFile = await fs.readFileSync(newFilePath);
      const oldFileMd5 = crypto
        .createHash("md5")
        .update(oldFile)
        .digest("hex");
      const newFileMd5 = crypto
        .createHash("md5")
        .update(newFile)
        .digest("hex");

      return oldFileMd5 == newFileMd5;
    },
    //根据版本拷贝目录中的文件
    folderCopyFileInVersion(folderName, targetPath, version) {
      this.folderCopyFile(
        this.new_version_path + "/" + folderName,
        targetPath + "/" + folderName,
        version
      );
    },
    //根据版本拷贝文件,不存在的目录会自动创建
    async copyFileInVersion(fileName, targetPath, version, fromPath) {
      if (!fromPath) {
        fromPath = this.new_version_path;
      }
      let fileNameArr = fileName.split("/");
      let checkPath = "";
      for (let i = 0; i < fileNameArr.length; i++) {
        checkPath += fileNameArr[i] + "/";
        let filePath = fromPath + "/" + checkPath;
        if (fs.existsSync(filePath)) {
          if (fs.statSync(filePath).isDirectory()) {
            await this.checkCreateFolder(targetPath + "/" + checkPath);
          }
        } else {
          console.error("不存在目录:" + filePath);
          return;
        }
      }

      await this.copyFile(
        fromPath + "/" + fileName,
        targetPath + "/" + fileName,
        version
      );
    },
    //拷贝文件
    copyFile(filePath, targetPath, version) {
      return new Promise((resolve, reject) => {
        try {
          if (version) {
            let targetPathArr = targetPath.split("/");
            let fileName = targetPathArr[targetPathArr.length - 1];
            if (fileName.indexOf(version) == -1) {
              targetPath = this.addVersionToPath(targetPath, version);
            } else {
              console.log(
                "targetPath:" + targetPath + "---fileName:" + fileName
              );
            }
          }

          fs.readFile(filePath, (readError, data) => {
            if (readError) {
              console.error(readError);
              reject();
            } else {
              fs.writeFile(targetPath, data, writeError => {
                if (writeError) {
                  console.error(writeError);
                  reject();
                } else {
                  resolve();
                }
              });
            }
          });
        } catch (error) {
          ipcRenderer.send(
            "client_show_snack",
            "copyt " + filePath + " to " + targetPath + " Error:" + error
          );
          console.error(
            "copyt " + filePath + " to " + targetPath + " Error:" + error
          );
          reject();
        }
      });
    },
    //拷贝目录中的文件,遍历拷贝,不存在文件夹就创建
    async folderCopyFile(fromPath, targetPath, version) {
      try {
        await this.checkCreateFolder(targetPath);
        let files = await fs.readdirSync(fromPath);
        // fs.readdir(
        //   fromPath,
        //   error => {
        //     if (error) {
        //       console.error(error);
        //     }
        //   },
        // files => {
        files.forEach(file => {
          let fromPathName = path.join(fromPath, file);
          let targetPathName = path.join(targetPath, file);
          if (fs.statSync(fromPathName).isDirectory()) {
            this.folderCopyFile(fromPathName, targetPathName);
          } else {
            this.copyFile(fromPathName, targetPathName, version);
          }
        });
        // }
        // );
      } catch (error) {
        ipcRenderer.send(
          "client_show_snack",
          "copyt " + fromPath + " to " + targetPath + " Error:" + error
        );
        console.error(
          "copyt " + fromPath + " to " + targetPath + " Error:" + error
        );
      }
    },
    //根据指定路径添加版本号并返回
    addVersionToPath(targetPath, version) {
      let returnPath = targetPath;
      if (version) {
        let targetPathArr = targetPath.split(".");
        let suffix = targetPathArr[targetPathArr.length - 1];
        let preffix = "";
        for (let i = 0; i < targetPathArr.length; i++) {
          const element = targetPathArr[i];
          if (i < targetPathArr.length - 2) {
            preffix += element + ".";
          } else if (i < targetPathArr.length - 1) {
            preffix += element;
          } else {
            //reserve
          }
        }
        returnPath = preffix + "_v" + version + "." + suffix;
      }
      return returnPath;
    },
    //检查并创建文件夹
    checkCreateFolder(path) {
      return new Promise((resolve, reject) => {
        if (!fs.existsSync(path)) {
          fs.mkdir(path, error => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        } else {
          resolve();
        }
      });
    },
    //获取文件所在目录
    getFileFolder(filePath) {
      let filePathArr = filePath.split("/");
      let fileFolder = "";
      for (let i = 0; i < filePathArr.length; i++) {
        const element = filePathArr[i];
        if (i != filePathArr.length - 1) {
          fileFolder += element + "/";
        }
      }

      return fileFolder;
    }
  },
  mounted() {
    this.project_path = localStorage.getItem("client_project_path");
    this.publish_path = localStorage.getItem("client_publish_path");

    ipcRenderer.removeAllListeners([
      "selected_new_version_path",
      "selected_old_version_path"
    ]);

    ipcRenderer.on("selected_new_version_path", (event, path) => {
      if (path) {
        this.new_version_path = path[0];
        this.refreshNewVersion();
      }
    });

    ipcRenderer.on("selected_old_version_path", (event, path) => {
      if (path) {
        this.old_version_path = path[0];
        this.refreshOldVersion();
      }
    });
  }
};
</script>
<style lang="less">
.text-version {
  width: 100px;
}

.text-path {
  width: 512px;
}

.demo-list-wrap {
  width: 100%;
  max-width: 640px;
  overflow: hidden;
}

.button-wrapper {
  text-align: left;
}

.control-group {
  margin: 25px 0;
  max-width: 800px;
}
</style>