<template>
  <mu-container>
    <div class="button-wrapper">
      <mu-button
        v-loading="isEgretRunLoading"
        data-mu-loading-size="24"
        color="pink500"
        @click="egretRun"
      >运行游戏</mu-button>
      <mu-button
        v-loading="isEgretStopLoading"
        data-mu-loading-size="24"
        color="orange500"
        @click="stopRun"
      >停止游戏</mu-button>
    </div>
  </mu-container>
</template>
<script>
import * as mdEgret from "../js/MdEgret.js";
import { Global } from "../js/Global.js";

export default {
  data() {
    return {
      isEgretRunLoading: false,
      isEgretStopLoading: false
    };
  },
  watch: {},
  methods: {
    async egretRun() {
      this.isEgretRunLoading = true;
      Global.showRegionLoading();
      try {
        await mdEgret.egretRun();
        this.isEgretRunLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isEgretRunLoading = false;
        Global.hideRegionLoading();
      }
    },
    stopRun() {
      this.isEgretStopLoading = true;
      Global.showRegionLoading();
      try {
        mdEgret.stopRun();
        this.isEgretStopLoading = false;
        this.isEgretRunLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isEgretStopLoading = false;
        Global.hideRegionLoading();
      }
    }
  },
  mounted() {}
};
</script>