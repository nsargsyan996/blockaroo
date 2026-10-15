import {
    createAdventureGame,
    createGame,
    getLevel,
    isValidGameState,
    LEVEL_COUNT,
    placePiece,
    revive,
    starsFor,
    TGameMode,
    TGameState,
    TMoveEvent,
} from "@engine";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface TClearedBlock {
    index: number;
    color: number;
    gem: number;
}

/** What the screen animates after a move. `id` changes on every move so effects re-run. */
export interface TLastMove extends TMoveEvent {
    id: number;
    clearedBlocks: TClearedBlock[];
    /** Adventure: stars earned when this move won the level. */
    stars: number;
    /** Color of the piece that was placed, for the landing effect. */
    pieceColor: number;
}

export interface TAdventureProgress {
    /** Highest level that can be played. */
    unlocked: number;
    /** Best stars per level id. */
    stars: Record<number, number>;
}

interface GameStore {
    activeMode: TGameMode;
    classic: TGameState | null;
    adventure: TGameState | null;
    best: number;
    /** Best classic score when the current classic game started, so the result card can say "New best!". */
    bestAtStart: number;
    gamesFinished: number;
    progress: TAdventureProgress;
    lastMove: TLastMove | null;
    reviveFlash: { id: number; blocks: TClearedBlock[] } | null;
    hasHydrated: boolean;
    startClassic: (seed?: number) => void;
    resumeClassic: () => void;
    startLevel: (levelId: number, seed?: number) => void;
    place: (slot: number, row: number, col: number) => TLastMove | null;
    revive: () => boolean;
}

const STORE_VERSION = 2;
let moveId = 0;

const resetEffects = { lastMove: null, reviveFlash: null } as const;

export const useGameStore = create<GameStore>()(
    persist(
        (set, get) => ({
            activeMode: "classic",
            classic: null,
            adventure: null,
            best: 0,
            bestAtStart: 0,
            gamesFinished: 0,
            progress: { unlocked: 1, stars: {} },
            lastMove: null,
            reviveFlash: null,
            hasHydrated: false,

            startClassic: (seed) =>
                set((state) => ({
                    activeMode: "classic",
                    classic: createGame(seed),
                    bestAtStart: state.best,
                    ...resetEffects,
                })),

            resumeClassic: () => set({ activeMode: "classic", ...resetEffects }),

            startLevel: (levelId, seed) => {
                const id = Math.max(1, Math.min(levelId, get().progress.unlocked, LEVEL_COUNT));
                set({ activeMode: "adventure", adventure: createAdventureGame(getLevel(id), seed), ...resetEffects });
            },

            place: (slot, row, col) => {
                const state = get();
                const mode = state.activeMode;
                const game = state[mode];
                if (!game) return null;
                const piece = game.tray[slot];
                const result = placePiece(game, slot, row, col);
                if (!result || !piece) return null;

                // Colors and gems of the cleared blocks, read before the clear so the burst matches them.
                const placed = new Set(result.event.placedCells);
                const clearedBlocks = result.event.clearedCells.map((index) => ({
                    index,
                    color: placed.has(index) ? piece.color : game.board[index],
                    gem: game.gems[index],
                }));

                const finished = result.event.gameOver || result.event.won;
                const level = result.state.adventure;
                const stars = result.event.won && level ? starsFor(result.state.moves, level.par) : 0;
                const lastMove: TLastMove = {
                    ...result.event,
                    id: ++moveId,
                    clearedBlocks,
                    stars,
                    pieceColor: piece.color,
                };

                const progress =
                    result.event.won && level
                        ? {
                              unlocked: Math.min(LEVEL_COUNT, Math.max(state.progress.unlocked, level.levelId + 1)),
                              stars: {
                                  ...state.progress.stars,
                                  [level.levelId]: Math.max(state.progress.stars[level.levelId] ?? 0, stars),
                              },
                          }
                        : state.progress;

                set({
                    [mode]: result.state,
                    best: mode === "classic" ? Math.max(state.best, result.state.score) : state.best,
                    gamesFinished: finished ? state.gamesFinished + 1 : state.gamesFinished,
                    progress,
                    lastMove,
                });
                return lastMove;
            },

            revive: () => {
                const state = get();
                const game = state[state.activeMode];
                if (!game) return false;
                const result = revive(game);
                if (!result) return false;
                set({
                    [state.activeMode]: result.state,
                    // A revived game is not finished yet, so it should not count toward the interstitial cadence.
                    gamesFinished: Math.max(0, state.gamesFinished - 1),
                    reviveFlash: {
                        id: ++moveId,
                        blocks: result.clearedCells.map((index) => ({ index, color: game.board[index], gem: 0 })),
                    },
                    lastMove: null,
                });
                return true;
            },
        }),
        {
            name: "blockaroo-game",
            storage: createJSONStorage(() => AsyncStorage),
            version: STORE_VERSION,
            partialize: (state) => ({
                activeMode: state.activeMode,
                classic: state.classic,
                adventure: state.adventure,
                best: state.best,
                bestAtStart: state.bestAtStart,
                gamesFinished: state.gamesFinished,
                progress: state.progress,
            }),
            // Version 1 saves had a single classic game; keep the best score and drop the rest.
            migrate: (persisted, version) => {
                const saved = (persisted ?? {}) as Partial<GameStore>;
                return version < STORE_VERSION ? { best: saved.best ?? 0 } : saved;
            },
            merge: (persisted, current) => {
                const saved = (persisted ?? {}) as Partial<GameStore>;
                return {
                    ...current,
                    ...saved,
                    // A save from an older engine version is dropped instead of crashing the board.
                    classic: isValidGameState(saved.classic) ? saved.classic : null,
                    adventure: isValidGameState(saved.adventure) ? saved.adventure : null,
                    progress: saved.progress ?? current.progress,
                };
            },
            onRehydrateStorage: () => () => useGameStore.setState({ hasHydrated: true }),
        }
    )
);

export const selectActiveGame = (state: GameStore) => state[state.activeMode];

export const selectCanContinueClassic = (state: GameStore) =>
    state.classic?.status === "playing" && state.classic.moves > 0;

export const selectTotalStars = (state: GameStore) =>
    Object.values(state.progress.stars).reduce((sum, stars) => sum + stars, 0);
