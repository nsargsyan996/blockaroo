import { canFitAnywhere, canPlace, findPlacements, placeShape, previewClears } from "./board";
import { BOARD_SIZE, DIFFICULTY_MAX_SCORE, TRAY_SIZE } from "./constants";
import { TBoard, TShape, TShapeTier } from "./engine.type";
import { pickWeighted, TRng } from "./rng";
import { SHAPES } from "./shapes";

/**
 * The dealer is what makes the game feel fair. It deals three shapes that can all be placed in some order (so a game
 * never ends on a set that was impossible from the start), it sometimes slips in a piece that clears a line, and it
 * moves from small pieces toward bigger ones slowly as the score rises.
 */

const SEARCH_BUDGET = 4000;
const DEAL_ATTEMPTS = 14;

export interface TDealOptions {
    score: number;
    /** Overrides the score-based difficulty (adventure levels set their own). */
    difficulty?: number;
    /** Revive deals and the first deal of a game only use small, friendly pieces. */
    friendly?: boolean;
}

/** 0 at the start of a game, 1 at DIFFICULTY_MAX_SCORE. */
export const difficultyFor = (score: number) => Math.min(1, Math.max(0, score / DIFFICULTY_MAX_SCORE));

export const tierWeights = (difficulty: number): Record<TShapeTier, number> => ({
    1: 2.6 - 1.4 * difficulty,
    2: 3,
    3: 1.1 + 1.6 * difficulty,
});

/** Chance that one piece of a deal is picked because it completes a line right now. */
export const helpChance = (difficulty: number) => 0.3 - 0.2 * difficulty;

/**
 * True when the shapes can all be placed one after another in some order, taking line clears into account.
 * The search is capped; when it runs out it reports false, and the dealer simply tries another set.
 */
export const canPlaceAll = (board: TBoard, shapes: TShape[], budget = { left: SEARCH_BUDGET }): boolean => {
    if (shapes.length === 0) return true;
    const tried = new Set<string>();
    for (let i = 0; i < shapes.length; i++) {
        const shape = shapes[i];
        if (tried.has(shape.id)) continue;
        tried.add(shape.id);
        const rest = [...shapes.slice(0, i), ...shapes.slice(i + 1)];
        for (let row = 0; row <= BOARD_SIZE - shape.rows; row++) {
            for (let col = 0; col <= BOARD_SIZE - shape.cols; col++) {
                if (!canPlace(board, shape, row, col)) continue;
                if (--budget.left <= 0) return false;
                const { board: next } = placeShape(board, shape, row, col, 1);
                if (canPlaceAll(next, rest, budget)) return true;
            }
        }
    }
    return false;
};

/** Shapes that would complete at least one line somewhere on the board right now. */
export const helpfulShapes = (board: TBoard, pool: TShape[] = SHAPES): TShape[] =>
    pool.filter((shape) =>
        findPlacements(board, shape).some(([row, col]) => {
            const { rows, cols } = previewClears(board, shape, row, col);
            return rows.length + cols.length > 0;
        })
    );

const pickShapes = (rng: TRng, pool: TShape[], weights: Record<TShapeTier, number>, count: number): TShape[] =>
    Array.from({ length: count }, () => pickWeighted(rng, pool, (shape) => weights[shape.tier]));

export const dealShapes = (board: TBoard, rng: TRng, options: TDealOptions): TShape[] => {
    const { score, friendly = false } = options;
    const difficulty = friendly ? 0 : (options.difficulty ?? difficultyFor(score));
    const pool = friendly ? SHAPES.filter((shape) => shape.tier < 3) : SHAPES;
    const weights = tierWeights(difficulty);

    for (let attempt = 0; attempt < DEAL_ATTEMPTS; attempt++) {
        const shapes = pickShapes(rng, pool, weights, TRAY_SIZE);

        if (rng.next() < helpChance(difficulty)) {
            const helpers = helpfulShapes(board, pool);
            if (helpers.length > 0) shapes[rng.int(TRAY_SIZE)] = helpers[rng.int(helpers.length)];
        }

        if (canPlaceAll(board, shapes)) return shapes;
    }

    // The board is crowded. Fall back to the smallest pieces, as long as each can fit somewhere on its own.
    const small = SHAPES.filter((shape) => shape.tier === 1);
    for (let attempt = 0; attempt < DEAL_ATTEMPTS; attempt++) {
        const shapes = pickShapes(rng, small, tierWeights(0), TRAY_SIZE);
        if (canPlaceAll(board, shapes)) return shapes;
    }

    const fitting = small.filter((shape) => canFitAnywhere(board, shape));
    const source = fitting.length > 0 ? fitting : small;
    return Array.from({ length: TRAY_SIZE }, () => source[rng.int(source.length)]);
};
