<template>
  <mu-container>
    <div class="button-wrapper">
      <mu-button
        v-loading="isImportDefaultLoading"
        data-mu-loading-size="24"
        color="pink500"
        @click="importDefault"
      >导入default配置</mu-button>
      <mu-button
        v-loading="isImportAsyncLoading"
        data-mu-loading-size="24"
        color="orange500"
        @click="importAsync"
      >导入async配置</mu-button>
      <mu-button
        v-loading="isImportIndieLoading"
        data-mu-loading-size="24"
        color="cyan500"
        @click="importIndie"
      >导入indie配置</mu-button>
      <mu-button
        v-loading="isImportMapDataLoading"
        data-mu-loading-size="24"
        color="blue500"
        @click="importMapData"
      >导入mapData配置</mu-button>
    </div>
    <div class="button-wrapper">
      <mu-button full-width color="red" @click="oneForAll">One·for·All</mu-button>
    </div>
  </mu-container>
</template>

<script>
import * as mdAsset from "../js/MdAsset.js";
import * as global from "../js/Global.js";

export default {
  data() {
    return {
      isImportDefaultLoading: false,
      isImportAsyncLoading: false,
      isImportIndieLoading: false,
      isImportMapDataLoading: false
    };
  },
  watch: {},
  methods: {
    async importDefault() {
      this.isImportDefaultLoading = true;

      try {
        await mdAsset.importDefault();
        this.isImportDefaultLoading = false;
      } catch (error) {
        this.isImportDefaultLoading = false;
      }
    },
    async importAsync() {
      this.isImportAsyncLoading = true;
      try {
        await mdAsset.importAsync();
        this.isImportAsyncLoading = false;
      } catch (error) {
        this.isImportAsyncLoading = false;
      }
    },
    async importIndie() {
      this.isImportIndieLoading = true;
      try {
        await mdAsset.importIndie();
        this.isImportIndieLoading = false;
      } catch (error) {
        this.isImportIndieLoading = false;
      }
    },
    async importMapData() {
      this.isImportMapDataLoading = true;
      try {
        await mdAsset.importMapData();
        this.isImportMapDataLoading = false;
      } catch (error) {
        this.isImportMapDataLoading = false;
      }
    },
    async oneForAll() {
      global.showLoading();
      try {
        await mdAsset.oneForAll();
        global.dialog("One·for·All Success");
        global.hideLoading();
      } catch (error) {
        global.hideLoading();
        global.snack("One·for·All Error", error);
      }
    }
  },
  mounted() {}
};
</script>