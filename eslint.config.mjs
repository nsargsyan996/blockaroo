import expoConfig from "eslint-config-expo/flat.js";
import prettierConfig from "eslint-config-prettier";
import { defineConfig } from "eslint/config";

export default defineConfig([
    expoConfig,
    prettierConfig,
    {
        files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
        rules: {
            semi: ["error", "always"],
            quotes: ["error", "double", { avoidEscape: true }],
        },
    },
    {
        files: ["**/*.ts", "**/*.tsx"],
        rules: {
            "@typescript-eslint/array-type": ["error", { default: "array" }],
        },
    },
    {
        files: ["**/*.test.ts", "**/*.test.tsx", "src/test-utils/**"],
        languageOptions: {
            globals: {
                jest: "readonly",
                describe: "readonly",
                it: "readonly",
                expect: "readonly",
                beforeEach: "readonly",
            },
        },
    },
    {
        files: ["*.config.js", "*.config.mjs", "scripts/**"],
        languageOptions: {
            globals: { __dirname: "readonly", require: "readonly", module: "writable", process: "readonly" },
        },
    },
    {
        ignores: [".expo", "dist", "web-build", "coverage", "node_modules", "ios", "android"],
    },
]);
