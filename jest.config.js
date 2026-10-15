module.exports = {
    preset: "jest-expo",
    roots: ["<rootDir>/src"],
    testPathIgnorePatterns: ["/node_modules/", "/dist/"],
    transformIgnorePatterns: [
        "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|react-native-svg|nativewind|react-native-css-interop)",
    ],
    moduleNameMapper: {
        "\\.(css|less|scss|sass)$": "<rootDir>/src/test-utils/__mocks__/file-mock.js",
        "\\.(wav|mp3|png|jpg|ttf)$": "<rootDir>/src/test-utils/__mocks__/file-mock.js",
        "\\.svg$": "<rootDir>/src/test-utils/__mocks__/svg-mock.js",
        "^@react-native-async-storage/async-storage$": require.resolve(
            "@react-native-async-storage/async-storage/jest/async-storage-mock"
        ),
        "^react-native-google-mobile-ads$": "<rootDir>/src/test-utils/__mocks__/google-mobile-ads-mock.js",
        "^@test-utils$": "<rootDir>/src/test-utils/index.ts",
        "^@(app|assets|builder|component|config|container|engine|hooks|i18n|layout|modal|provider|service|store|theme|util|widget)(/.+)?$":
            "<rootDir>/src/$1$2",
    },
    setupFilesAfterEnv: ["react-native-gesture-handler/jestSetup", "<rootDir>/src/test-utils/jest-setup.ts"],
    collectCoverageFrom: [
        "src/engine/**/*.ts",
        "src/store/**/*.ts",
        "src/util/**/*.ts",
        "!src/**/*.d.ts",
        "!src/**/*.type.ts",
        "!src/**/index.ts",
    ],
    coverageReporters: ["text", "text-summary", "lcov"],
    coverageThreshold: {
        global: { statements: 90, branches: 80, functions: 90, lines: 90 },
    },
};
