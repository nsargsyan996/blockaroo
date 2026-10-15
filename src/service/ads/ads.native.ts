import { Platform } from "react-native";

import { IS_PRODUCTION_BUILD, PRODUCTION_AD_UNITS } from "@config";

import { TAdsService } from "./ads.type";
import { shouldShowInterstitial } from "./interstitial-policy";

type TMobileAdsModule = typeof import("react-native-google-mobile-ads");
type TRewardedAd = ReturnType<TMobileAdsModule["RewardedAd"]["createForAdRequest"]>;
type TInterstitialAd = ReturnType<TMobileAdsModule["InterstitialAd"]["createForAdRequest"]>;

// Expo Go does not include the ads SDK. Loading it lazily keeps the game playable there, just without ads.
const loadModule = (): TMobileAdsModule | null => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy on purpose, see above
        return require("react-native-google-mobile-ads") as TMobileAdsModule;
    } catch {
        return null;
    }
};

const RETRY_MS = 30_000;
const REQUEST_OPTIONS = { requestNonPersonalizedAdsOnly: true } as const;

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

const unitId = (kind: "rewarded" | "interstitial") => {
    if (!sdk) return "";
    const production = PRODUCTION_AD_UNITS[kind][Platform.OS === "ios" ? "ios" : "android"];
    if (IS_PRODUCTION_BUILD && production) return production;
    return kind === "rewarded" ? sdk.TestIds.REWARDED : sdk.TestIds.INTERSTITIAL;
};

const loadRewarded = () => {
    if (!sdk) return;
    setRewardedReady(false);
    rewarded = sdk.RewardedAd.createForAdRequest(unitId("rewarded"), REQUEST_OPTIONS);
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
    interstitial = sdk.InterstitialAd.createForAdRequest(unitId("interstitial"), REQUEST_OPTIONS);
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
        sdk = loadModule();
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
