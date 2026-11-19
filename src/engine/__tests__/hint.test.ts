import { boardFromArt } from "@test-utils";

import { CELL_COUNT, HINTS_PER_GAME } from "../constants";
import { TGameState, TTray } from "../engine.type";
import { canPlacePiece, createGame } from "../game";
import { findHint, hintsLeft, takeHint } from "../hint";

const EMPTY_ROW = "........";
const noGems = () => new Array<number>(CELL_COUNT).fill(0);
const trayOf = (...ids: (string | null)[]): TTray =>
    ids.map((shapeId, index) => (shapeId ? { uid: index + 1, shapeId, color: 1 } : null));

describe("hint", () => {
    it("suggests the move that clears a line", () => {
        const board = boardFromArt([
            "#######.",
            EMPTY_ROW,
            EMPTY_ROW,
            EMPTY_ROW,
            EMPTY_ROW,
            EMPTY_ROW,
            EMPTY_ROW,
            EMPTY_ROW,
        ]);
        const hint = findHint({ board, gems: noGems(), tray: trayOf("square2", "dot", null) })!;
        expect(hint).toEqual({ slot: 1, row: 0, col: 7, cells: [7] });
    });

    it("prefers the line that holds a gem", () => {
        const board = boardFromArt([
            "#######.",
            EMPTY_ROW,
            EMPTY_ROW,
            EMPTY_ROW,
            EMPTY_ROW,
            EMPTY_ROW,
            EMPTY_ROW,
            ".#######",
        ]);
        const gems = noGems();
        gems[63] = 2;
        const hint = findHint({ board, gems, tray: trayOf("dot", null, null) })!;
        expect([hint.row, hint.col]).toEqual([7, 0]);
    });

    it("avoids a move that leaves no room for the other pieces", () => {
        // Only the 2x2 hole in the corner and a few single cells are free. Dropping the dot into the hole would lock
        // the square out, so the dot has to go to a single cell.
        const board = boardFromArt([
            "..######",
            "..######",
            "####.###",
            "########",
            "######.#",
            "########",
            "#.######",
            "########",
        ]);
        const hint = findHint({ board, gems: noGems(), tray: trayOf("dot", "square2", null) })!;
        const inHole = hint.row < 2 && hint.col < 2;
        expect(hint.slot === 1 || !inHole).toBe(true);
    });

    it("returns null when nothing fits", () => {
        const full = boardFromArt(new Array(8).fill("########"));
        expect(findHint({ board: full, gems: noGems(), tray: trayOf("dot", null, null) })).toBeNull();
    });

    it("always suggests a legal move", () => {
        for (let seed = 1; seed <= 20; seed++) {
            const game = createGame(seed);
            const hint = findHint(game)!;
            expect(canPlacePiece(game, hint.slot, hint.row, hint.col)).toBe(true);
        }
    });

    it("hands out a limited number of hints per game", () => {
        let game: TGameState = createGame(3);
        expect(hintsLeft(game)).toBe(HINTS_PER_GAME);
        for (let i = 0; i < HINTS_PER_GAME; i++) {
            const result = takeHint(game)!;
            expect(result.hint).toEqual(findHint(game));
            game = result.state;
        }
        expect(hintsLeft(game)).toBe(0);
        expect(takeHint(game)).toBeNull();
        expect(takeHint({ ...createGame(3), status: "over" })).toBeNull();
    });
});
