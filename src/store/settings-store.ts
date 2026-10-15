import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface SettingsStore {
    soundOn: boolean;
    hapticsOn: boolean;
    toggleSound: () => void;
    toggleHaptics: () => void;
}

const STORE_VERSION = 1;

export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set) => ({
            soundOn: true,
            hapticsOn: true,
            toggleSound: () => set((state) => ({ soundOn: !state.soundOn })),
            toggleHaptics: () => set((state) => ({ hapticsOn: !state.hapticsOn })),
        }),
        {
            name: "blockaroo-settings",
            storage: createJSONStorage(() => AsyncStorage),
            version: STORE_VERSION,
        }
    )
);
