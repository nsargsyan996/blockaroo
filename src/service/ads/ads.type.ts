export interface TAdsService {
    /** Configures child-directed settings and starts loading ads. Never throws. */
    init: () => Promise<void>;
    isRewardedReady: () => boolean;
    /** Resolves true only if the player watched the video to the end and earned the reward. */
    showRewarded: () => Promise<boolean>;
    /** Shows an interstitial between games when the pacing rules in ADS_CONFIG allow it. */
    maybeShowInterstitial: (gamesFinished: number) => Promise<void>;
    /** Notifies when rewarded readiness changes, so the revive button can appear. Returns an unsubscribe. */
    onRewardedReadyChange: (listener: (ready: boolean) => void) => () => void;
}
