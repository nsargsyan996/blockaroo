import { initReactI18next } from "react-i18next";

import * as Localization from "expo-localization";
import i18n from "i18next";

import en from "./locales/en.json";
import hy from "./locales/hy.json";
import ru from "./locales/ru.json";

export const SUPPORTED_LANGUAGES = ["en", "hy", "ru"] as const;
export type TLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const resolveLanguage = (code: string | null | undefined): TLanguage =>
    SUPPORTED_LANGUAGES.find((language) => language === code) ?? "en";

// eslint-disable-next-line import/no-named-as-default-member -- i18next documents the default instance API
i18n.use(initReactI18next).init({
    resources: { en: { translation: en }, hy: { translation: hy }, ru: { translation: ru } },
    lng: resolveLanguage(Localization.getLocales()[0]?.languageCode),
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    returnNull: false,
    showSupportNotice: false,
});

export default i18n;
