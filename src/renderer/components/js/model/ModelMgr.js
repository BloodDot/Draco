import { LanguageModel } from "./LanguageModel";
import { VersionModel } from "./VersionModel";
import { FtpModel } from "./FtpModel";
export class ModelMgr {
    static languageModel = new LanguageModel();
    static versionModel = new VersionModel();
    static ftpModel = new FtpModel();

    static async init() {
        this.languageModel.init();
        await this.versionModel.init();
        await this.ftpModel.init();
    }
}