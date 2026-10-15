import type { ConfigContext, ExpoConfig } from "expo/config";

type TAppVariant = "development" | "preview" | "production";

const APP_VARIANT = (process.env.APP_VARIANT ?? "development") as TAppVariant;

const BUNDLE_ID: Record<TAppVariant, string> = {
    development: "com.blockaroo.game.dev",
    preview: "com.blockaroo.game.preview",
    production: "com.blockaroo.game",
};

const APP_NAME: Record<TAppVariant, string> = {
    development: "Blockaroo (Dev)",
    preview: "Blockaroo (Preview)",
    production: "Blockaroo",
};

// Google's public sample app IDs. They only serve test ads, so every non-production build is safe to run.
const ADMOB_TEST_APP_ID = {
    android: "ca-app-pub-3940256099942544~3347511713",
    ios: "ca-app-pub-3940256099942544~1458002511",
};

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: APP_NAME[APP_VARIANT],
    slug: "blockaroo",
    scheme: "blockaroo",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    backgroundColor: "#6FD3FF",
    ios: {
        bundleIdentifier: BUNDLE_ID[APP_VARIANT],
        supportsTablet: true,
        infoPlist: {
            ITSAppUsesNonExemptEncryption: false,
        },
    },
    android: {
        package: BUNDLE_ID[APP_VARIANT],
        adaptiveIcon: {
            foregroundImage: "./assets/images/adaptive-icon.png",
            backgroundColor: "#6FD3FF",
        },
        edgeToEdgeEnabled: true,
        // A kids' game has no reason to ask for the advertising ID; the ads SDK still works without it.
        blockedPermissions: ["com.google.android.gms.permission.AD_ID"],
    },
    web: {
        favicon: "./assets/images/favicon.png",
        bundler: "metro",
        output: "single",
    },
    plugins: [
        "expo-router",
        "expo-localization",
        "expo-audio",
        [
            "expo-splash-screen",
            {
                image: "./assets/images/splash-icon.png",
                imageWidth: 220,
                resizeMode: "contain",
                backgroundColor: "#6FD3FF",
            },
        ],
        [
            "react-native-google-mobile-ads",
            {
                androidAppId: process.env.ADMOB_ANDROID_APP_ID || ADMOB_TEST_APP_ID.android,
                iosAppId: process.env.ADMOB_IOS_APP_ID || ADMOB_TEST_APP_ID.ios,
                // Child-directed apps must not show the iOS tracking prompt or use the IDFA.
                userTrackingUsageDescription: undefined,
                delayAppMeasurementInit: true,
            },
        ],
    ],
    experiments: {
        typedRoutes: true,
    },
    extra: {
        appVariant: APP_VARIANT,
    },
});
