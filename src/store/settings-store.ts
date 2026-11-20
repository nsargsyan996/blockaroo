import type { TLanguage } from "@i18n";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface SettingsStore {
    soundOn: boolean;
    hapticsOn: boolean;
    /** The language the player picked; null follows the phone's language. */
    language: TLanguage | null;
    /** The player has turned a piece once, so the "tap to turn" tip no longer shows. */
    turnTipSeen: boolean;
    /** When the app was first opened on this device; ads stay quiet for the first week after it. */
    firstOpenedAt: number | null;
    markFirstOpened: () => void;
    toggleSound: () => void;
    toggleHaptics: () => void;
    setLanguage: (language: TLanguage) => void;
    markTurnTipSeen: () => void;
}

const STORE_VERSION = 1;

export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set) => ({
            soundOn: true,
            hapticsOn: true,
            language: null,
            turnTipSeen: false,
            firstOpenedAt: null,
            markFirstOpened: () => set((state) => (state.firstOpenedAt === null ? { firstOpenedAt: Date.now() } : {})),
            toggleSound: () => set((state) => ({ soundOn: !state.soundOn })),
            toggleHaptics: () => set((state) => ({ hapticsOn: !state.hapticsOn })),
            setLanguage: (language) => set({ language }),
            markTurnTipSeen: () => set({ turnTipSeen: true }),
        }),
        {
            name: "blockaroo-settings",
            storage: createJSONStorage(() => AsyncStorage),
            version: STORE_VERSION,
            // Runs after saved settings load, so only a true first launch records a new date.
            onRehydrateStorage: () => (state) => state?.markFirstOpened(),
        }
    )
);
