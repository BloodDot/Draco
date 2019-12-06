<template>
  <mu-container>
    <div class="button-wrapper">
      <mu-select
        label="语言版本"
        @change="onLanguageChange"
        filterable
        v-model="curLanguage"
        label-float
        full-width
      >
        <mu-option
          v-for="value,index in languageList"
          :key="value.name"
          :label="value.name"
          :value="value"
        ></mu-option>
      </mu-select>
      <mu-button
        v-loading="isExecuteCsvLoading"
        data-mu-loading-size="24"
        color="pink500"
        @click="executeCsv"
      >遍历比较csv文件</mu-button>
      <mu-button
        v-loading="isExecuteUITextLoading"
        data-mu-loading-size="24"
        color="orange500"
        @click="executeUIText"
      >处理UIText文件</mu-button>
      <mu-button
        v-loading="isApplyTranslationLoading"
        data-mu-loading-size="24"
        color="cyan500"
        @click="applyTranslation"
      >应用翻译文件</mu-button>
    </div>
  </mu-container>
</template>

<script>
import * as mdLanguage from "../js/MdLanguage.js";
import { Global } from "../js/Global.js";
import { ModelMgr } from "../js/model/ModelMgr";

export default {
  data() {
    return {
      isExecuteCsvLoading: false,
      isExecuteUITextLoading: false,
      isApplyTranslationLoading: false,

      languageList: ModelMgr.languageModel.languageList,
      curLanguage: ModelMgr.languageModel.curLanguage
    };
  },
  watch: {},
  methods: {
    onLanguageChange() {
      ModelMgr.languageModel.curLanguage = this.curLanguage;
    },
    async executeCsv() {
      this.isExecuteCsvLoading = true;
      Global.showRegionLoading();
      try {
        await mdLanguage.executeCsv();
        this.isExecuteCsvLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isExecuteCsvLoading = false;
        Global.hideRegionLoading();
      }
    },
    async executeUIText() {
      this.isExecuteUITextLoading = true;
      Global.showRegionLoading();
      try {
        await mdLanguage.executeUIText();
        this.isExecuteUITextLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isExecuteUITextLoading = false;
        Global.hideRegionLoading();
      }
    },
    async applyTranslation() {
      this.isApplyTranslationLoading = true;
      Global.showRegionLoading();
      try {
        await mdLanguage.applyTranslation();
        this.isApplyTranslationLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isApplyTranslationLoading = false;
        Global.hideRegionLoading();
      }
    }
  },
  mounted() {
    this.languageList = ModelMgr.languageModel.languageList.filter(
      value => value.name != ModelMgr.languageModel.eLanguage.default
    );
    this.curLanguage = ModelMgr.languageModel.curLanguage = this.languageList[0];
  }
};
</script>