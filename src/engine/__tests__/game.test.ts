import { boardFromArt } from "@test-utils";

import { findPlacements } from "../board";
import { MAX_REVIVES, TRAY_SIZE } from "../constants";
import { TGameState } from "../engine.type";
import {
    canPlacePiece,
    canRevive,
    createGame,
    isStuck,
    isValidGameState,
    placePiece,
    revive,
    reviveRows,
} from "../game";
import { getShape } from "../shapes";

const withTray = (state: TGameState, shapeIds: (string | null)[]): TGameState => ({
    ...state,
    tray: shapeIds.map((shapeId, index) => (shapeId ? { uid: 100 + index, shapeId, color: 2 } : null)),
});

describe("game", () => {
    it("starts with an empty board and a full tray", () => {
        const game = createGame(1);
        expect(game.status).toBe("playing");
        expect(game.score).toBe(0);
        expect(game.tray).toHaveLength(TRAY_SIZE);
        expect(game.tray.every(Boolean)).toBe(true);
        expect(new Set(game.tray.map((piece) => piece!.uid)).size).toBe(TRAY_SIZE);
        expect(isValidGameState(game)).toBe(true);
    });

    it("is deterministic for a seed", () => {
        expect(createGame(99)).toEqual(createGame(99));
    });

    it("rejects invalid moves", () => {
        const game = withTray(createGame(1), ["square3", "dot", "dot"]);
        expect(placePiece(game, 0, 6, 6)).toBeNull();
        expect(placePiece(withTray(game, [null, "dot", "dot"]), 0, 0, 0)).toBeNull();
        expect(canPlacePiece({ ...game, status: "over" }, 1, 0, 0)).toBe(false);
    });

    it("places a piece, scores its cells and empties its slot", () => {
        const game = withTray(createGame(1), ["square2", "dot", "dot"]);
        const result = placePiece(game, 0, 0, 0)!;
        expect(result.state.score).toBe(4);
        expect(result.state.tray[0]).toBeNull();
        expect(result.state.moves).toBe(1);
        expect(result.event).toMatchObject({ lines: 0, points: 4, dealt: false, gameOver: false });
    });

    it("deals a new tray after the last piece is placed", () => {
        const game = withTray(createGame(1), [null, null, "dot"]);
        const result = placePiece(game, 2, 4, 4)!;
        expect(result.event.dealt).toBe(true);
        expect(result.state.tray.every(Boolean)).toBe(true);
        expect(result.state.tray[0]!.uid).toBe(game.nextUid);
    });

    it("clears lines, builds a streak and awards a perfect clear", () => {
        const board = boardFromArt([
            "#######.",
            "........",
            "........",
            "........",
            "........",
            "........",
            "........",
            "........",
        ]);
        const game = withTray({ ...createGame(1), board }, ["dot", "dot", "dot"]);
        const result = placePiece(game, 0, 0, 7)!;
        expect(result.event.lines).toBe(1);
        expect(result.event.perfectClear).toBe(true);
        expect(result.event.combo).toBe(1);
        expect(result.state.score).toBe(1 + 80 + 500);
        expect(result.state.linesCleared).toBe(1);
    });

    it("ends the game when no remaining piece fits", () => {
        const board = boardFromArt([
            "#.#.#.#.",
            ".#.#.#.#",
            "#.#.#.#.",
            ".#.#.#.#",
            "#.#.#.#.",
            ".#.#.#.#",
            "#.#.#.#.",
            ".#.#.#..",
        ]);
        const game = withTray({ ...createGame(1), board }, ["dot", "bar2-h", null]);
        const result = placePiece(game, 0, 7, 7)!;
        expect(result.event.gameOver).toBe(true);
        expect(result.state.status).toBe("over");
        expect(isStuck(result.state.board, result.state.tray)).toBe(true);
    });

    it("revives once by clearing the most crowded rows", () => {
        const board = boardFromArt([
            "#.#.#.#.",
            "########",
            "#.#.#.#.",
            "#######.",
            "#.#.#.#.",
            "######..",
            "#.......",
            "........",
        ]);
        expect(reviveRows(board)).toEqual([1, 3, 5]);

        const over: TGameState = { ...createGame(1), board, status: "over", score: 1200, combo: 3 };
        expect(canRevive(over)).toBe(true);
        const result = revive(over)!;
        expect(result.clearedCells).toHaveLength(8 + 7 + 6);
        expect(result.state.status).toBe("playing");
        expect(result.state.score).toBe(1200);
        expect(result.state.combo).toBe(0);
        expect(result.state.revivesUsed).toBe(1);
        expect(result.state.tray.every((piece) => piece && getShape(piece.shapeId).tier < 3)).toBe(true);

        const spent = { ...result.state, status: "over" as const, revivesUsed: MAX_REVIVES };
        expect(canRevive(spent)).toBe(false);
        expect(revive(spent)).toBeNull();
        expect(revive(createGame(1))).toBeNull();
    });

    it("rejects saves from another version or with a broken shape", () => {
        expect(isValidGameState(null)).toBe(false);
        expect(isValidGameState({ ...createGame(1), version: 0 })).toBe(false);
        expect(isValidGameState({ ...createGame(1), board: [] })).toBe(false);
        expect(isValidGameState({ ...createGame(1), status: "paused" })).toBe(false);
    });

    it("plays hundreds of moves without dealing an impossible tray", () => {
        // A simple bot that always picks the first legal move. Every fresh tray must have a legal move.
        for (let seed = 1; seed <= 12; seed++) {
            let state = createGame(seed);
            let guard = 0;
            while (state.status === "playing" && guard++ < 400) {
                const slot = state.tray.findIndex(
                    (piece) => piece && findPlacements(state.board, getShape(piece.shapeId)).length > 0
                );
                expect(slot).toBeGreaterThanOrEqual(0);
                const [row, col] = findPlacements(state.board, getShape(state.tray[slot]!.shapeId))[0];
                const result = placePiece(state, slot, row, col)!;
                if (result.event.dealt && !result.event.gameOver) {
                    expect(isStuck(result.state.board, result.state.tray)).toBe(false);
                }
                state = result.state;
            }
            expect(state.moves).toBeGreaterThan(10);
        }
    });
});
