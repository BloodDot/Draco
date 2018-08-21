<template>
  <div>
    <mu-container >
      <div class="button-wrapper">
        <mu-button v-loading="isPublishProjectLoading" data-mu-loading-size="24" color="pink500" @click="publishProject">发布项目</mu-button>
        <mu-button v-loading="isPublishProjectLoading" data-mu-loading-size="24" color="orange500" @click="publishProject">发布项目</mu-button>
        <mu-button v-loading="isPublishProjectLoading" data-mu-loading-size="24" color="cyan500" @click="publishProject">发布项目</mu-button>
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
            <mu-text-field class="text-path" v-model="new_version_path" label="选择新版本目录" label-float />
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
            <mu-text-field class="text-path" v-model="old_version_path" label="选择旧版本目录" label-float />
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
const crypto = require("crypto");

export default {
  data() {
    return {
      project_path: "",
      isPublishProjectLoading: false,
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
    onNewVersionClick() {
      ipcRenderer.send("open_new_version_path");
    },
    onOldVersionClick() {
      ipcRenderer.send("open_old_version_path");
    },
    publishProject() {
      //   let file = fs.readFileSync(
      //     this.project_path + "/" + "wingProperties.json"
      //   );
      //   const md5 = crypto
      //     .createHash("md5")
      //     .update(file)
      //     .digest("hex");
      //   console.log(md5);

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
            reject();
          } else {
            this.isPublishProjectLoading = false;

            let content = JSON.stringify({ version: this.cur_version });
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
    async oneForAll() {
      ipcRenderer.send("client_show_loading");
      try {
        await this.publishProject();
        ipcRenderer.send("client_hide_loading");
        ipcRenderer.send("client_show_message", "One·for·All Success");
      } catch (e) {
        ipcRenderer.send("client_hide_loading");
        ipcRenderer.send("client_show_snack", "One·for·All Error:" + e);
      }
    }
  },
  mounted() {
    this.project_path = localStorage.getItem("client_project_path");

    ipcRenderer.removeAllListeners([
      "selected_new_version_path",
      "selected_old_version_path"
    ]);

    ipcRenderer.on("selected_new_version_path", (event, path) => {
      this.new_version_path = path[0];
    });

    ipcRenderer.on("selected_old_version_path", (event, path) => {
      this.old_version_path = path[0];
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