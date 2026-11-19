import type { ConfigContext, ExpoConfig } from "expo/config";

type TAppVariant = "development" | "preview" | "production";

const APP_VARIANT = (process.env.APP_VARIANT ?? "development") as TAppVariant;

const BUNDLE_ID: Record<TAppVariant, string> = {
    development: "com.hoppyblocks.game.dev",
    preview: "com.hoppyblocks.game.preview",
    production: "com.hoppyblocks.game",
};

const APP_NAME: Record<TAppVariant, string> = {
    development: "Hoppy Blocks (Dev)",
    preview: "Hoppy Blocks (Preview)",
    production: "Hoppy Blocks",
};

// Google's public sample app IDs. They only serve test ads, so every non-production build is safe to run.
const ADMOB_TEST_APP_ID = {
    android: "ca-app-pub-3940256099942544~3347511713",
    ios: "ca-app-pub-3940256099942544~1458002511",
};

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: APP_NAME[APP_VARIANT],
    owner: "nsargsyan",
    // The slug ties the app to its EAS project (extra.eas.projectId), so it keeps the original working name.
    slug: "blockaroo",
    scheme: "hoppyblocks",
    version: "1.0.1",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    userInterfaceStyle: "dark",
    backgroundColor: "#1438B8",
    ios: {
        bundleIdentifier: BUNDLE_ID[APP_VARIANT],
        supportsTablet: false,
        infoPlist: {
            ITSAppUsesNonExemptEncryption: false,
        },
    },
    android: {
        package: BUNDLE_ID[APP_VARIANT],
        adaptiveIcon: {
            foregroundImage: "./assets/images/adaptive-icon.png",
            // The art kit's adaptive background: a flat stage blue behind the full-body Roo.
            backgroundColor: "#2B5BE0",
        },
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
        "expo-asset",
        "expo-font",
        "expo-status-bar",
        "expo-localization",
        "expo-audio",
        [
            "expo-build-properties",
            {
                android: {
                    // R8 strips classes that libraries load by reflection (WorkManager's WorkDatabase_Impl, pulled in
                    // by the ads SDK), which crashed every release build on launch.
                    enableMinifyInReleaseBuilds: false,
                },
            },
        ],
        [
            "expo-splash-screen",
            {
                image: "./assets/images/splash-icon.png",
                imageWidth: 300,
                resizeMode: "contain",
                backgroundColor: "#1438B8",
                // Android clips the splash to a circle; this copy keeps Roo and the logo inside it.
                android: {
                    image: "./assets/images/splash-icon-android.png",
                    imageWidth: 340,
                },
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
        eas: {
            projectId: "b3678549-4900-4483-b266-09277f2b30b5",
        },
    },
});
