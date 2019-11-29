export class LanguageModel {
    eLanguage = {
        default: "zh",
        en: "en",
    }

    curLanguage;

    languageTableName = "Language.csv";

    languageList = [
        {
            name: this.eLanguage.default, displayName: "default", csvPath: "/settings/config/csv", UITextPath: "/settings/UItext/UIText_zh",
            languagePath: "/ch", trunkSuffix: "", trunkFold: "trunk",
            UITextEnable: false,
        },
        {
            name: this.eLanguage.en, displayName: "en", csvPath: "/settings/config/csv_en", UITextPath: "/settings/UItext/UItext_en",
            languagePath: "/en", trunkSuffix: "_en", trunkFold: "language",
            UITextEnable: true,
        }
    ];

    init() {
        this.curLanguage = this.languageList.find(value => value.name === this.eLanguage.default);
    }
}