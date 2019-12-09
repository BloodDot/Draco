export class LanguageModel {
    eLanguage = {
        default: "default",
        en: "en",
    }

    defaultCsvPath = "/settings/config/csv";
    zhCsvPath = "/settings/config/csv_zh";

    defaultUITextPath = "/settings/UItext/UIText_default";
    zhUITextPath = "/settings/UItext/UIText_zh";

    curLanguage;

    languageTableName = "Language.csv";

    languageList = [
        {
            name: this.eLanguage.default, csvPath: "/settings/config/csv", UITextPath: "/settings/UItext/UIText_zh",
            csvTranslate: "csv_zh_translate.txt", uiTranslate: "ui_zh_translate.txt"
        },
        {
            name: this.eLanguage.en, csvPath: "/settings/config/csv_en", UITextPath: "/settings/UItext/UItext_en",
            csvTranslate: "csv_en_translate.txt", uiTranslate: "ui_en_translate.txt"
        }
    ];

    init() {
        this.curLanguage = this.languageList.find(value => value.name === this.eLanguage.default);
    }
}