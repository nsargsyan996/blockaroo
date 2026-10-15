import { TAdsService } from "./ads.type";

/**
 * Web build: there are no ads, and revive is unavailable. The native implementation lives in ads.native.ts and Metro
 * picks it automatically for iOS and Android.
 */
export const ads: TAdsService = {
    init: async () => undefined,
    isRewardedReady: () => false,
    showRewarded: async () => false,
    maybeShowInterstitial: async () => undefined,
    onRewardedReadyChange: () => () => undefined,
};
