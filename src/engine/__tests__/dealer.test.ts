import { boardFromArt } from "@test-utils";

import { createBoard } from "../board";
import { canPlaceAll, dealShapes, difficultyFor, helpChance, helpfulShapes, tierWeights } from "../dealer";
import { createRng } from "../rng";
import { getShape, SHAPES } from "../shapes";

const CROWDED = ["##.#####", "#.######", "########", "####.###", "########", "##.#####", "#####.##", "######.#"];

describe("dealer", () => {
    it("ramps difficulty with score", () => {
        expect(difficultyFor(0)).toBe(0);
        expect(difficultyFor(100000)).toBe(1);
        expect(tierWeights(0)[1]).toBeGreaterThan(tierWeights(1)[1]);
        expect(tierWeights(0)[3]).toBeLessThan(tierWeights(1)[3]);
        expect(helpChance(0)).toBeGreaterThan(helpChance(1));
    });

    it("detects sets that can and cannot all be placed", () => {
        const board = boardFromArt(CROWDED);
        expect(canPlaceAll(board, [getShape("dot"), getShape("dot"), getShape("dot")])).toBe(true);
        expect(canPlaceAll(board, [getShape("square2")])).toBe(false);
        expect(canPlaceAll(createBoard(), [getShape("square3"), getShape("square3"), getShape("square3")])).toBe(true);
    });

    it("counts line clears when checking a set", () => {
        // The bar fills row 0, which clears and makes room for the second bar.
        const board = boardFromArt([
            "...#####",
            "########",
            "########",
            "########",
            "########",
            "########",
            "########",
            "########",
        ]);
        expect(canPlaceAll(board, [getShape("bar3-h"), getShape("bar3-h")])).toBe(true);
    });

    it("gives up when the search budget runs out", () => {
        expect(canPlaceAll(createBoard(), [getShape("dot"), getShape("dot")], { left: 1 })).toBe(false);
    });

    it("finds pieces that would clear a line", () => {
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
        const ids = helpfulShapes(board).map((shape) => shape.id);
        expect(ids).toContain("dot");
        expect(ids).toContain("bar2-v");
        expect(ids).not.toContain("bar2-h");
        expect(helpfulShapes(createBoard())).toHaveLength(0);
    });

    it("always deals a set that fits on an empty board", () => {
        for (let seed = 0; seed < 50; seed++) {
            const shapes = dealShapes(createBoard(), createRng(seed), { score: 0 });
            expect(shapes).toHaveLength(3);
            expect(canPlaceAll(createBoard(), shapes)).toBe(true);
        }
    });

    it("deals only small and medium pieces when friendly", () => {
        for (let seed = 0; seed < 50; seed++) {
            const shapes = dealShapes(createBoard(), createRng(seed), { score: 9999, friendly: true });
            expect(shapes.every((shape) => shape.tier < 3)).toBe(true);
        }
    });

    it("deals placeable pieces on a crowded board", () => {
        const board = boardFromArt(CROWDED);
        for (let seed = 0; seed < 20; seed++) {
            const shapes = dealShapes(board, createRng(seed), { score: 5000 });
            expect(canPlaceAll(board, shapes)).toBe(true);
        }
    });

    it("still deals three pieces when nothing fits", () => {
        const full = boardFromArt(new Array(8).fill("########"));
        const shapes = dealShapes(full, createRng(3), { score: 0 });
        expect(shapes).toHaveLength(3);
        expect(SHAPES).toEqual(expect.arrayContaining(shapes));
    });
});
