import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from '../locales/en/translation.json';
import th from '../locales/th/translation.json';
import { getLangFromUrl } from '../utils/langQuery';

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: en
    },
    th: {
      translation: th
    }
  },
  lng: getLangFromUrl("en"),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;