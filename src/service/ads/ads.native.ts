import { Platform } from "react-native";

import { AD_REQUEST_OPTIONS, IS_PRODUCTION_BUILD, PRODUCTION_AD_UNITS } from "@config";

import { TAdsService } from "./ads.type";
import { shouldShowInterstitial } from "./interstitial-policy";

type TMobileAdsModule = typeof import("react-native-google-mobile-ads");
type TRewardedAd = ReturnType<TMobileAdsModule["RewardedAd"]["createForAdRequest"]>;
type TInterstitialAd = ReturnType<TMobileAdsModule["InterstitialAd"]["createForAdRequest"]>;

// Expo Go does not include the ads SDK. Loading it lazily keeps the game playable there, just without ads.
export const loadAdsModule = (): TMobileAdsModule | null => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy on purpose, see above
        return require("react-native-google-mobile-ads") as TMobileAdsModule;
    } catch {
        return null;
    }
};

const RETRY_MS = 30_000;

let sdk: TMobileAdsModule | null = null;
let rewarded: TRewardedAd | null = null;
let interstitial: TInterstitialAd | null = null;
let rewardedReady = false;
let interstitialReady = false;
let lastInterstitialAt: number | null = null;
const readyListeners = new Set<(ready: boolean) => void>();

const setRewardedReady = (ready: boolean) => {
    rewardedReady = ready;
    readyListeners.forEach((listener) => listener(ready));
};

/** Google's test units everywhere except a production build that has real IDs configured. */
export const adUnitId = (module: TMobileAdsModule, kind: "rewarded" | "interstitial" | "banner") => {
    const production = PRODUCTION_AD_UNITS[kind][Platform.OS === "ios" ? "ios" : "android"];
    if (IS_PRODUCTION_BUILD && production) return production;
    return {
        rewarded: module.TestIds.REWARDED,
        interstitial: module.TestIds.INTERSTITIAL,
        banner: module.TestIds.ADAPTIVE_BANNER,
    }[kind];
};

const unitId = (kind: "rewarded" | "interstitial") => (sdk ? adUnitId(sdk, kind) : "");

const loadRewarded = () => {
    if (!sdk) return;
    setRewardedReady(false);
    rewarded = sdk.RewardedAd.createForAdRequest(unitId("rewarded"), AD_REQUEST_OPTIONS);
    rewarded.addAdEventListener(sdk.RewardedAdEventType.LOADED, () => setRewardedReady(true));
    rewarded.addAdEventListener(sdk.AdEventType.ERROR, () => {
        setRewardedReady(false);
        setTimeout(loadRewarded, RETRY_MS);
    });
    rewarded.load();
};

const loadInterstitial = () => {
    if (!sdk) return;
    interstitialReady = false;
    interstitial = sdk.InterstitialAd.createForAdRequest(unitId("interstitial"), AD_REQUEST_OPTIONS);
    interstitial.addAdEventListener(sdk.AdEventType.LOADED, () => {
        interstitialReady = true;
    });
    interstitial.addAdEventListener(sdk.AdEventType.ERROR, () => {
        interstitialReady = false;
        setTimeout(loadInterstitial, RETRY_MS);
    });
    interstitial.load();
};

export const ads: TAdsService = {
    init: async () => {
        if (sdk) return;
        sdk = loadAdsModule();
        if (!sdk) return;
        try {
            const mobileAds = sdk.default();
            await mobileAds.setRequestConfiguration({
                tagForChildDirectedTreatment: true,
                tagForUnderAgeOfConsent: true,
                maxAdContentRating: sdk.MaxAdContentRating.G,
            });
            await mobileAds.initialize();
            loadRewarded();
            loadInterstitial();
        } catch {
            sdk = null;
        }
    },

    isRewardedReady: () => rewardedReady,

    showRewarded: () =>
        new Promise<boolean>((resolve) => {
            const ad = rewarded;
            if (!sdk || !ad || !rewardedReady) {
                resolve(false);
                return;
            }
            let earned = false;
            const unsubscribers = [
                ad.addAdEventListener(sdk.RewardedAdEventType.EARNED_REWARD, () => {
                    earned = true;
                }),
                ad.addAdEventListener(sdk.AdEventType.CLOSED, () => {
                    unsubscribers.forEach((unsubscribe) => unsubscribe());
                    resolve(earned);
                    loadRewarded();
                }),
            ];
            setRewardedReady(false);
            ad.show().catch(() => {
                unsubscribers.forEach((unsubscribe) => unsubscribe());
                resolve(false);
                loadRewarded();
            });
        }),

    maybeShowInterstitial: async (gamesFinished) => {
        const ad = interstitial;
        if (!sdk || !ad || !interstitialReady) return;
        if (!shouldShowInterstitial({ gamesFinished, lastShownAt: lastInterstitialAt, now: Date.now() })) return;
        const closed = new Promise<void>((resolve) => {
            const unsubscribe = ad.addAdEventListener(sdk!.AdEventType.CLOSED, () => {
                unsubscribe();
                resolve();
            });
        });
        try {
            lastInterstitialAt = Date.now();
            interstitialReady = false;
            await ad.show();
            await closed;
        } catch {
            // Showing failed; carry on to the next game.
        } finally {
            loadInterstitial();
        }
    },

    onRewardedReadyChange: (listener) => {
        readyListeners.add(listener);
        return () => readyListeners.delete(listener);
    },
};
