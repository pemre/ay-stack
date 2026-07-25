import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import config from "../config";
import en from "./locales/en.json";
import tr from "./locales/tr.json";
import zh from "./locales/zh.json";

i18n.use(initReactI18next).init({
  resources: {
    tr: { translation: tr },
    en: { translation: en },
    zh: { translation: zh },
  },
  lng: config.app.defaultLocale,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // React already escapes
  },
});

export default i18n;
