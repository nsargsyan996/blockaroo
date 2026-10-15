import { findPlacements, getShape } from "@engine";

import { selectCanContinue, useGameStore } from "../game-store";
import { useSettingsStore } from "../settings-store";

const firstMove = () => {
    const game = useGameStore.getState().game!;
    const slot = game.tray.findIndex((piece) => piece !== null);
    const [row, col] = findPlacements(game.board, getShape(game.tray[slot]!.shapeId))[0];
    return { slot, row, col };
};

describe("game store", () => {
    beforeEach(() => {
        useGameStore.setState({ game: null, best: 0, bestAtStart: 0, gamesFinished: 0, lastMove: null });
    });

    it("starts a game and records each move", () => {
        useGameStore.getState().startGame(5);
        expect(selectCanContinue(useGameStore.getState())).toBe(false);

        const { slot, row, col } = firstMove();
        const move = useGameStore.getState().place(slot, row, col);
        expect(move).not.toBeNull();
        expect(move!.id).toBeGreaterThan(0);
        expect(useGameStore.getState().game!.moves).toBe(1);
        expect(useGameStore.getState().best).toBe(useGameStore.getState().game!.score);
        expect(selectCanContinue(useGameStore.getState())).toBe(true);
    });

    it("ignores invalid moves and moves without a game", () => {
        expect(useGameStore.getState().place(0, 0, 0)).toBeNull();
        useGameStore.getState().startGame(5);
        expect(useGameStore.getState().place(0, 9, 9)).toBeNull();
    });

    it("keeps the colors of cleared blocks for the burst animation", () => {
        useGameStore.getState().startGame(5);
        const game = useGameStore.getState().game!;
        const board = game.board.map((_, index) => (index < 7 ? 4 : 0));
        useGameStore.setState({ game: { ...game, board, tray: [{ uid: 1, shapeId: "dot", color: 6 }, null, null] } });

        const move = useGameStore.getState().place(0, 0, 7)!;
        expect(move.lines).toBe(1);
        expect(move.clearedBlocks.find((block) => block.index === 0)!.color).toBe(4);
        expect(move.clearedBlocks.find((block) => block.index === 7)!.color).toBe(6);
    });

    it("revives a finished game once and can abandon a game", () => {
        useGameStore.getState().startGame(5);
        const game = useGameStore.getState().game!;
        useGameStore.setState({ game: { ...game, status: "over" }, gamesFinished: 1 });

        expect(useGameStore.getState().revive()).toBe(true);
        expect(useGameStore.getState().game!.status).toBe("playing");
        expect(useGameStore.getState().gamesFinished).toBe(0);
        expect(useGameStore.getState().revive()).toBe(false);

        useGameStore.getState().abandonGame();
        expect(useGameStore.getState().game).toBeNull();
        expect(useGameStore.getState().revive()).toBe(false);
    });
});

describe("settings store", () => {
    it("toggles sound and vibration", () => {
        const { toggleSound, toggleHaptics } = useSettingsStore.getState();
        toggleSound();
        expect(useSettingsStore.getState().soundOn).toBe(false);
        toggleHaptics();
        expect(useSettingsStore.getState().hapticsOn).toBe(false);
    });
});
