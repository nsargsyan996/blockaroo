import { findPlacements, getShape, LEVEL_COUNT } from "@engine";

import { selectActiveGame, selectCanContinueClassic, selectTotalStars, useGameStore } from "../game-store";
import { useSettingsStore } from "../settings-store";

const firstMove = () => {
    const game = selectActiveGame(useGameStore.getState())!;
    const slot = game.tray.findIndex((piece) => piece !== null);
    const [row, col] = findPlacements(game.board, getShape(game.tray[slot]!.shapeId))[0];
    return { slot, row, col };
};

const reset = () =>
    useGameStore.setState({
        activeMode: "classic",
        classic: null,
        adventure: null,
        best: 0,
        bestAtStart: 0,
        gamesFinished: 0,
        progress: { unlocked: 1, stars: {} },
        lastMove: null,
    });

describe("game store: classic", () => {
    beforeEach(reset);

    it("starts a game and records each move", () => {
        useGameStore.getState().startClassic(5);
        expect(selectCanContinueClassic(useGameStore.getState())).toBe(false);

        const { slot, row, col } = firstMove();
        const move = useGameStore.getState().place(slot, row, col);
        expect(move).not.toBeNull();
        expect(useGameStore.getState().classic!.moves).toBe(1);
        expect(useGameStore.getState().best).toBe(useGameStore.getState().classic!.score);
        expect(selectCanContinueClassic(useGameStore.getState())).toBe(true);
    });

    it("ignores invalid moves and moves without a game", () => {
        expect(useGameStore.getState().place(0, 0, 0)).toBeNull();
        expect(useGameStore.getState().revive()).toBe(false);
        useGameStore.getState().startClassic(5);
        expect(useGameStore.getState().place(0, 9, 9)).toBeNull();
    });

    it("keeps the colors of cleared blocks for the burst animation", () => {
        useGameStore.getState().startClassic(5);
        const game = useGameStore.getState().classic!;
        const board = game.board.map((_, index) => (index < 7 ? 4 : 0));
        useGameStore.setState({
            classic: { ...game, board, tray: [{ uid: 1, shapeId: "dot", color: 6 }, null, null] },
        });

        const move = useGameStore.getState().place(0, 0, 7)!;
        expect(move.lines).toBe(1);
        expect(move.clearedBlocks.find((block) => block.index === 0)!.color).toBe(4);
        expect(move.clearedBlocks.find((block) => block.index === 7)!.color).toBe(6);
    });

    it("revives a finished game once", () => {
        useGameStore.getState().startClassic(5);
        const game = useGameStore.getState().classic!;
        useGameStore.setState({ classic: { ...game, status: "over" }, gamesFinished: 1 });

        expect(useGameStore.getState().revive()).toBe(true);
        expect(useGameStore.getState().classic!.status).toBe("playing");
        expect(useGameStore.getState().gamesFinished).toBe(0);
        expect(useGameStore.getState().revive()).toBe(false);
    });

    it("switches back to a saved classic game", () => {
        useGameStore.getState().startClassic(5);
        useGameStore.getState().startLevel(1, 1);
        expect(useGameStore.getState().activeMode).toBe("adventure");
        useGameStore.getState().resumeClassic();
        expect(selectActiveGame(useGameStore.getState())).toBe(useGameStore.getState().classic);
    });
});

describe("game store: adventure", () => {
    beforeEach(reset);

    it("only starts unlocked levels", () => {
        useGameStore.getState().startLevel(9, 1);
        expect(useGameStore.getState().adventure!.adventure!.levelId).toBe(1);
    });

    it("records stars and unlocks the next level on a win, without touching the classic best", () => {
        useGameStore.getState().startLevel(1, 1);
        const game = useGameStore.getState().adventure!;
        const board = game.board.map(() => 0);
        const gems = game.gems.map(() => 0);
        for (let i = 0; i < 7; i++) board[i] = 3;
        gems[0] = 1;
        useGameStore.setState({
            adventure: {
                ...game,
                board,
                gems,
                adventure: { ...game.adventure!, goals: [{ kind: "gems", gem: 1, count: 1 }] },
                tray: [{ uid: 1, shapeId: "dot", color: 2 }, null, null],
            },
        });

        const move = useGameStore.getState().place(0, 0, 7)!;
        expect(move.won).toBe(true);
        expect(move.stars).toBe(3);
        expect(move.clearedBlocks.find((block) => block.index === 0)!.gem).toBe(1);
        const state = useGameStore.getState();
        expect(state.progress).toEqual({ unlocked: 2, stars: { 1: 3 } });
        expect(selectTotalStars(state)).toBe(3);
        expect(state.best).toBe(0);
        expect(state.gamesFinished).toBe(1);
    });

    it("never unlocks past the last level", () => {
        useGameStore.setState({ progress: { unlocked: LEVEL_COUNT, stars: {} } });
        useGameStore.getState().startLevel(LEVEL_COUNT + 5, 1);
        expect(useGameStore.getState().adventure!.adventure!.levelId).toBe(LEVEL_COUNT);
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
