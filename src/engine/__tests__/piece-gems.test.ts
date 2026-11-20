import { boardFromArt } from "@test-utils";

import { CELL_COUNT, GEM_BLOCK_COLORS, PIECE_GEM_CHANCE } from "../constants";
import { TGameState, TLevel } from "../engine.type";
import { createAdventureGame, createGame, neededGems, placePiece, rotatePiece } from "../game";
import { getLevel } from "../levels";

const EMPTY_ROW = "........";

/** Row 0 holds seven blocks; the gem goal asks for one diamond (gem 1), none on the board yet. */
const level = (): TLevel => ({
    id: 1,
    board: boardFromArt(["#######.", ...new Array(7).fill(EMPTY_ROW)]),
    gems: new Array<number>(CELL_COUNT).fill(0),
    goals: [{ kind: "gems", gem: 1, count: 1 }],
    par: 4,
    moveLimit: 50,
    difficulty: 0,
});

const withTray = (state: TGameState, tray: TGameState["tray"]): TGameState => ({ ...state, tray });

describe("gems on dealt pieces", () => {
    it("only offers gem types whose goals are still open", () => {
        const game = createAdventureGame(getLevel(21), 1);
        const open = game.adventure!.goals.flatMap((goal) => (goal.kind === "gems" ? [goal.gem] : []));
        expect(open.length).toBeGreaterThan(0);
        expect(neededGems(game.adventure)).toEqual(open);
        const done = { ...game.adventure!, collected: [0, 99, 99, 99] };
        expect(neededGems(done)).toEqual([]);
        expect(neededGems(null)).toEqual([]);
    });

    it("never deals gems in classic mode", () => {
        for (let seed = 1; seed <= 50; seed += 1) {
            expect(createGame(seed).tray.every((piece) => !piece?.gem)).toBe(true);
        }
    });

    it("deals gem pieces in adventure at roughly the configured rate, colored like gem blocks", () => {
        let pieces = 0;
        let withGem = 0;
        for (let seed = 1; seed <= 400; seed += 1) {
            for (const piece of createAdventureGame(getLevel(21), seed).tray) {
                if (!piece) continue;
                pieces += 1;
                if (piece.gem) {
                    withGem += 1;
                    expect(piece.color).toBe(GEM_BLOCK_COLORS[piece.gem.gem]);
                }
            }
        }
        expect(withGem / pieces).toBeGreaterThan(PIECE_GEM_CHANCE * 0.6);
        expect(withGem / pieces).toBeLessThan(PIECE_GEM_CHANCE * 1.4);
    });

    it("drops the gem on the board where the piece lands", () => {
        const game = withTray(createAdventureGame(level(), 1), [
            { uid: 1, shapeId: "bar2-h", color: 1, gem: { gem: 1, cell: [0, 1] } },
            { uid: 2, shapeId: "dot", color: 3 },
            null,
        ]);
        const result = placePiece(game, 0, 4, 2)!;
        expect(result.state.gems[4 * 8 + 3]).toBe(1);
        expect(result.state.gems[4 * 8 + 2]).toBe(0);
        expect(result.event.collectedGems).toEqual([]);
    });

    it("collects a gem at once when its own placement clears the line", () => {
        const game = withTray(createAdventureGame(level(), 1), [
            { uid: 1, shapeId: "dot", color: 1, gem: { gem: 1, cell: [0, 0] } },
            { uid: 2, shapeId: "dot", color: 3 },
            null,
        ]);
        const result = placePiece(game, 0, 0, 7)!;
        expect(result.event.collectedGems).toEqual([{ index: 7, gem: 1 }]);
        expect(result.state.adventure!.collected[1]).toBe(1);
        expect(result.state.gems[7]).toBe(0);
        expect(result.event.won).toBe(true);
    });

    it("turns the gem with the piece", () => {
        // bar2-h is "##"; a quarter turn makes it bar2-v, and the right cell (0,1) becomes the bottom one (1,0).
        const game = withTray(createAdventureGame(level(), 1), [
            { uid: 1, shapeId: "bar2-h", color: 1, gem: { gem: 1, cell: [0, 1] } },
            { uid: 2, shapeId: "dot", color: 3 },
            null,
        ]);
        const turned = rotatePiece(game, 0)!;
        expect(turned.tray[0]).toMatchObject({ shapeId: "bar2-v", gem: { gem: 1, cell: [1, 0] } });
    });
});
