import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface SettingsStore {
    soundOn: boolean;
    hapticsOn: boolean;
    /** When the app was first opened on this device; ads stay quiet for the first week after it. */
    firstOpenedAt: number | null;
    markFirstOpened: () => void;
    toggleSound: () => void;
    toggleHaptics: () => void;
}

const STORE_VERSION = 1;

export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set) => ({
            soundOn: true,
            hapticsOn: true,
            firstOpenedAt: null,
            markFirstOpened: () => set((state) => (state.firstOpenedAt === null ? { firstOpenedAt: Date.now() } : {})),
            toggleSound: () => set((state) => ({ soundOn: !state.soundOn })),
            toggleHaptics: () => set((state) => ({ hapticsOn: !state.hapticsOn })),
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
