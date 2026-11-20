import { boardFromArt } from "@test-utils";

import { CELL_COUNT, GEM_BLOCK_COLORS, LEVEL_COUNT } from "../constants";
import { TGameState, TLevel } from "../engine.type";
import {
    canRevive,
    createAdventureGame,
    goalProgress,
    isLevelComplete,
    isValidGameState,
    movesLeft,
    placePiece,
    revive,
    starsFor,
} from "../game";
import {
    buildLevel,
    difficultyForLevel,
    fillRatioFor,
    gemCountFor,
    gemTypesFor,
    getLevel,
    moveLimitFactorFor,
    scoreLevelGemsFor,
    scoreTargetFor,
} from "../levels";

const EMPTY_ROW = "........";

/** Row 0 holds seven blocks with a gem at column 0; dropping a dot at (0,7) clears it. */
const tinyLevel = (): TLevel => {
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
    const gems = new Array<number>(CELL_COUNT).fill(0);
    gems[0] = 2;
    gems[20] = 1;
    board[20] = GEM_BLOCK_COLORS[1];
    return {
        id: 1,
        board,
        gems,
        goals: [
            { kind: "gems", gem: 2, count: 1 },
            { kind: "gems", gem: 1, count: 1 },
        ],
        par: 4,
        moveLimit: 50,
        difficulty: 0,
    };
};

const withDot = (state: TGameState): TGameState => ({
    ...state,
    tray: [{ uid: 9, shapeId: "dot", color: 3 }, { uid: 10, shapeId: "dot", color: 3 }, null],
});

describe("adventure rules", () => {
    it("starts a level with its board, gems and goals", () => {
        const level = tinyLevel();
        const game = createAdventureGame(level, 1);
        expect(game.mode).toBe("adventure");
        expect(game.board).toEqual(level.board);
        expect(game.board).not.toBe(level.board);
        expect(game.adventure!.collected).toEqual([0, 0, 0, 0]);
        expect(isValidGameState(game)).toBe(true);
    });

    it("collects gems from cleared lines and tracks goal progress", () => {
        const game = withDot(createAdventureGame(tinyLevel(), 1));
        const result = placePiece(game, 0, 0, 7)!;
        expect(result.event.collectedGems).toEqual([{ index: 0, gem: 2 }]);
        expect(result.state.gems[0]).toBe(0);
        expect(result.state.adventure!.collected[2]).toBe(1);
        expect(goalProgress({ kind: "gems", gem: 2, count: 1 }, result.state)).toEqual({
            current: 1,
            target: 1,
            done: true,
        });
        expect(result.event.won).toBe(false);
        expect(result.state.status).toBe("playing");
    });

    it("wins the level once every goal is met and stops dealing", () => {
        const game = withDot(createAdventureGame(tinyLevel(), 1));
        const collectedAlready = {
            ...game,
            adventure: { ...game.adventure!, collected: [0, 1, 0, 0] },
            tray: [null, null, game.tray[0]],
        };
        const result = placePiece(collectedAlready, 2, 0, 7)!;
        expect(result.event.won).toBe(true);
        expect(result.event.dealt).toBe(false);
        expect(result.state.status).toBe("won");
        expect(placePiece(result.state, 0, 5, 5)).toBeNull();
    });

    it("completes score goals from the running score", () => {
        const state = {
            score: 900,
            adventure: {
                levelId: 5,
                goals: [{ kind: "score" as const, target: 800 }],
                collected: [0],
                par: 9,
                difficulty: 0,
            },
        };
        expect(isLevelComplete(state)).toBe(true);
        expect(isLevelComplete({ ...state, score: 100 })).toBe(false);
        expect(isLevelComplete({ score: 100000, adventure: null })).toBe(false);
    });

    it("never clears gem blocks on a revive", () => {
        const game = createAdventureGame(tinyLevel(), 1);
        const over: TGameState = { ...game, status: "over" };
        expect(canRevive(over)).toBe(true);
        const result = revive(over)!;
        expect(result.clearedCells).not.toContain(0);
        expect(result.state.board[0]).not.toBe(0);
        expect(result.state.gems[0]).toBe(2);
    });

    it("awards stars by moves against par", () => {
        expect(starsFor(8, 10)).toBe(3);
        expect(starsFor(14, 10)).toBe(2);
        expect(starsFor(16, 10)).toBe(1);
    });

    it("scales the 2-star band to the level's move limit", () => {
        expect(starsFor(10, 10, 20)).toBe(3);
        expect(starsFor(15, 10, 20)).toBe(2);
        expect(starsFor(16, 10, 20)).toBe(1);
    });

    it("ends the level when its moves run out", () => {
        const game = withDot(createAdventureGame(tinyLevel(), 1));
        const lastMove = { ...game, adventure: { ...game.adventure!, moveLimit: 1 } };
        expect(movesLeft(lastMove)).toBe(1);
        const result = placePiece(lastMove, 0, 4, 4)!;
        expect(result.event.won).toBe(false);
        expect(result.event.gameOver).toBe(true);
        expect(result.event.outOfMoves).toBe(true);
        expect(result.state.status).toBe("over");
        expect(movesLeft(result.state)).toBe(0);
    });

    it("still wins a level on its very last move", () => {
        const game = withDot(createAdventureGame(tinyLevel(), 1));
        const solo = {
            ...game,
            adventure: { ...game.adventure!, goals: [{ kind: "gems" as const, gem: 2, count: 1 }] },
        };
        const lastMove = { ...solo, adventure: { ...solo.adventure, moveLimit: 1 } };
        const result = placePiece(lastMove, 0, 0, 7)!;
        expect(result.event.won).toBe(true);
        expect(result.event.outOfMoves).toBe(false);
        expect(result.state.status).toBe("won");
    });

    it("gives a level that ran out of moves five more on a revive", () => {
        const game = withDot(createAdventureGame(tinyLevel(), 1));
        const over = placePiece({ ...game, adventure: { ...game.adventure!, moveLimit: 1 } }, 0, 4, 4)!.state;
        const result = revive(over)!;
        expect(result.state.status).toBe("playing");
        expect(movesLeft(result.state)).toBe(5);
    });

    it("plays saves from before move limits without one", () => {
        const game = createAdventureGame(tinyLevel(), 1);
        const old = { ...game, adventure: { ...game.adventure!, moveLimit: undefined } };
        expect(movesLeft(old)).toBeNull();
        expect(placePiece(withDot(old), 0, 4, 4)!.event.outOfMoves).toBe(false);
    });

    it("keeps classic saves free of gems", () => {
        expect(isValidGameState({ ...createAdventureGame(tinyLevel(), 1), adventure: null })).toBe(false);
    });
});

