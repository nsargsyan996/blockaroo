import { Platform } from "react-native";

import { useSettingsStore } from "@store";
import * as Haptics from "expo-haptics";

export type THaptic = "pickup" | "place" | "clear" | "big" | "invalid" | "gameover";

const run = (task: () => Promise<void>) => {
    if (Platform.OS === "web" || !useSettingsStore.getState().hapticsOn) return;
    task().catch(() => undefined);
};

export const haptic = (kind: THaptic) => {
    switch (kind) {
        case "pickup":
            return run(() => Haptics.selectionAsync());
        case "place":
            return run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
        case "clear":
            return run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
        case "big":
            return run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
        case "invalid":
            return run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
        case "gameover":
            return run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
    }
};
