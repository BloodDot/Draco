import { PublishModel } from "./PublishModel.js";
import { FtpModel } from "./FtpModel.js";
export class ModelMgr {
    static publishModel = new PublishModel();
    static ftpModel = new FtpModel();

    static async init() {
        await this.publishModel.init();
        await this.ftpModel.init();
    }
}