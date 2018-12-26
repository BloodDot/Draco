<template>
  <mu-container>
    <div class="button-wrapper">
      <mu-button
        v-loading="isUpdateGitLoading"
        data-mu-loading-size="24"
        color="pink500"
        @click="updateGit"
      >更新git文件</mu-button>
      <mu-button
        v-loading="isComposeProtoLoading"
        data-mu-loading-size="24"
        color="orange500"
        @click="composeProto"
      >合成proto文件</mu-button>
      <mu-button
        v-loading="isCreateJsLoading"
        data-mu-loading-size="24"
        color="cyan500"
        @click="createJs"
      >生成js文件</mu-button>
      <mu-button
        v-loading="isCreateTsLoading"
        data-mu-loading-size="24"
        color="blue500"
        @click="createTs"
      >生成ts文件</mu-button>
      <mu-button
        v-loading="isModifyTsLoading"
        data-mu-loading-size="24"
        color="purple500"
        @click="modifyTs"
      >修改ts文件</mu-button>
    </div>
    <div class="button-wrapper">
      <mu-button full-width color="red500" @click="oneForAll">One·for·All</mu-button>
    </div>
  </mu-container>
</template>

<script>
import * as mdProto from "../js/MdProto.js";
import * as global from "../js/Global.js";

export default {
  data() {
    return {
      isUpdateGitLoading: false,
      isComposeProtoLoading: false,
      isCreateJsLoading: false,
      isCreateTsLoading: false,
      isModifyTsLoading: false
    };
  },
  watch: {},
  methods: {
    async updateGit() {
      this.isUpdateGitLoading = true;
      try {
        await mdProto.updateGit();
        this.isUpdateGitLoading = false;
      } catch (error) {
        this.isUpdateGitLoading = false;
      }
    },
    async composeProto() {
      this.isComposeProtoLoading = true;
      try {
        await mdProto.composeProto();
        this.isComposeProtoLoading = false;
      } catch (error) {
        this.isComposeProtoLoading = false;
      }
    },
    async createJs() {
      this.isCreateJsLoading = true;
      try {
        await mdProto.createJs();
        this.isCreateJsLoading = false;
      } catch (error) {
        this.isCreateJsLoading = false;
      }
    },
    async createTs() {
      this.isCreateTsLoading = true;
      try {
        await mdProto.createTs();
        this.isCreateTsLoading = false;
      } catch (error) {
        this.isCreateTsLoading = false;
      }
    },
    async modifyTs() {
      this.isModifyTsLoading = true;
      try {
        await mdProto.modifyTs();
        this.isModifyTsLoading = false;
      } catch (error) {
        this.isModifyTsLoading = false;
      }
    },
    async oneForAll() {
      global.showLoading();
      try {
        await mdProto.oneForAll();
        global.hideLoading();
        global.dialog("One·for·All Success");
      } catch (e) {
        global.hideLoading();
        global.snack("One·for·All Error", e);
      }
    }
  },
  mounted() {}
};
</script>

<style lang="less">
</style>