import { boardFromArt } from "@test-utils";

import { canFitAnywhere } from "../board";
import { MAX_RESCUES, ROTATIONS_PER_GAME } from "../constants";
import { TGameState } from "../engine.type";
import { canFitWithTurns, canRotatePiece, createGame, isStuck, placePiece, rotatePiece, rotationsLeft } from "../game";
import { findHint, takeHint } from "../hint";
import { getShape, isRotationSymmetric, rotatedShapeId, SHAPES, shapeTurns } from "../shapes";

const withTray = (state: TGameState, shapeIds: (string | null)[]): TGameState => ({
    ...state,
    tray: shapeIds.map((shapeId, index) => (shapeId ? { uid: 100 + index, shapeId, color: 2 } : null)),
});

/** Only a 1x3 vertical gap in the top-left corner is free. */
const VERTICAL_SLOT = [".#######", ".#######", ".#######", "########", "########", "########", "########", "########"];

describe("shape rotation", () => {
    it("turns every shape into another shape of the same size and tier", () => {
        for (const shape of SHAPES) {
            const turned = getShape(rotatedShapeId(shape.id));
            expect(turned.size).toBe(shape.size);
            expect(turned.tier).toBe(shape.tier);
            expect([turned.rows, turned.cols]).toEqual([shape.cols, shape.rows]);
        }
    });

    it("comes back to the same shape after four quarter turns", () => {
        for (const shape of SHAPES) {
            let id = shape.id;
            for (let i = 0; i < 4; i++) id = rotatedShapeId(id);
            expect(id).toBe(shape.id);
        }
    });

    it("turns clockwise", () => {
        expect(rotatedShapeId("bar3-h")).toBe("bar3-v");
        expect(rotatedShapeId("corner-tl")).toBe("corner-tr");
        expect(rotatedShapeId("t-up")).toBe("t-right");
        expect(rotatedShapeId("l-0")).toBe("l-90");
    });

    it("knows which shapes look the same when turned", () => {
        expect(SHAPES.filter((shape) => isRotationSymmetric(shape.id)).map((shape) => shape.id)).toEqual([
            "dot",
            "square2",
            "square3",
        ]);
        expect(shapeTurns("dot")).toEqual(["dot"]);
        expect(shapeTurns("bar2-h")).toEqual(["bar2-h", "bar2-v"]);
        expect(shapeTurns("l-0")).toEqual(["l-0", "l-90", "l-180", "l-270"]);
    });
});

describe("rotating tray pieces", () => {
    it("turns a piece, keeps its uid and color, and spends a turn without counting a move", () => {
        const game = withTray(createGame(1), ["bar3-h", "dot", "l-0"]);
        const turned = rotatePiece(game, 0)!;
        expect(turned.tray[0]).toEqual({ uid: 100, shapeId: "bar3-v", color: 2 });
        expect(turned.tray[1]).toBe(game.tray[1]);
        expect(rotationsLeft(turned)).toBe(ROTATIONS_PER_GAME - 1);
        expect(turned.moves).toBe(game.moves);
    });

    it("allows a limited number of turns per game", () => {
        let game: TGameState = withTray(createGame(1), ["l-0", null, null]);
        for (let i = 0; i < ROTATIONS_PER_GAME; i++) game = rotatePiece(game, 0)!;
        expect(rotationsLeft(game)).toBe(0);
        expect(canRotatePiece(game, 0)).toBe(false);
        expect(rotatePiece(game, 0)).toBeNull();
    });

    it("does not spend a turn on a piece that looks the same turned, an empty slot, or a finished game", () => {
        const game = withTray(createGame(1), ["square2", null, "bar2-h"]);
        expect(rotatePiece(game, 0)).toBeNull();
        expect(rotatePiece(game, 1)).toBeNull();
        expect(rotatePiece({ ...game, status: "over" }, 2)).toBeNull();
        expect(canRotatePiece(game, 2)).toBe(true);
    });

    it("treats saves from before rotation as having every turn left", () => {
        const old: TGameState = createGame(1);
        expect(old.rotationsUsed).toBeUndefined();
        expect(rotationsLeft(old)).toBe(ROTATIONS_PER_GAME);
    });
});

/**
 * VERTICAL_SLOT plus three single cells at the bottom right. Dropping a dot on 7,7 completes no line (6,7 and 7,6
 * stay open), and afterwards only bar3-v fits: in the vertical gap.
 */
const SLOT_AND_HOLES = [...VERTICAL_SLOT.slice(0, 6), "#######.", "######.."];

describe("game over with turns left", () => {
    it("counts a piece that fits once turned", () => {
        const board = boardFromArt(VERTICAL_SLOT);
        expect(canFitAnywhere(board, getShape("bar3-h"))).toBe(false);
        expect(canFitWithTurns(board, "bar3-h", 0)).toBe(false);
        expect(canFitWithTurns(board, "bar3-h", 1)).toBe(true);
        expect(isStuck(board, withTray(createGame(1), ["bar3-h", null, null]).tray, 0)).toBe(true);
        expect(isStuck(board, withTray(createGame(1), ["bar3-h", null, null]).tray, 1)).toBe(false);
    });

    it("keeps the game going while a turn would make a piece fit", () => {
        const board = boardFromArt(SLOT_AND_HOLES);
        const game = withTray({ ...createGame(1), board, rescuesUsed: MAX_RESCUES }, ["dot", "bar3-h", null]);
        const result = placePiece(game, 0, 7, 7)!;
        expect(result.event.gameOver).toBe(false);
        expect(result.state.status).toBe("playing");

        const turned = rotatePiece(result.state, 1)!;
        expect(placePiece(turned, 1, 0, 0)).not.toBeNull();
    });

    it("ends the game when no turns are left to make a piece fit", () => {
        const board = boardFromArt(SLOT_AND_HOLES);
        const game = withTray(
            { ...createGame(1), board, rescuesUsed: MAX_RESCUES, rotationsUsed: ROTATIONS_PER_GAME },
            ["dot", "bar3-h", null]
        );
        expect(placePiece(game, 0, 7, 7)!.state.status).toBe("over");
    });
});

describe("hints that turn a piece", () => {
    it("turn the piece when that is the only way to place it", () => {
        const board = boardFromArt(VERTICAL_SLOT);
        const game = withTray({ ...createGame(1), board }, ["bar3-h", null, null]);
        expect(findHint(game)).toBeNull();
        expect(findHint(game, 1)).toMatchObject({ slot: 0, row: 0, col: 0, turns: 1 });

        const { state, hint } = takeHint(game)!;
        expect(hint.turns).toBe(1);
        expect(state.tray[0]!.shapeId).toBe("bar3-v");
        expect(rotationsLeft(state)).toBe(ROTATIONS_PER_GAME - 1);
        expect(placePiece(state, hint.slot, hint.row, hint.col)).not.toBeNull();
    });

    it("prefer a move without turning when there is a safe one", () => {
        for (let seed = 1; seed <= 10; seed++) {
            const game = createGame(seed);
            expect(findHint(game, ROTATIONS_PER_GAME)!.turns).toBe(0);
        }
    });

    it("do not turn pieces once the game's turns are spent", () => {
        const board = boardFromArt(VERTICAL_SLOT);
        const game = withTray({ ...createGame(1), board, rotationsUsed: ROTATIONS_PER_GAME }, ["bar3-h", null, null]);
        expect(takeHint(game)).toBeNull();
    });
});
