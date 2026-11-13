import { memo, useMemo, useState } from "react";
import { View } from "react-native";

import { AD_REQUEST_OPTIONS } from "@config";
import { adUnitId, loadAdsModule } from "@service/ads/ads.native";
import { isQuietPeriod } from "@service/ads/interstitial-policy";
import { useSettingsStore } from "@store";

/**
 * Anchored banner (child-directed settings come from MobileAds init). Renders nothing in Expo Go, where the ads SDK
 * is missing, during a new player's quiet first week, and collapses if no ad fills so it never leaves an empty gap.
 */
export const AdBanner = memo(function AdBanner() {
    const sdk = useMemo(loadAdsModule, []);
    const [failed, setFailed] = useState(false);
    const firstOpenedAt = useSettingsStore((state) => state.firstOpenedAt);
    if (!sdk || failed || isQuietPeriod({ firstOpenedAt, now: Date.now() })) return null;
    const { BannerAd, BannerAdSize } = sdk;
    return (
        <View className="w-full items-center" accessibilityLabel="Advertisement">
            <BannerAd
                unitId={adUnitId(sdk, "banner")}
                size={BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER}
                requestOptions={AD_REQUEST_OPTIONS}
                onAdFailedToLoad={() => setFailed(true)}
            />
        </View>
    );
});
