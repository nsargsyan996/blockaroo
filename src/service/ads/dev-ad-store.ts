import { create } from "zustand";

export type TDevAdKind = "rewarded" | "interstitial";

interface DevAdStore {
    kind: TDevAdKind | null;
    resolve: ((earned: boolean) => void) | null;
    show: (kind: TDevAdKind) => Promise<boolean>;
    finish: (earned: boolean) => void;
}

/**
 * Stand-in ads for the web development build, so the ad flows (revive video, between-game ad) can be tried in a
 * browser. The overlay that draws them is DevAdOverlay; production web builds never use this.
 */
export const useDevAdStore = create<DevAdStore>((set, get) => ({
    kind: null,
    resolve: null,
    show: (kind) => new Promise<boolean>((resolve) => set({ kind, resolve })),
    finish: (earned) => {
        get().resolve?.(earned);
        set({ kind: null, resolve: null });
    },
}));