describe("levels", () => {
    it("builds every level deterministically", () => {
        expect(buildLevel(7)).toEqual(buildLevel(7));
        expect(getLevel(7)).toBe(getLevel(7));
        expect(() => buildLevel(0)).toThrow();
        expect(() => buildLevel(LEVEL_COUNT + 1)).toThrow();
    });

    it("gives every level reachable goals and no completed line at the start", () => {
        for (let id = 1; id <= LEVEL_COUNT; id++) {
            const level = getLevel(id);
            expect(level.goals.length).toBeGreaterThan(0);
            // Every level has gems to collect, score challenges included.
            expect(level.goals.some((goal) => goal.kind === "gems")).toBe(true);
            for (const goal of level.goals) {
                if (goal.kind === "gems") {
                    expect(level.gems.filter((gem) => gem === goal.gem)).toHaveLength(goal.count);
                } else {
                    expect(goal.target).toBeGreaterThan(0);
                }
            }
            // Three stars are always reachable within the move limit.
            expect(level.par).toBeLessThan(level.moveLimit);
            level.gems.forEach((gem, index) => {
                if (gem) expect(level.board[index]).toBe(GEM_BLOCK_COLORS[gem]);
            });
            for (let i = 0; i < 8; i++) {
                expect(level.board.slice(i * 8, i * 8 + 8).every(Boolean)).toBe(false);
                expect([0, 1, 2, 3, 4, 5, 6, 7].every((r) => level.board[r * 8 + i])).toBe(false);
            }
        }
    });

    it("gives early levels room and tightens the move limit later", () => {
        expect(moveLimitFactorFor(1, false)).toBe(1);
        expect(moveLimitFactorFor(40, false)).toBeCloseTo(0.5);
        expect(moveLimitFactorFor(1, true)).toBe(1.5);
        for (let id = 2; id <= LEVEL_COUNT; id++) {
            expect(moveLimitFactorFor(id, false)).toBeLessThanOrEqual(moveLimitFactorFor(id - 1, false));
            expect(moveLimitFactorFor(id, true)).toBeLessThanOrEqual(moveLimitFactorFor(id - 1, true));
        }
    });

    it("ramps up as levels go on", () => {
        expect(fillRatioFor(1)).toBeLessThan(fillRatioFor(30));
        expect(gemTypesFor(1)).toBe(1);
        expect(gemTypesFor(20)).toBe(3);
        expect(difficultyForLevel(1)).toBe(0);
        expect(difficultyForLevel(46)).toBeCloseTo(0.85);
        expect(getLevel(5).goals[0].kind).toBe("score");
        expect(scoreLevelGemsFor(5)).toBe(3);
        expect(scoreLevelGemsFor(100)).toBe(5);
        const scoreLevelGems = (id: number) => getLevel(id).gems.filter(Boolean).length;
        expect(scoreLevelGems(5)).toBe(3);
        expect(scoreLevelGems(60)).toBe(4);
    });

    it("keeps creeping up past level 60 without ever easing off", () => {
        expect(fillRatioFor(100)).toBeCloseTo(0.35);
        expect(gemCountFor(100)).toBe(11);
        expect(difficultyForLevel(100)).toBeCloseTo(1);
        expect(scoreTargetFor(100)).toBe(6950);
        expect(getLevel(100).goals[0]).toEqual({ kind: "score", target: 6950 });
        expect(getLevel(100).gems.filter(Boolean)).toHaveLength(5);
        for (let id = 2; id <= LEVEL_COUNT; id++) {
            expect(fillRatioFor(id)).toBeGreaterThanOrEqual(fillRatioFor(id - 1));
            expect(gemCountFor(id)).toBeGreaterThanOrEqual(gemCountFor(id - 1));
            expect(difficultyForLevel(id)).toBeGreaterThanOrEqual(difficultyForLevel(id - 1));
            expect(difficultyForLevel(id)).toBeLessThanOrEqual(1);
        }
    });
});
