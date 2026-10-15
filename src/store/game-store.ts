import { createGame, isValidGameState, placePiece, revive, TGameState, TMoveEvent } from "@engine";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface TClearedBlock {
    index: number;
    color: number;
}

/** What the screen animates after a move. `id` changes on every move so effects re-run. */
export interface TLastMove extends TMoveEvent {
    id: number;
    clearedBlocks: TClearedBlock[];
}

interface GameStore {
    game: TGameState | null;
    best: number;
    /** Best score when the current game started, so the game-over card can say "New best!". */
    bestAtStart: number;
    gamesFinished: number;
    lastMove: TLastMove | null;
    reviveFlash: { id: number; blocks: TClearedBlock[] } | null;
    hasHydrated: boolean;
    startGame: (seed?: number) => void;
    place: (slot: number, row: number, col: number) => TLastMove | null;
    revive: () => boolean;
    abandonGame: () => void;
}

const STORE_VERSION = 1;
let moveId = 0;

export const useGameStore = create<GameStore>()(
    persist(
        (set, get) => ({
            game: null,
            best: 0,
            bestAtStart: 0,
            gamesFinished: 0,
            lastMove: null,
            reviveFlash: null,
            hasHydrated: false,

            startGame: (seed) =>
                set((state) => ({
                    game: createGame(seed),
                    bestAtStart: state.best,
                    lastMove: null,
                    reviveFlash: null,
                })),

            place: (slot, row, col) => {
                const { game, best, gamesFinished } = get();
                if (!game) return null;
                const piece = game.tray[slot];
                const result = placePiece(game, slot, row, col);
                if (!result || !piece) return null;

                // Colors of the cleared blocks, read before the clear so the burst animation matches them.
                const placed = new Set(result.event.placedCells);
                const clearedBlocks = result.event.clearedCells.map((index) => ({
                    index,
                    color: placed.has(index) ? piece.color : game.board[index],
                }));

                const lastMove: TLastMove = { ...result.event, id: ++moveId, clearedBlocks };
                set({
                    game: result.state,
                    best: Math.max(best, result.state.score),
                    gamesFinished: result.event.gameOver ? gamesFinished + 1 : gamesFinished,
                    lastMove,
                });
                return lastMove;
            },

            revive: () => {
                const { game, gamesFinished } = get();
                if (!game) return false;
                const result = revive(game);
                if (!result) return false;
                set({
                    game: result.state,
                    // A revived game is not finished yet, so it should not count toward the interstitial cadence.
                    gamesFinished: Math.max(0, gamesFinished - 1),
                    reviveFlash: {
                        id: ++moveId,
                        blocks: result.clearedCells.map((index) => ({ index, color: game.board[index] })),
                    },
                    lastMove: null,
                });
                return true;
            },

            abandonGame: () => set({ game: null, lastMove: null, reviveFlash: null }),
        }),
        {
            name: "blockaroo-game",
            storage: createJSONStorage(() => AsyncStorage),
            version: STORE_VERSION,
            partialize: (state) => ({
                game: state.game,
                best: state.best,
                bestAtStart: state.bestAtStart,
                gamesFinished: state.gamesFinished,
            }),
            merge: (persisted, current) => {
                const saved = (persisted ?? {}) as Partial<GameStore>;
                return {
                    ...current,
                    ...saved,
                    // A save from an older engine version is dropped instead of crashing the board.
                    game: isValidGameState(saved.game) ? saved.game : null,
                };
            },
            onRehydrateStorage: () => () => useGameStore.setState({ hasHydrated: true }),
        }
    )
);

export const selectCanContinue = (state: GameStore) => state.game?.status === "playing" && state.game.moves > 0;
