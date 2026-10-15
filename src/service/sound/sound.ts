import { useSettingsStore } from "@store";
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from "expo-audio";

const SOURCES = {
    pickup: require("@assets/sounds/pickup.wav"),
    place: require("@assets/sounds/place.wav"),
    invalid: require("@assets/sounds/invalid.wav"),
    clear: require("@assets/sounds/clear.wav"),
    combo: require("@assets/sounds/combo.wav"),
    perfect: require("@assets/sounds/perfect.wav"),
    gameover: require("@assets/sounds/gameover.wav"),
    revive: require("@assets/sounds/revive.wav"),
    tap: require("@assets/sounds/tap.wav"),
} as const;

export type TSound = keyof typeof SOURCES;

const VOLUME: Partial<Record<TSound, number>> = { pickup: 0.5, tap: 0.6, place: 0.8 };

let players: Partial<Record<TSound, AudioPlayer>> | null = null;

/** Loads every effect once. Safe to call more than once. */
export const initSounds = async () => {
    if (players) return;
    try {
        // Respect the silent switch on iPhone: a kids' game should not blast sound in a quiet room.
        await setAudioModeAsync({ playsInSilentMode: false, interruptionMode: "mixWithOthers" });
    } catch {
        // Audio mode is optional; effects still play with the defaults.
    }
    players = {};
    for (const [name, source] of Object.entries(SOURCES) as [TSound, number][]) {
        const player = createAudioPlayer(source);
        player.volume = VOLUME[name] ?? 1;
        players[name] = player;
    }
};

export const playSound = (name: TSound) => {
    if (!useSettingsStore.getState().soundOn || !players) return;
    const player = players[name];
    if (!player) return;
    try {
        player.seekTo(0);
        player.play();
    } catch {
        // A failed effect must never break the game.
    }
};
