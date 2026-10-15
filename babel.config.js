// Production builds strip console.* (errors and warnings stay). NativeWind compiles `className` at build time.
// babel-preset-expo adds the Reanimated / Worklets plugin itself, so it is not listed here.
module.exports = function (api) {
    api.cache(true);
    return {
        presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"],
        plugins: [
            [
                "module-resolver",
                {
                    root: ["./"],
                    alias: {
                        "^@(app|assets|builder|component|config|container|engine|hooks|i18n|layout|modal|provider|service|store|theme|util|widget|test-utils)(/.*)?$":
                            "./src/\\1\\2",
                    },
                },
            ],
        ],
        env: {
            production: {
                plugins: [["transform-remove-console", { exclude: ["error", "warn"] }]],
            },
        },
    };
};
