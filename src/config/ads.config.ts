import Constants from "expo-constants";

/**
 * Ads follow Google Play Families and COPPA rules, since the game is made with kids in mind: every request is tagged
 * child-directed and under the age of consent, limited to G-rated content and non-personalized. Rewarded video is
 * opt-in only (the player taps "Watch a video"), banners sit outside the board, and full-screen ads only appear
 * between games.
 */
export interface TAdPacing {
    /** Never show an interstitial before this many finished games in a session. */
    interstitialAfterGames: number;
    /** Then at most once every this many finished games... */
    interstitialEveryGames: number;
    /** ...and never twice within this many milliseconds. */
    interstitialMinGapMs: number;
}

export const PRODUCTION_PACING: TAdPacing = {
    interstitialAfterGames: 2,
    interstitialEveryGames: 3,
    interstitialMinGapMs: 4 * 60 * 1000,
};

/** Development builds show interstitials every second game so the flow is easy to test. */
export const DEV_PACING: TAdPacing = {
    interstitialAfterGames: 0,
    interstitialEveryGames: 2,
    interstitialMinGapMs: 0,
};

export const ADS_CONFIG = {
    pacing: __DEV__ ? DEV_PACING : PRODUCTION_PACING,
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
    banner: {
        android: process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID ?? "",
        ios: process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS ?? "",
    },
};

/** Shared by every ad request. */
export const AD_REQUEST_OPTIONS = { requestNonPersonalizedAdsOnly: true } as const;
