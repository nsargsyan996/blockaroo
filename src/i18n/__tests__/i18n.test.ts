import { LANGUAGE_LABEL, nextLanguage, resolveLanguage, SUPPORTED_LANGUAGES } from "..";
import en from "../locales/en.json";
import hy from "../locales/hy.json";
import ru from "../locales/ru.json";

const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;

/** Every string's path, with plural forms folded together: Russian needs more of them than English. */
const keys = (value: object, prefix = ""): string[] => [
    ...new Set(
        Object.entries(value).flatMap(([key, child]) =>
            typeof child === "object" && child !== null
                ? keys(child, `${prefix}${key}.`)
                : [`${prefix}${key.replace(PLURAL_SUFFIX, "")}`]
        )
    ),
];

describe("languages", () => {
    it("steps through every language and wraps around", () => {
        expect(nextLanguage("en")).toBe("hy");
        expect(nextLanguage("hy")).toBe("ru");
        expect(nextLanguage("ru")).toBe("en");
    });

    it("falls back to English for languages the game doesn't have", () => {
        expect(resolveLanguage("ru")).toBe("ru");
        expect(resolveLanguage("de")).toBe("en");
        expect(resolveLanguage(null)).toBe("en");
    });

    it("has a button label for every language", () => {
        SUPPORTED_LANGUAGES.forEach((language) => expect(LANGUAGE_LABEL[language]).toBeTruthy());
    });

    it("translates every English string into Armenian and Russian", () => {
        expect(keys(hy).sort()).toEqual(keys(en).sort());
        expect(keys(ru).sort()).toEqual(keys(en).sort());
    });
});
