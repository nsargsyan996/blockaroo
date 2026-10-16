import { cellIndex, createBoard, findFullLines, findPlacements } from "./board";
import { BOARD_SIZE, COLOR_COUNT, GEM_BLOCK_COLORS, LEVEL_COUNT } from "./constants";
import { TBoard, TGem, TLevel, TLevelGoal } from "./engine.type";
import { createRng, pickWeighted } from "./rng";
import { SHAPES } from "./shapes";

/**
 * Adventure levels are generated from the level number, so they are identical on every device and need no data
 * file. Most levels hide gems inside the starting blocks and ask the player to collect them by clearing their lines;
 * every fifth level is a score challenge instead. Boards get fuller and pieces bigger as levels go on. The curves
 * flatten around level 60 and then creep up again, so later levels stay fresh without turning into a wall.
 */

const SCORE_LEVEL_EVERY = 5;

const isScoreLevel = (id: number) => id % SCORE_LEVEL_EVERY === 0;

/** How far past level 60 a level is; the late-game creep is keyed off this. */
const late = (id: number) => Math.max(0, id - 60);

/** Share of the board filled at the start: 0.36 by level 20, then up to 0.40 by level 100. */
export const fillRatioFor = (id: number) => Math.min(0.36, 0.16 + 0.01 * id) + late(id) * 0.001;

/** Gems to collect: 12 by level 27, then one more every ten levels past 60, up to 16. */
export const gemCountFor = (id: number) =>
    Math.min(12, 3 + Math.floor(id / 3)) + Math.min(4, Math.floor(late(id) / 10));

export const gemTypesFor = (id: number) => (id < 4 ? 1 : id < 12 ? 2 : 3);

/** Dealer difficulty: 0.85 by level 52, then up to the classic-mode maximum of 1 by level 100. */
export const difficultyForLevel = (id: number) => Math.min(0.85, (id - 1) / 60) + Math.min(0.15, late(id) * 0.00375);

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

    if (scoreLevel) {
        const target = 600 + id * 90;
        return { id, board, gems, goals: [{ kind: "score", target }], par: Math.ceil(target / 110), difficulty };
    }

    const filledCells = board.map((cell, index) => (cell ? index : -1)).filter((index) => index >= 0);
    const types = gemTypesFor(id);
    const count = Math.min(gemCountFor(id), filledCells.length);
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

    const goals: TLevelGoal[] = counts
        .map((n, gem) => ({ kind: "gems" as const, gem, count: n }))
        .filter((goal) => goal.gem > 0 && goal.count > 0);

    return { id, board, gems, goals, par: Math.ceil(8 + count * 1.8), difficulty };
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
