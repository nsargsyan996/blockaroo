import { ads as nativeAds } from "../ads.native";
import { ads as webAds } from "../ads.web";
import { shouldShowInterstitial } from "../interstitial-policy";

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

describe("web ads", () => {
    it("never offers a revive video", async () => {
        await webAds.init();
        expect(webAds.isRewardedReady()).toBe(false);
        await expect(webAds.showRewarded()).resolves.toBe(false);
        await expect(webAds.maybeShowInterstitial(10)).resolves.toBeUndefined();
        webAds.onRewardedReadyChange(() => undefined)();
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
