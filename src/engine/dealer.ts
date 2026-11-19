import { canFitAnywhere, canPlace, filledCount, findPlacements, placeShape, previewClears } from "./board";
import { BOARD_SIZE, CELL_COUNT, DIFFICULTY_MAX_SCORE, TRAY_SIZE } from "./constants";
import { TBoard, TGem, TShape, TShapeTier } from "./engine.type";
import { pickWeighted, TRng } from "./rng";
import { SHAPES } from "./shapes";

/**
 * The dealer is what makes the game feel fair. It deals three shapes that can all be placed in some order (so a game
 * never ends on a set that was impossible from the start), it often slips in a piece that clears a line, and it
 * moves from small pieces toward bigger ones slowly as the score rises. It also watches the board: the fuller it gets,
 * and the longer the player has gone without a clear, the smaller and more helpful the pieces become.
 */

const SEARCH_BUDGET = 1500;
const DEAL_ATTEMPTS = 10;

/** Board fill where the dealer starts easing off, and where it is at its most generous. */
const CROWDED_FROM = 0.3;
const CROWDED_FULL = 0.55;
/** Placements without a clear after which the next deal always includes a line-clearing piece. */
export const DROUGHT_MOVES = 3;

export interface TDealOptions {
    score: number;
    /** Overrides the score-based difficulty (adventure levels set their own). */
    difficulty?: number;
    /** Revive deals and the first deal of a game only use small, friendly pieces. */
    friendly?: boolean;
    /** Adventure: helpful pieces prefer lines that hold gems. */
    gems?: TGem[];
    /** Placements since the last line clear. */
    drought?: number;
}

/** 0 at the start of a game, 1 at DIFFICULTY_MAX_SCORE. */
export const difficultyFor = (score: number) => Math.min(1, Math.max(0, score / DIFFICULTY_MAX_SCORE));

export const tierWeights = (difficulty: number): Record<TShapeTier, number> => ({
    1: 3.2 - 1.2 * difficulty,
    2: 3,
    3: 0.5 + 1.1 * difficulty,
});

/** Chance that one piece of a deal is picked because it completes a line right now. */
export const helpChance = (difficulty: number) => 0.55 - 0.25 * difficulty;

/** 0 while the board has plenty of room, 1 once it is crowded. */
export const crowding = (board: TBoard) =>
    Math.min(1, Math.max(0, (filledCount(board) / CELL_COUNT - CROWDED_FROM) / (CROWDED_FULL - CROWDED_FROM)));

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

/**
 * How much a shape helps right now: 0 when it cannot complete a line anywhere, otherwise the lines its best spot
 * clears, with every gem on those lines counting extra.
 */
export const helpValue = (board: TBoard, shape: TShape, gems?: TGem[]): number => {
    let best = 0;
    for (const [row, col] of findPlacements(board, shape)) {
        const { rows, cols, cells } = previewClears(board, shape, row, col);
        const lines = rows.length + cols.length;
        if (lines === 0) continue;
        const gemCount = gems ? cells.filter((index) => gems[index] > 0).length : 0;
        best = Math.max(best, lines + 3 * gemCount);
    }
    return best;
};

/** Shapes that would complete at least one line somewhere on the board right now. */
export const helpfulShapes = (board: TBoard, pool: TShape[] = SHAPES): TShape[] =>
    pool.filter((shape) => helpValue(board, shape) > 0);

const pickShapes = (rng: TRng, pool: TShape[], weights: Record<TShapeTier, number>, count: number): TShape[] =>
    Array.from({ length: count }, () => pickWeighted(rng, pool, (shape) => weights[shape.tier]));

export const dealShapes = (board: TBoard, rng: TRng, options: TDealOptions): TShape[] => {
    const { score, friendly = false, gems, drought = 0 } = options;
    const crowded = crowding(board);
    // A crowded board pulls the mix back toward small pieces, whatever the score or level says.
    const difficulty = friendly ? 0 : (options.difficulty ?? difficultyFor(score)) * (1 - 0.7 * crowded);
    const pool = friendly ? SHAPES.filter((shape) => shape.tier < 3) : SHAPES;
    const weights = tierWeights(difficulty);

    const helpers = pool
        .map((shape) => ({ shape, value: helpValue(board, shape, gems) }))
        .filter((helper) => helper.value > 0);
    const rescue = drought >= DROUGHT_MOVES || crowded >= 1;
    const chance = rescue ? 1 : helpChance(difficulty) + 0.4 * crowded;
    const pickHelper = () => pickWeighted(rng, helpers, (helper) => helper.value * helper.value).shape;

    for (let attempt = 0; attempt < DEAL_ATTEMPTS; attempt++) {
        const shapes = pickShapes(rng, pool, weights, TRAY_SIZE);

        if (helpers.length > 0 && rng.next() < chance) {
            const slot = rng.int(TRAY_SIZE);
            shapes[slot] = pickHelper();
            // In real trouble a second helper comes along.
            if (rescue && crowded > 0.5) shapes[(slot + 1) % TRAY_SIZE] = pickHelper();
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

/**
 * Replacement shapes for tray pieces that no longer fit anywhere: small or medium pieces that can all be placed,
 * leaning toward ones that clear a line. Returns null when the board has no room for any piece at all.
 */
export const rescueShapes = (board: TBoard, rng: TRng, count: number, gems?: TGem[]): TShape[] | null => {
    const fitting = SHAPES.filter((shape) => shape.tier < 3 && canFitAnywhere(board, shape));
    if (fitting.length === 0) return null;
    const weightOf = (shape: TShape) => 1 + 4 * helpValue(board, shape, gems);
    let shapes: TShape[] = [];
    for (let attempt = 0; attempt < DEAL_ATTEMPTS; attempt++) {
        shapes = Array.from({ length: count }, () => pickWeighted(rng, fitting, weightOf));
        if (canPlaceAll(board, shapes)) return shapes;
    }
    return shapes;
};
