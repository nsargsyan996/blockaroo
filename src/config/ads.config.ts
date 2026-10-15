import Constants from "expo-constants";

/**
 * Ads in a children's game follow Google Play Families and COPPA rules: every request is tagged child-directed and
 * under the age of consent, limited to G-rated content and non-personalized. Rewarded video is only ever opt-in
 * (the player taps "Watch a video"); interstitials are rare and never interrupt a game in progress.
 */
export const ADS_CONFIG = {
    /** Never show an interstitial before this many finished games in a session. */
    interstitialAfterGames: 2,
    /** Then at most once every this many finished games... */
    interstitialEveryGames: 3,
    /** ...and never twice within this many milliseconds. */
    interstitialMinGapMs: 4 * 60 * 1000,
} as const;

export const IS_PRODUCTION_BUILD = Constants.expoConfig?.extra?.appVariant === "production" && !__DEV__;

/** Production ad unit IDs come from EAS environment variables (see .env.example). */
export const PRODUCTION_AD_UNITS = {
    rewarded: {
        android: process.env.EXPO_PUBLIC_ADMOB_REWARDED_ANDROID ?? "",
        ios: process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS ?? "",
    },
    interstitial: {
        android: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ANDROID ?? "",
        ios: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS ?? "",
    },
};
