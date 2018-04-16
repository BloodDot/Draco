<template>
    <div>
        <mu-raised-button label="更新svn文件" class="demo-snackbar-button" @click="updateSvn" primary/>
        <mu-raised-button label="压缩csv文件" class="demo-snackbar-button" @click="zipCsv" primary/>
        <mu-raised-button label="生成ts文件" class="demo-snackbar-button" @click="createTs" primary/>

        <!-- <mu-raised-button label="生成js文件" class="demo-snackbar-button" @click="createJs" primary/>
        <mu-raised-button label="修改ts文件" class="demo-snackbar-button" @click="modifyTs" primary/> -->
    </div>
</template>

<script>
let exec = require("child_process").exec;
const ipcRenderer = require("electron").ipcRenderer;
const remote = require("electron").remote;
const fs = require("fs");
const removeSpaces = require("strman").removeSpaces;
const replace = require("strman").replace;
const spawn = require("child_process").spawn;
const iconv = require("iconv-lite");
const toStudlyCaps = require("strman").toStudlyCaps;
const archiver = require("archiver");

export default {
  data() {
    return {
      project_path: "",
      csv_path: ""
    };
  },
  watch: {},
  methods: {
    updateSvn() {
      console.log(this.csv_path);
      let process = spawn("svn", ["update"], { cwd: this.csv_path });
      process.stdout.on("data", function(data) {
        console.log("stdout: " + data);
      });
      process.stderr.on("data", function(data) {
        console.log("stderr: " + data);
      });
      process.on("exit", function(code) {
        if (code == 0) {
          ipcRenderer.send("client_show_snack", "更新svn成功");
        } else {
          console.log("更新svn错误,错误码:" + code);
          ipcRenderer.send("client_show_snack", "更新svn失败");
        }
      });
    },
    zipCsv() {
      let pa = fs.readdirSync(this.csv_path);
      let archive = archiver("zip");
      let fileName = "csv.zip";
      let filePath = this.project_path + "/resource/csv/";
      let output = fs.createWriteStream(filePath + fileName);
      archive.pipe(output);

      for (let i = 0; i < pa.length; i++) {
        const element = pa[i];
        if (element.indexOf(".csv") != -1) {
          // fs.writeFileSync(
          //   this.project_path + "/resource/csv/" + element,
          //   fs.readFileSync(this.csv_path + "/" + element),
          //   function(err) {
          //     if (err) {
          //       ipcRenderer.send(
          //         "client_show_snack",
          //         "复制" + element + "失败,错误码:" + err
          //       );
          //     } else {
          //       console.log("复制" + element + "成功");
          //     }
          //   }
          // );

          archive.append(fs.createReadStream(this.csv_path + "/" + element), {
            name: element
          });
        }
      }

      archive.on("error", function(err) {
        console.log("压缩zip失败,错误" + err);
        ipcRenderer.send("client_show_snack", "压缩zip失败");
      });
      output.on("close", function() {
        console.log("压缩zip成功");
        ipcRenderer.send("client_show_message", "压缩zip成功");
      });

      archive.finalize();
    },
    createTs() {
      let pa = fs.readdirSync(this.csv_path);
      for (let i = 0; i < pa.length; i++) {
        const element = pa[i];
        if (element.indexOf(".csv") != -1) {
          let data = fs.readFileSync(this.csv_path + "/" + element);
          let buffer = new Buffer(data, "gbk");
          data = iconv.decode(buffer, "gbk");
          let clsName = toStudlyCaps(element.split(".csv")[0]);
          createCell(clsName, data, content => {
            fs.writeFile(
              this.project_path + "/src/csv/cell/" + clsName + "Cell.ts",
              content,
              function(err) {
                if (err) {
                  console.log(
                    "生成" + clsName + "cell.ts文件失败,错误码:" + err
                  );
                  ipcRenderer.send(
                    "client_show_message",
                    "生成" + clsName + "cell.ts文件失败"
                  );
                }
              }
            );
          });

          createTable(clsName, content => {
            let filePath =
              this.project_path + "/src/csv/table/" + clsName + "Table.ts";
            if (fs.existsSync(filePath)) {
              //已存在，不创建
              return;
            }
            fs.writeFile(filePath, content, function(err) {
              if (err) {
                console.log(
                  "生成" + clsName + "Table.ts文件失败,错误码:" + err
                );
                ipcRenderer.send(
                  "client_show_message",
                  "生成" + clsName + "cell.ts文件失败"
                );
              }
            });
          });
        }
      }

      ipcRenderer.send("client_show_message", "生成ts文件完毕");

      function createCell(name, data, callBack) {
        data = data.toString();
        let content = "";

        let preContent =
          "/**\r\n" +
          " * @author 雪糕\r\n" +
          " * @desc " +
          name +
          "表结构体\r\n" +
          " *\r\n" +
          " */\r\n" +
          "class " +
          name +
          "Cell {\r\n";
        let endContent = "\tpublic constructor() {\r\n" + "\t}\r\n" + "}";
        let centerContent = "";
        let rows = data.split("\r\n");
        let descs = rows[0].split(",");
        let attrs = rows[1].split(",");
        let types = rows[2].split(",");
        for (let i = 0; i < attrs.length; i++) {
          if (attrs[i] === "") {
            continue;
          }
          let desc = descs[i] ? descs[i] : "";
          let type = "";
          if (types[i]) {
            switch (types[i]) {
              case "int":
                type = "number";
                break;
              case "string":
                type = "string";
                break;
              case "bool":
                type = "boolean";
                break;
              default:
                type = "any";
                break;
            }
          } else {
            type = "any";
          }

          if (attrs[i] != "null") {
            centerContent += "\t/** " + desc + " */\r\n";
            centerContent += "\tpublic " + attrs[i] + ": " + type + ";\r\n";
          }
        }

        content = preContent + centerContent + endContent;
        callBack(content);
      }

      function createTable(name, callBack) {
        let content =
          "/**\r\n" +
          " * @author 雪糕\r\n" +
          " * @desc " +
          name +
          "表\r\n" +
          " *\r\n" +
          " */\r\n" +
          "class " +
          name +
          "Table {\r\n" +
          "	private _cells: " +
          name +
          "Cell[];\r\n" +
          "\r\n" +
          "	//单例-----------\r\n" +
          "	private static _instance: " +
          name +
          "Table;\r\n" +
          "	public static get instance(): " +
          name +
          "Table {\r\n" +
          "		if (!this._instance) {\r\n" +
          "			this._instance = new " +
          name +
          "Table();\r\n" +
          "		}\r\n" +
          "		return this._instance;\r\n" +
          "	}\r\n" +
          "\r\n" +
          "	public constructor() {\r\n" +
          "	}\r\n" +
          "\r\n" +
          "	/** 解析数据 */\r\n" +
          "	public analysis(data: any[]): void {\r\n" +
          "		this._cells = data;\r\n" +
          "	}\r\n" +
          "\r\n" +
          "	public getCellById(id: number): " +
          name +
          "Cell {\r\n" +
          "		for (let i: number = 0; i < this._cells.length; i++) {\r\n" +
          "			let cell: " +
          name +
          "Cell = this._cells[i];\r\n" +
          "			if (cell.id === id) {\r\n" +
          "				return cell;\r\n" +
          "			}\r\n" +
          "		}\r\n" +
          "		return null;\r\n" +
          "	}\r\n" +
          "}\r\n";

        callBack(content);
      }
    }
  },
  mounted() {
    this.project_path = localStorage.getItem("client_project_path");
    this.proto_path = localStorage.getItem("client_proto_path");
    this.csv_path = localStorage.getItem("client_csv_path");
  }
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
  float: right;
  padding: 10px 20px;
  background-color: rgba(0, 0, 0, 0);
}
</style>