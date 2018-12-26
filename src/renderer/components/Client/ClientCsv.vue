<template>
  <mu-container>
    <div class="button-wrapper">
      <mu-button
        v-loading="isUpdateSvnLoading"
        data-mu-loading-size="24"
        color="pink500"
        @click="updateSvn"
      >更新svn文件</mu-button>
      <mu-button
        v-loading="isZipCsvLoading"
        data-mu-loading-size="24"
        color="orange500"
        @click="zipCsv"
      >压缩csv文件</mu-button>
      <mu-button
        v-loading="isCreateTsLoading"
        data-mu-loading-size="24"
        color="cyan500"
        @click="createTs"
      >生成ts文件</mu-button>
    </div>
    <div class="button-wrapper">
      <mu-button full-width color="red" @click="oneForAll">One·for·All</mu-button>
    </div>
  </mu-container>
</template>

<script>
import * as mdCsv from "../js/MdCsv.js";
import * as global from "../js/Global.js";

export default {
  data() {
    return {
      isUpdateSvnLoading: false,
      isZipCsvLoading: false,
      isCreateTsLoading: false
    };
  },
  watch: {},
  methods: {
    async updateSvn() {
      this.isUpdateSvnLoading = true;
      try {
        await mdCsv.updateSvn();
        this.isUpdateSvnLoading = false;
      } catch (error) {
        this.isUpdateSvnLoading = false;
      }
    },
    async zipCsv() {
      this.isZipCsvLoading = true;

      try {
        await mdCsv.zipCsv();
        this.isZipCsvLoading = false;
      } catch (error) {
        this.isZipCsvLoading = false;
      }
    },
    async createTs() {
      this.isCreateTsLoading = true;
      try {
        await mdCsv.createTs();
        this.isCreateTsLoading = false;
      } catch (error) {
        this.isCreateTsLoading = false;
      }
    },

    async oneForAll() {
      global.showLoading();
      try {
        await mdCsv.oneForAll();
        global.hideLoading();
        global.toast("One·for·All Success");
      } catch (e) {
        global.hideLoading();
        global.snack("One·for·All Error", e);
      }
    }
  },
  mounted() {}
};
</script>