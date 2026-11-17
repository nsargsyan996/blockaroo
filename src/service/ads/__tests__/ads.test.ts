import { DEV_PACING, PRODUCTION_PACING } from "@config";

import { ads as nativeAds, pickAdUnit } from "../ads.native";
import { ads as webAds } from "../ads.web";
import { useDevAdStore } from "../dev-ad-store";
import { isQuietPeriod, shouldShowInterstitial as policy } from "../interstitial-policy";

const shouldShowInterstitial = (args: { gamesFinished: number; lastShownAt: number | null; now: number }) =>
    policy({ ...args, pacing: PRODUCTION_PACING });

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("interstitial pacing", () => {
    it("waits for the first games, then shows every third finished game", () => {
        const now = 10_000_000;
        expect(shouldShowInterstitial({ gamesFinished: 1, lastShownAt: null, now })).toBe(false);
        expect(shouldShowInterstitial({ gamesFinished: 2, lastShownAt: null, now })).toBe(false);
        expect(shouldShowInterstitial({ gamesFinished: 4, lastShownAt: null, now })).toBe(false);
        expect(shouldShowInterstitial({ gamesFinished: 5, lastShownAt: null, now })).toBe(true);
        expect(shouldShowInterstitial({ gamesFinished: 8, lastShownAt: null, now })).toBe(true);
    });

    it("never shows two interstitials close together", () => {
        const now = 10_000_000;
        expect(shouldShowInterstitial({ gamesFinished: 5, lastShownAt: now - 60_000, now })).toBe(false);
        expect(shouldShowInterstitial({ gamesFinished: 5, lastShownAt: now - 10 * 60_000, now })).toBe(true);
    });
});

describe("quiet first week", () => {
    const day = 24 * 60 * 60 * 1000;
    const firstOpenedAt = 50 * day;

    it("keeps banners and interstitials off for the first seven days after install", () => {
        const quiet = (now: number) => isQuietPeriod({ firstOpenedAt, now, pacing: PRODUCTION_PACING });
        expect(quiet(firstOpenedAt)).toBe(true);
        expect(quiet(firstOpenedAt + 7 * day - 1)).toBe(true);
        expect(quiet(firstOpenedAt + 7 * day)).toBe(false);
    });

    it("stays quiet until the first launch is recorded", () => {
        expect(isQuietPeriod({ firstOpenedAt: null, now: day, pacing: PRODUCTION_PACING })).toBe(true);
    });

    it("is off in development so ads are easy to test", () => {
        expect(isQuietPeriod({ firstOpenedAt: null, now: day, pacing: DEV_PACING })).toBe(false);
    });
});

describe("dev pacing", () => {
    it("shows an interstitial every second game for testing", () => {
        expect(policy({ gamesFinished: 1, lastShownAt: null, now: 0, pacing: DEV_PACING })).toBe(false);
        expect(policy({ gamesFinished: 2, lastShownAt: 0, now: 0, pacing: DEV_PACING })).toBe(true);
    });
});

describe("web test ads", () => {
    it("plays a stand-in rewarded video in development", async () => {
        await webAds.init();
        expect(webAds.isRewardedReady()).toBe(true);
        const shown = webAds.showRewarded();
        expect(useDevAdStore.getState().kind).toBe("rewarded");
        useDevAdStore.getState().finish(true);
        await expect(shown).resolves.toBe(true);
        webAds.onRewardedReadyChange(() => undefined)();
    });

    it("shows a stand-in interstitial only when pacing allows", async () => {
        await webAds.maybeShowInterstitial(1);
        expect(useDevAdStore.getState().kind).toBeNull();
        const shown = webAds.maybeShowInterstitial(2);
        expect(useDevAdStore.getState().kind).toBe("interstitial");
        useDevAdStore.getState().finish(false);
        await expect(shown).resolves.toBeUndefined();
    });
});

describe("native ads", () => {
    it("tags requests as child-directed and reports a loaded rewarded video", async () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- same module instance the service loads lazily
        const sdk = require("react-native-google-mobile-ads");
        const listener = jest.fn();
        nativeAds.onRewardedReadyChange(listener);
        await nativeAds.init();
        await flush();

        const rewarded = sdk.RewardedAd.createForAdRequest.mock.results[0].value;
        expect(sdk.RewardedAd.createForAdRequest).toHaveBeenCalledWith("test-rewarded", {
            requestNonPersonalizedAdsOnly: true,
        });
        expect(nativeAds.isRewardedReady()).toBe(false);

        rewarded.emit(sdk.RewardedAdEventType.LOADED);
        expect(nativeAds.isRewardedReady()).toBe(true);
        expect(listener).toHaveBeenLastCalledWith(true);

        const shown = nativeAds.showRewarded();
        rewarded.emit(sdk.RewardedAdEventType.EARNED_REWARD);
        rewarded.emit(sdk.AdEventType.CLOSED);
        await expect(shown).resolves.toBe(true);
    });

    it("does not reward a video that was closed early", async () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- same module instance the service loads lazily
        const sdk = require("react-native-google-mobile-ads");
        const rewarded = sdk.RewardedAd.createForAdRequest.mock.results.at(-1).value;
        rewarded.emit(sdk.RewardedAdEventType.LOADED);
        const shown = nativeAds.showRewarded();
        rewarded.emit(sdk.AdEventType.CLOSED);
        await expect(shown).resolves.toBe(false);
    });
});

describe("ad unit choice", () => {
    it("uses test units outside production builds", () => {
        expect(pickAdUnit({ production: "real", test: "test", isProductionBuild: false })).toBe("test");
    });

    it("uses the real unit in a production build", () => {
        expect(pickAdUnit({ production: "real", test: "test", isProductionBuild: true })).toBe("real");
    });

    it("shows no ads in a production build without real IDs, never test ads", () => {
        expect(pickAdUnit({ production: "", test: "test", isProductionBuild: true })).toBeNull();
    });
});
