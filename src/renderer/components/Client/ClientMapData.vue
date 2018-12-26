<template>
  <div>
    <mu-container>
      <div class="button-wrapper">
        <mu-button
          v-loading="isUpdateSvnLoading"
          data-mu-loading-size="24"
          color="pink500"
          @click="updateSvn"
        >更新svn文件</mu-button>
        <mu-button
          v-loading="isExecuteFileLoading"
          data-mu-loading-size="24"
          color="orange500"
          @click="executeBatFile"
        >执行bat文件</mu-button>
        <mu-button
          v-loading="isClearFileLoading"
          data-mu-loading-size="24"
          color="cyan500"
          @click="clearMapDataFile"
        >清空mapData文件</mu-button>
        <mu-button
          v-loading="isCopyFileLoading"
          data-mu-loading-size="24"
          color="blue500"
          @click="copyMapDataFile"
        >拷贝mapData文件</mu-button>
      </div>
      <div class="button-wrapper">
        <mu-button full-width color="red" @click="oneForAll">One·for·All</mu-button>
      </div>
    </mu-container>
    <mu-container>
      <div class="select-control-group">
        <mu-flex class="select-control-row">
          <mu-checkbox
            label="全选"
            :input-value="checkAll"
            @change="handleCheckAll"
            :checked-icon="checkBoxData.length < checkBoxValues.length ? 'indeterminate_check_box' : undefined"
          ></mu-checkbox>
        </mu-flex>
        <mu-flex
          class="select-control-row"
          :key="checkBoxValue"
          v-for="checkBoxValue in checkBoxValues"
        >
          <mu-checkbox :value="checkBoxValue" v-model="checkBoxData" :label="checkBoxValue"></mu-checkbox>
        </mu-flex>
      </div>
    </mu-container>
  </div>
</template>

<script>
import * as mdMapData from "../js/MdMapData.js";
import * as global from "../js/Global.js";

// let exec = require("child_process").exec;
// const ipcRenderer = require("electron").ipcRenderer;
// const remote = require("electron").remote;
// const fs = require("fs");
// const spawn = require("child_process").spawn;
// const archiver = require("archiver");
// const path = require("path");

const map_data_suffix_path = "/resource/mapData";
export default {
  data() {
    return {
      project_path: "",
      map_data_path: "",
      isUpdateSvnLoading: false,
      isExecuteFileLoading: false,
      isClearFileLoading: false,
      isCopyFileLoading: false,

      checkBoxValues: mdMapData.getCheckBoxValues(),
      checkBoxData: mdMapData.getCheckBoxData(),
      checkAll: true
    };
  },
  watch: {
    checkBoxData: function(val, oldVal) {
      mdMapData.setCheckBoxData(val);
    }
  },
  methods: {
    handleCheckAll() {
      this.checkAll = !this.checkAll;
      if (this.checkAll) {
        this.checkBoxData = mdMapData.getCheckBoxValues().concat();
      } else {
        this.checkBoxData.length = 0;
      }
    },
    async updateSvn() {
      this.isUpdateSvnLoading = true;
      try {
        await mdMapData.updateSvn();
        this.isUpdateSvnLoading = false;
      } catch (error) {
        this.isUpdateSvnLoading = false;
      }
    },
    async executeBatFile() {
      this.isExecuteFileLoading = true;
      try {
        await mdMapData.executeBatFile();
        global.dialog("执行bat成功");
        this.isExecuteFileLoading = false;
      } catch (error) {
        global.dialog("执行bat错误");
        this.isExecuteFileLoading = false;
      }
    },
    async clearMapDataFile() {
      this.isClearFileLoading = true;
      try {
        await mdMapData.clearMapFile();
        this.isClearFileLoading = false;
      } catch (error) {
        this.isClearFileLoading = false;
      }
    },
    async copyMapDataFile() {
      this.isCopyFileLoading = true;
      try {
        await mdMapData.copyMapFile();
        this.isCopyFileLoading = false;
      } catch (error) {
        this.isCopyFileLoading = false;
      }
    },
    async oneForAll() {
      global.showLoading();
      try {
        await mdMapData.oneForAll();

        global.hideLoading();
        global.dialog("One·for·All Success");
      } catch (e) {
        global.hideLoading();
        global.snack("One·for·All Error:", e);
      }
    }
  },
  mounted() {}
};
</script>

<style lang="css">
.select-control-row {
  padding: 8px 0;
}
.select-control-group {
  margin: 16px 0;
}
</style>