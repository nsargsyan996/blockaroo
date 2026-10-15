import { TAdsService } from "./ads.type";
import { useDevAdStore } from "./dev-ad-store";
import { shouldShowInterstitial } from "./interstitial-policy";

/**
 * Web build. There are no real ads on the web; in development, labelled test ads stand in for them so the revive and
 * between-game flows can be tried in a browser. The native implementation lives in ads.native.ts and Metro picks it
 * automatically for iOS and Android (TypeScript type-checks against it via moduleSuffixes).
 */
let lastInterstitialAt: number | null = null;

export const ads: TAdsService = {
    init: async () => undefined,
    isRewardedReady: () => __DEV__,
    showRewarded: async () => (__DEV__ ? useDevAdStore.getState().show("rewarded") : false),
    maybeShowInterstitial: async (gamesFinished) => {
        if (!__DEV__) return;
        if (!shouldShowInterstitial({ gamesFinished, lastShownAt: lastInterstitialAt, now: Date.now() })) return;
        lastInterstitialAt = Date.now();
        await useDevAdStore.getState().show("interstitial");
    },
    onRewardedReadyChange: () => () => undefined,
};
