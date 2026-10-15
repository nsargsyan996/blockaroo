import { ADS_CONFIG } from "@config";

/** Pure pacing rule for between-game interstitials, kept separate so it can be unit tested. */
export const shouldShowInterstitial = ({
    gamesFinished,
    lastShownAt,
    now,
}: {
    gamesFinished: number;
    lastShownAt: number | null;
    now: number;
}) => {
    if (gamesFinished <= ADS_CONFIG.interstitialAfterGames) return false;
    if ((gamesFinished - ADS_CONFIG.interstitialAfterGames) % ADS_CONFIG.interstitialEveryGames !== 0) return false;
    return lastShownAt === null || now - lastShownAt >= ADS_CONFIG.interstitialMinGapMs;
};
