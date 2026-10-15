import { ADS_CONFIG, TAdPacing } from "@config";

/** Pure pacing rule for between-game interstitials, kept separate so it can be unit tested. */
export const shouldShowInterstitial = ({
    gamesFinished,
    lastShownAt,
    now,
    pacing = ADS_CONFIG.pacing,
}: {
    gamesFinished: number;
    lastShownAt: number | null;
    now: number;
    pacing?: TAdPacing;
}) => {
    if (gamesFinished <= pacing.interstitialAfterGames) return false;
    if ((gamesFinished - pacing.interstitialAfterGames) % pacing.interstitialEveryGames !== 0) return false;
    return lastShownAt === null || now - lastShownAt >= pacing.interstitialMinGapMs;
};
