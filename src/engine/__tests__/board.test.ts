import { boardFromArt, boardToArt } from "@test-utils";

import {
    canFitAnywhere,
    canPlace,
    createBoard,
    filledCount,
    findFullLines,
    findPlacements,
    isBoardEmpty,
    lineCells,
    placeShape,
    previewClears,
} from "../board";
import { getShape } from "../shapes";

describe("board", () => {
    it("creates an empty 8x8 board", () => {
        const board = createBoard();
        expect(board).toHaveLength(64);
        expect(isBoardEmpty(board)).toBe(true);
    });

    it("rejects placements that go off the board or overlap blocks", () => {
        const board = boardFromArt([
            "#.......",
            "........",
            "........",
            "........",
            "........",
            "........",
            "........",
            "........",
        ]);
        const bar = getShape("bar3-h");
        expect(canPlace(board, bar, 0, 0)).toBe(false);
        expect(canPlace(board, bar, 0, 1)).toBe(true);
        expect(canPlace(board, bar, 0, 6)).toBe(false);
        expect(canPlace(board, bar, -1, 0)).toBe(false);
        expect(canPlace(board, bar, 8, 0)).toBe(false);
    });

    it("finds every placement of a shape", () => {
        expect(findPlacements(createBoard(), getShape("square3"))).toHaveLength(36);
        expect(findPlacements(createBoard(), getShape("dot"))).toHaveLength(64);
    });

    it("clears a completed row and column at the same time", () => {
        const board = boardFromArt([
            "#######.",
            ".......#",
            ".......#",
            ".......#",
            ".......#",
            ".......#",
            ".......#",
            "........",
        ]);
        const dot = getShape("dot");
        const blocked = placeShape(board, dot, 0, 7, 3);
        expect(blocked.clearedRows).toEqual([0]);
        expect(blocked.clearedCols).toEqual([]);

        const result = placeShape(placeShape(board, dot, 7, 7, 3).board, dot, 0, 7, 3);
        expect(result.clearedRows).toEqual([0]);
        expect(result.clearedCols).toEqual([7]);
        expect(result.clearedCells).toHaveLength(15);
        expect(isBoardEmpty(result.board)).toBe(true);
    });

    it("keeps the color of placed blocks that do not clear", () => {
        const { board, placedCells } = placeShape(createBoard(), getShape("square2"), 3, 3, 5);
        expect(placedCells).toEqual([27, 28, 35, 36]);
        expect(board[27]).toBe(5);
        expect(filledCount(board)).toBe(4);
    });

    it("previews the lines a placement would clear without changing the board", () => {
        const board = boardFromArt([
            "####....",
            "........",
            "........",
            "........",
            "........",
            "........",
            "........",
            "........",
        ]);
        const preview = previewClears(board, getShape("bar4-h"), 0, 4);
        expect(preview.rows).toEqual([0]);
        expect(preview.cells).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
        expect(filledCount(board)).toBe(4);
    });

    it("reports full lines and their cells without duplicates", () => {
        expect(findFullLines(createBoard())).toEqual({ rows: [], cols: [] });
        expect(lineCells([0], [0])).toHaveLength(15);
    });

    it("knows when a shape cannot fit anywhere", () => {
        const board = boardFromArt([
            "#.#.#.#.",
            ".#.#.#.#",
            "#.#.#.#.",
            ".#.#.#.#",
            "#.#.#.#.",
            ".#.#.#.#",
            "#.#.#.#.",
            ".#.#.#.#",
        ]);
        expect(canFitAnywhere(board, getShape("bar2-h"))).toBe(false);
        expect(canFitAnywhere(board, getShape("dot"))).toBe(true);
        expect(boardToArt(board)[0]).toBe("#.#.#.#.");
    });
});
