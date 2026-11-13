const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// SVGs import as React components through react-native-svg-transformer (same setup as cex-mobile).
config.transformer.babelTransformerPath = require.resolve("react-native-svg-transformer/expo");
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== "svg");
config.resolver.sourceExts = [...config.resolver.sourceExts, "svg"];
// Zustand's ESM build reads `import.meta.env`, which breaks the classic-script web bundle, so Zustand alone resolves
// through "main" (CommonJS). Everything else keeps package exports: Expo SDK 58 imports subpaths such as
// "@expo/log-box/LogBox" that only exist there.
const resolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === "zustand" || moduleName.startsWith("zustand/")) {
        return context.resolveRequest({ ...context, unstable_enablePackageExports: false }, moduleName, platform);
    }
    return (resolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./src/app/global.css" });
