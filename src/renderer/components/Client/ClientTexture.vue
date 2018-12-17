<template>
  <div>
    <mu-container>
      <div class="button-wrapper">
        <!-- <mu-button v-loading="isCheckTextureLoading" data-mu-loading-size="24" color="primary" @click="checkTexture">检查纹理</mu-button> -->
        <mu-button
          v-loading="isUpdateSvnLoading"
          data-mu-loading-size="24"
          color="pink500"
          @click="updateSvn"
        >更新svn文件</mu-button>
        <mu-button
          v-loading="isClearTextureLoading"
          data-mu-loading-size="24"
          color="orange500"
          @click="clearTexture"
        >清空纹理</mu-button>
        <mu-button
          v-loading="isCopyTextureInLoading"
          data-mu-loading-size="24"
          color="cyan500"
          @click="copyTextureIn"
        >拷入纹理</mu-button>
        <mu-button
          v-loading="isClipTextureLoading"
          data-mu-loading-size="24"
          color="blue500"
          @click="clipTexture"
        >裁剪纹理</mu-button>
        <mu-button
          v-loading="isPackerTextureLoading"
          data-mu-loading-size="24"
          color="purple500"
          @click="packerTexture"
        >打包纹理</mu-button>
        <mu-button
          v-loading="isCopyTextureOutLoading"
          data-mu-loading-size="24"
          color="green500"
          @click="copyTextureOut"
        >拷出纹理</mu-button>
      </div>
      <div class="button-wrapper">
        <mu-button full-width color="red500" @click="oneForAll">One·for·All</mu-button>
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
import { global } from "../js/Global.js";
import { mdTexture } from "../js/MdTexture.js";

export default {
  data() {
    return {
      isUpdateSvnLoading: false,
      isCheckTextureLoading: false,
      isCopyTextureInLoading: false,
      isClearTextureLoading: false,
      isClipTextureLoading: false,
      isPackerTextureLoading: false,
      isCopyTextureOutLoading: false,

      checkBoxValues: mdTexture.checkBoxValues,
      checkBoxData: mdTexture.checkBoxData,
      checkAll: true
    };
  },
  watch: {
    checkBoxData: function(val, oldVal) {
      mdTexture.checkBoxData = val;
    }
  },
  methods: {
    handleCheckAll() {
      this.checkAll = !this.checkAll;
      if (this.checkAll) {
        this.checkBoxData = this.checkBoxValues.concat();
      } else {
        this.checkBoxData.length = 0;
      }
    },
    async updateSvn() {
      this.isUpdateSvnLoading = true;
      try {
        await mdTexture.updateSvn();
        this.isUpdateSvnLoading = false;
      } catch (error) {
        this.isUpdateSvnLoading = false;
      }
    },
    async clearTexture() {
      this.isClearTextureLoading = true;
      try {
        await mdTexture.clearTexture();
        this.isClearTextureLoading = false;
      } catch (error) {
        this.isClearTextureLoading = false;
      }
    },
    async copyTextureIn() {
      this.isCopyTextureInLoading = true;
      try {
        await mdTexture.copyTextureIn();
        this.isCopyTextureInLoading = false;
      } catch (error) {
        this.isCopyTextureInLoading = false;
      }
    },
    async clipTexture() {
      this.isClipTextureLoading = true;
      try {
        await mdTexture.clipTexture();
        this.isClipTextureLoading = false;
      } catch (error) {
        this.isClipTextureLoading = false;
      }
    },
    async packerTexture() {
      this.isPackerTextureLoading = true;
      try {
        await mdTexture.packerTexture();
        this.isPackerTextureLoading = false;
      } catch (error) {
        this.isPackerTextureLoading = false;
      }
    },
    async copyTextureOut() {
      this.isCopyTextureOutLoading = true;
      try {
        await mdTexture.copyTextureOut();
        this.isCopyTextureOutLoading = false;
      } catch (error) {
        this.isCopyTextureOutLoading = false;
      }
    },
    async oneForAll() {
      global.showLoading();
      try {
        await mdTexture.oneForAll();
        global.dialog("One·for·All Success");
        global.hideLoading();
      } catch (error) {
        global.hideLoading();
      }
    }
  },
  mounted() {}
};
</script>

<style lang="css">
.demo-snackbar-button {
  margin: 12px;
}

.demo-table-item-select-field {
  margin-top: 12px;
}

.content {
  overflow: hidden;
}

.content-left {
  width: 20%;
  float: left;
  background-color: white;
  margin-bottom: -4000px;
  padding-bottom: 4000px;
}

.content-right {
  width: 80%;
  display: inline-block;
  padding: 10px 20px;
  background-color: rgba(0, 0, 0, 0);
}

.select-control-row {
  padding: 8px 0;
}
.select-control-group {
  margin: 16px 0;
}
</style>