import { cn, formatScore, praiseFor } from "@util";

describe("util", () => {
    it("formats scores with thousands separators", () => {
        expect(formatScore(0)).toBe("0");
        expect(formatScore(999)).toBe("999");
        expect(formatScore(1234567)).toBe("1,234,567");
    });

    it("merges class names and resolves Tailwind conflicts", () => {
        expect(cn("p-2", false && "hidden", "p-4")).toBe("p-4");
    });

    it("cheers louder for bigger clears", () => {
        expect(praiseFor({ lines: 0, combo: 0, perfectClear: false })).toBeNull();
        expect(praiseFor({ lines: 1, combo: 1, perfectClear: false })).toBe("good");
        expect(praiseFor({ lines: 2, combo: 1, perfectClear: false })).toBe("great");
        expect(praiseFor({ lines: 1, combo: 3, perfectClear: false })).toBe("excellent");
        expect(praiseFor({ lines: 3, combo: 2, perfectClear: false })).toBe("amazing");
        expect(praiseFor({ lines: 3, combo: 4, perfectClear: false })).toBe("unbelievable");
        expect(praiseFor({ lines: 1, combo: 1, perfectClear: true })).toBe("perfect");
    });
});

describe("resolveDropTarget", () => {
    // Imported here so the engine dependency stays out of the simple helpers above.
    const { createBoard, getShape } = jest.requireActual("@engine");
    const { resolveDropTarget } = jest.requireActual("@util");

    it("lands on the nearest cell", () => {
        expect(resolveDropTarget(createBoard(), getShape("square2"), 2.2, 3.1, 0.7)).toEqual({ row: 3, col: 2 });
    });

    it("snaps a slightly-off drop to the nearest valid spot", () => {
        const board = createBoard();
        board[3 * 8 + 2] = 1;
        expect(resolveDropTarget(board, getShape("dot"), 2.1, 3.4, 0.7)).toEqual({ row: 4, col: 2 });
    });

    it("rejects drops off the board or too far from a valid spot", () => {
        expect(resolveDropTarget(createBoard(), getShape("square2"), 7.4, 2, 0.7)).toBeNull();
        expect(resolveDropTarget(createBoard(), getShape("dot"), -3, -3, 0.7)).toBeNull();
    });
});
