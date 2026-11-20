// SVG import settings for react-native-svg-transformer. Same as its defaults, plus `cleanupIds: false`.
// By default svgo renames every gradient and clip id to a, b, c... in each file, so all SVGs share the ids "a", "b".
// Natively each SVG is drawn on its own and that is fine, but on the web they all live in one document and url(#a)
// picks whichever "a" comes first: Roo's fur turned into the wordmark's gradient. The ids in src/assets/brand are
// already unique per gradient (rfur, wg-FF5F6D, ...), and files that share an id share the same definition.
module.exports = {
    svgoConfig: {
        plugins: [
            {
                name: "preset-default",
                params: {
                    overrides: {
                        inlineStyles: { onlyMatchedOnce: false },
                        removeViewBox: false,
                        removeUnknownsAndDefaults: false,
                        convertColors: false,
                        cleanupIds: false,
                    },
                },
            },
        ],
    },
};
