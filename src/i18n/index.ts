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

/** The phone's language when the game has it, English otherwise. Used until the player picks one. */
export const deviceLanguage = (): TLanguage => resolveLanguage(Localization.getLocales()[0]?.languageCode);

/** What the language button shows, each written in its own language. */
export const LANGUAGE_LABEL: Record<TLanguage, string> = { en: "EN", hy: "ՀԱՅ", ru: "РУ" };

/** The language button steps through the languages in order and wraps around. */
export const nextLanguage = (language: TLanguage): TLanguage =>
    SUPPORTED_LANGUAGES[(SUPPORTED_LANGUAGES.indexOf(language) + 1) % SUPPORTED_LANGUAGES.length];

// eslint-disable-next-line import/no-named-as-default-member -- i18next documents the default instance API
i18n.use(initReactI18next).init({
    resources: { en: { translation: en }, hy: { translation: hy }, ru: { translation: ru } },
    lng: deviceLanguage(),
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    returnNull: false,
    showSupportNotice: false,
});

export default i18n;
