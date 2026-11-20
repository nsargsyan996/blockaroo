import { cellIndex, createBoard, findFullLines, findPlacements } from "./board";
import { BOARD_SIZE, COLOR_COUNT, GEM_BLOCK_COLORS, LEVEL_COUNT } from "./constants";
import { TBoard, TGem, TLevel, TLevelGoal } from "./engine.type";
import { createRng, pickWeighted } from "./rng";
import { SHAPES } from "./shapes";

/**
 * Adventure levels are generated from the level number, so they are identical on every device and need no data
 * file. Most levels hide gems inside the starting blocks and ask the player to collect them by clearing their lines;
 * every fifth level is a score challenge that also hides a few gems. Boards get fuller and pieces bigger as levels go
 * on. The curves flatten around level 60 and then creep up only a little, so later levels stay fresh without turning
 * into a wall.
 */

const SCORE_LEVEL_EVERY = 5;

const isScoreLevel = (id: number) => id % SCORE_LEVEL_EVERY === 0;

/** How far past level 60 a level is; the late-game creep is keyed off this. */
const late = (id: number) => Math.max(0, id - 60);

/** Share of the board filled at the start: 0.33 by level 20, then up to 0.35 by level 100. */
export const fillRatioFor = (id: number) => Math.min(0.33, 0.15 + 0.009 * id) + late(id) * 0.0005;

/** Gems to collect: 11 by level 28, then one more every twenty levels past 60, up to 13. */
export const gemCountFor = (id: number) =>
    Math.min(11, 4 + Math.floor(id / 4)) + Math.min(2, Math.floor(late(id) / 20));

export const gemTypesFor = (id: number) => (id < 4 ? 1 : id < 12 ? 2 : 3);

/** Dealer difficulty: 0.65 by level 50, then up to 0.8 by level 100. Adventure never reaches the classic maximum. */
export const difficultyForLevel = (id: number) => Math.min(0.65, (id - 1) / 75) + Math.min(0.15, late(id) * 0.00375);

/** Linear ramp from `from` at level `a` to `to` at level `b`, flat outside. */
const ramp = (id: number, a: number, from: number, b: number, to: number) =>
    from + (to - from) * Math.min(1, Math.max(0, (id - a) / (b - a)));

/**
 * Moves a level allows, as a multiple of the effort its goals take (`effort`, the old 3-star par). Roomy on the first
 * ten levels while players learn, then tightening until level 40 and a little more by level 100. Score levels get
 * more room because points need many placements, not just the right ones. Tuned with the level bench.
 */
export const moveLimitFactorFor = (id: number, scoreLevel: boolean) =>
    scoreLevel
        ? id <= 40
            ? ramp(id, 10, 1.5, 40, 0.95)
            : ramp(id, 40, 0.95, 100, 0.8)
        : id <= 40
          ? ramp(id, 10, 1.0, 40, 0.58)
          : ramp(id, 40, 0.58, 100, 0.56);

/** Three stars take at most this share of the move limit. */
const PAR_SHARE = 0.7;

/** Points to reach on a score level. */
export const scoreTargetFor = (id: number) => 450 + id * 65;

/** Gems a score level also hides: 3, then 4 from level 40 and 5 from level 80. Few enough to stay a side goal. */
export const scoreLevelGemsFor = (id: number) => Math.min(5, 3 + Math.floor(id / 40));

/** Builds a starting board by dropping small pieces at random spots, mirrored on even levels for a tidy look. */
const buildBoard = (id: number, fillRatio: number) => {
    const rng = createRng(0x51ed + id * 7919);
    const board = createBoard();
    const target = Math.round(fillRatio * BOARD_SIZE * BOARD_SIZE);
    const mirrored = id % 2 === 0;
    const pool = SHAPES.filter((shape) => shape.tier < 3);
    let filled = 0;
    let guard = 0;

    while (filled < target && guard++ < 400) {
        const shape = pool[rng.int(pool.length)];
        const spots = findPlacements(board, shape);
        if (spots.length === 0) continue;
        const [row, col] = spots[rng.int(spots.length)];
        const color = 1 + rng.int(COLOR_COUNT);
        for (const [dr, dc] of shape.cells) {
            const cells = [cellIndex(row + dr, col + dc)];
            if (mirrored) cells.push(cellIndex(row + dr, BOARD_SIZE - 1 - (col + dc)));
            for (const index of cells) {
                if (board[index] === 0) {
                    board[index] = color;
                    filled++;
                }
            }
        }
        // A level never starts with a completed line.
        const { rows, cols } = findFullLines(board);
        for (const r of rows) board[cellIndex(r, rng.int(BOARD_SIZE))] = 0;
        for (const c of cols) board[cellIndex(rng.int(BOARD_SIZE), c)] = 0;
        filled = board.filter(Boolean).length;
    }
    return { board, rng };
};

export const buildLevel = (id: number): TLevel => {
    if (id < 1 || id > LEVEL_COUNT) throw new Error(`Level ${id} does not exist`);
    const scoreLevel = isScoreLevel(id);
    const { board, rng } = buildBoard(id, fillRatioFor(id) * (scoreLevel ? 0.6 : 1));
    const gems: TGem[] = new Array<number>(board.length).fill(0);
    const difficulty = difficultyForLevel(id);

    const filledCells = board.map((cell, index) => (cell ? index : -1)).filter((index) => index >= 0);
    const types = gemTypesFor(id);
    const count = Math.min(scoreLevel ? scoreLevelGemsFor(id) : gemCountFor(id), filledCells.length);
    const counts = new Array<number>(types + 1).fill(0);
    // Gems favor crowded rows and columns, which are the ones a player can realistically finish.
    const lineFill = (index: number) => {
        const row = Math.floor(index / BOARD_SIZE);
        const col = index % BOARD_SIZE;
        let total = 0;
        for (let i = 0; i < BOARD_SIZE; i++)
            total += (board[cellIndex(row, i)] ? 1 : 0) + (board[cellIndex(i, col)] ? 1 : 0);
        return total;
    };
    for (let i = 0; i < count; i++) {
        const index = pickWeighted(rng, filledCells, (cell) => lineFill(cell) ** 2);
        filledCells.splice(filledCells.indexOf(index), 1);
        const gem = 1 + (i % types);
        gems[index] = gem;
        (board as TBoard)[index] = GEM_BLOCK_COLORS[gem];
        counts[gem] += 1;
    }

    const gemGoals: TLevelGoal[] = counts
        .map((n, gem) => ({ kind: "gems" as const, gem, count: n }))
        .filter((goal) => goal.gem > 0 && goal.count > 0);

    if (scoreLevel) {
        const target = scoreTargetFor(id);
        const moveLimit = Math.ceil((Math.ceil(target / 110) + count) * moveLimitFactorFor(id, true));
        return {
            id,
            board,
            gems,
            goals: [{ kind: "score", target }, ...gemGoals],
            par: Math.ceil(moveLimit * PAR_SHARE),
            moveLimit,
            difficulty,
        };
    }

    const moveLimit = Math.ceil(Math.ceil(8 + count * 1.8) * moveLimitFactorFor(id, false));
    return { id, board, gems, goals: gemGoals, par: Math.ceil(moveLimit * PAR_SHARE), moveLimit, difficulty };
};

const cache = new Map<number, TLevel>();

/** Memoized level lookup; levels are pure functions of their number. */
export const getLevel = (id: number): TLevel => {
    let level = cache.get(id);
    if (!level) {
        level = buildLevel(id);
        cache.set(id, level);
    }
    return level;
};
