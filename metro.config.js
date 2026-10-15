const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// SVGs import as React components through react-native-svg-transformer (same setup as cex-mobile).
config.transformer.babelTransformerPath = require.resolve("react-native-svg-transformer/expo");
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== "svg");
config.resolver.sourceExts = [...config.resolver.sourceExts, "svg"];
// Resolve packages through "main" (CommonJS) like cex-mobile does. Zustand's ESM build reads `import.meta.env`,
// which breaks the classic-script web bundle.
config.resolver.unstable_enablePackageExports = false;

module.exports = withNativeWind(config, { input: "./src/app/global.css" });
