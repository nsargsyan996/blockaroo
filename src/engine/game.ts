import { canFitAnywhere, canPlace, cellIndex, createBoard, isBoardEmpty, lineCells, placeShape } from "./board";
import {
    BOARD_SIZE,
    CELL_COUNT,
    COLOR_COUNT,
    GAME_STATE_VERSION,
    GEM_BLOCK_COLORS,
    GEM_TYPES,
    MAX_RESCUES,
    MAX_REVIVES,
    PIECE_GEM_CHANCE,
    REVIVE_ROWS_CLEARED,
    ROTATIONS_PER_GAME,
    TRAY_SIZE,
} from "./constants";
import { dealShapes, rescueShapes, TDealOptions } from "./dealer";
import {
    TAdventureState,
    TBoard,
    TGameState,
    TGem,
    TLevel,
    TLevelGoal,
    TMoveResult,
    TOffset,
    TPiece,
    TReviveResult,
    TTray,
} from "./engine.type";
import { createRng, randomSeed, TRng } from "./rng";
import { movePoints, nextStreak } from "./scoring";
import { getShape, isRotationSymmetric, rotatedShapeId, shapeTurns } from "./shapes";

/** Adventure: the gem types whose goals are not met yet. Pieces only carry gems the level still asks for. */
export const neededGems = (adventure: TAdventureState | null | undefined): TGem[] =>
    adventure
        ? adventure.goals.flatMap((goal) =>
              goal.kind === "gems" && adventure.collected[goal.gem] < goal.count ? [goal.gem] : []
          )
        : [];

const dealTray = (
    board: TBoard,
    rng: TRng,
    nextUid: number,
    options: TDealOptions,
    /** Adventure: gem types a new piece may carry. Empty in classic and once every gem goal is met. */
    gemPool: TGem[] = []
): { tray: TTray; nextUid: number } => {
    let uid = nextUid;
    const tray = dealShapes(board, rng, options).map((shape): TPiece => {
        const piece: TPiece = { uid: uid++, shapeId: shape.id, color: 1 + rng.int(COLOR_COUNT) };
        if (gemPool.length > 0 && rng.next() < PIECE_GEM_CHANCE) {
            const gem = gemPool[rng.int(gemPool.length)];
            // Same look as the gem blocks a level starts with: the block color follows the gem.
            piece.color = GEM_BLOCK_COLORS[gem];
            piece.gem = { gem, cell: shape.cells[rng.int(shape.cells.length)] };
        }
        return piece;
    });
    return { tray, nextUid: uid };
};

const dealOptions = (
    state: Pick<TGameState, "score" | "adventure" | "gems" | "movesSinceClear">,
    friendly = false
): TDealOptions => ({
    score: state.score,
    difficulty: state.adventure?.difficulty,
    friendly,
    gems: state.adventure ? state.gems : undefined,
    drought: state.movesSinceClear,
});

/** True when the piece fits somewhere as it is or after at most `turns` quarter turns. */
export const canFitWithTurns = (board: TBoard, shapeId: string, turns: number) =>
    shapeTurns(shapeId)
        .slice(0, turns + 1)
        .some((id) => canFitAnywhere(board, getShape(id)));

/** True when no piece left in the tray fits anywhere, even after spending up to `turns` quarter turns on it. */
export const isStuck = (board: TBoard, tray: TTray, turns = 0) =>
    tray.every((piece) => piece === null || !canFitWithTurns(board, piece.shapeId, turns));

export const rotationsLeft = (state: Pick<TGameState, "rotationsUsed">) =>
    Math.max(0, ROTATIONS_PER_GAME - (state.rotationsUsed ?? 0));

/** A piece can be turned while the game is on, turns are left, and turning would change it. */
export const canRotatePiece = (state: TGameState, slot: number) => {
    const piece = state.tray[slot];
    return (
        state.status === "playing" && piece != null && rotationsLeft(state) > 0 && !isRotationSymmetric(piece.shapeId)
    );
};

/**
 * Turns the piece in tray slot `slot` a quarter turn clockwise and spends one of the game's turns. It keeps its uid
 * and color, and does not count as a move. Returns null when the piece can't be turned.
 */
export const rotatePiece = (state: TGameState, slot: number): TGameState | null => {
    if (!canRotatePiece(state, slot)) return null;
    const piece = state.tray[slot]!;
    const rows = getShape(piece.shapeId).rows;
    // The gem turns with the piece, the same quarter turn as its cells (see rotatedShapeId).
    const gem = piece.gem
        ? { ...piece.gem, cell: [piece.gem.cell[1], rows - 1 - piece.gem.cell[0]] as TOffset }
        : undefined;
    const tray = state.tray.map((item, index) =>
        index === slot ? { ...piece, shapeId: rotatedShapeId(piece.shapeId), ...(gem ? { gem } : {}) } : item
    );
    return { ...state, tray, rotationsUsed: (state.rotationsUsed ?? 0) + 1 };
};

const emptyGems = (): TGem[] => new Array<number>(CELL_COUNT).fill(0);

export const createGame = (seed: number = randomSeed()): TGameState => {
    const rng = createRng(seed);
    const board = createBoard();
    const { tray, nextUid } = dealTray(board, rng, 1, { score: 0, friendly: true });
    return {
        version: GAME_STATE_VERSION,
        mode: "classic",
        board,
        gems: emptyGems(),
        adventure: null,
        tray,
        score: 0,
        combo: 0,
        movesSinceClear: 0,
        linesCleared: 0,
        moves: 0,
        revivesUsed: 0,
        status: "playing",
        rngState: rng.state(),
        nextUid,
    };
};

/** Starts an adventure level. The same level always deals the same pieces for the same seed. */
export const createAdventureGame = (level: TLevel, seed: number = randomSeed()): TGameState => {
    const rng = createRng(seed);
    const adventure: TAdventureState = {
        levelId: level.id,
        goals: level.goals,
        collected: new Array<number>(GEM_TYPES + 1).fill(0),
        par: level.par,
        difficulty: level.difficulty,
    };
    const { tray, nextUid } = dealTray(
        level.board,
        rng,
        1,
        { score: 0, difficulty: level.difficulty, gems: level.gems },
        neededGems(adventure)
    );
    return {
        version: GAME_STATE_VERSION,
        mode: "adventure",
        board: level.board.slice(),
        gems: level.gems.slice(),
        adventure,
        tray,
        score: 0,
        combo: 0,
        movesSinceClear: 0,
        linesCleared: 0,
        moves: 0,
        revivesUsed: 0,
        status: "playing",
        rngState: rng.state(),
        nextUid,
    };
};

/** How far a goal has come, for the HUD. */
export const goalProgress = (goal: TLevelGoal, state: Pick<TGameState, "score" | "adventure">) => {
    const current = goal.kind === "gems" ? (state.adventure?.collected[goal.gem] ?? 0) : state.score;
    const target = goal.kind === "gems" ? goal.count : goal.target;
    return { current: Math.min(current, target), target, done: current >= target };
};

export const isLevelComplete = (state: Pick<TGameState, "score" | "adventure">) =>
    !!state.adventure && state.adventure.goals.every((goal) => goalProgress(goal, state).done);

/** 3 stars at or under par, 2 within half again, otherwise 1. */
export const starsFor = (moves: number, par: number) => (moves <= par ? 3 : moves <= Math.ceil(par * 1.5) ? 2 : 1);

export const canPlacePiece = (state: TGameState, slot: number, row: number, col: number) => {
    const piece = state.tray[slot];
    return state.status === "playing" && piece != null && canPlace(state.board, getShape(piece.shapeId), row, col);
};

/** Places the piece in tray slot `slot` with its top-left corner at (row, col). Returns null for an invalid move. */
export const placePiece = (state: TGameState, slot: number, row: number, col: number): TMoveResult | null => {
    if (!canPlacePiece(state, slot, row, col)) return null;
    const piece = state.tray[slot]!;
    const shape = getShape(piece.shapeId);

    const placement = placeShape(state.board, shape, row, col, piece.color);
    const lines = placement.clearedRows.length + placement.clearedCols.length;
    const streak = nextStreak(state, lines);
    const perfectClear = lines > 0 && isBoardEmpty(placement.board);
    const points = movePoints({ cellsPlaced: shape.size, lines, combo: streak.combo, perfectClear });
    const score = state.score + points;

    // A gem riding on the piece lands in its block; if that block's line clears right away, it is collected at once.
    const gems = state.gems.slice();
    if (piece.gem) gems[cellIndex(row + piece.gem.cell[0], col + piece.gem.cell[1])] = piece.gem.gem;

    // Gems inside cleared blocks are collected.
    const collectedGems = placement.clearedCells
        .filter((index) => gems[index] > 0)
        .map((index) => ({ index, gem: gems[index] }));
    let adventure = state.adventure;
    if (collectedGems.length > 0) {
        for (const { index } of collectedGems) gems[index] = 0;
        if (adventure) {
            const collected = adventure.collected.slice();
            for (const { gem } of collectedGems) collected[gem] += 1;
            adventure = { ...adventure, collected };
        }
    }

    const won = isLevelComplete({ score, adventure });

    let tray: TTray = state.tray.map((item, index) => (index === slot ? null : item));
    let nextUid = state.nextUid;
    let rngState = state.rngState;
    let dealt = false;

    if (!won && tray.every((item) => item === null)) {
        const rng = createRng(rngState);
        ({ tray, nextUid } = dealTray(
            placement.board,
            rng,
            nextUid,
            dealOptions({ score, adventure, gems, movesSinceClear: streak.movesSinceClear }),
            neededGems(adventure)
        ));
        rngState = rng.state();
        dealt = true;
    }

    // Leftover pieces that no longer fit, even turned with the turns still left, are swapped for ones that do, a few
    // times per game, so a half-empty board does not end the game.
    const turns = rotationsLeft(state);
    let rescuesUsed = state.rescuesUsed ?? 0;
    let rescuedSlots: number[] = [];
    if (!won && rescuesUsed < MAX_RESCUES && isStuck(placement.board, tray, turns)) {
        const slots = tray.map((item, index) => (item ? index : -1)).filter((index) => index >= 0);
        const rng = createRng(rngState);
        const shapes = rescueShapes(placement.board, rng, slots.length, adventure ? gems : undefined);
        if (shapes) {
            tray = tray.slice();
            slots.forEach((index, i) => {
                tray[index] = { uid: nextUid++, shapeId: shapes[i].id, color: 1 + rng.int(COLOR_COUNT) };
            });
            rngState = rng.state();
            rescuesUsed += 1;
            rescuedSlots = slots;
        }
    }

    const gameOver = !won && isStuck(placement.board, tray, turns);

    return {
        state: {
            ...state,
            board: placement.board,
            gems,
            adventure,
            tray,
            score,
            combo: streak.combo,
            movesSinceClear: streak.movesSinceClear,
            linesCleared: state.linesCleared + lines,
            moves: state.moves + 1,
            rescuesUsed,
            status: won ? "won" : gameOver ? "over" : "playing",
            rngState,
            nextUid,
        },
        event: {
            placedCells: placement.placedCells,
            clearedRows: placement.clearedRows,
            clearedCols: placement.clearedCols,
            clearedCells: placement.clearedCells,
            lines,
            points,
            combo: streak.combo,
            perfectClear,
            dealt,
            rescuedSlots,
            gameOver,
            collectedGems,
            won,
        },
    };
};

export const canRevive = (state: TGameState) => state.status === "over" && state.revivesUsed < MAX_REVIVES;

/** The rows to clear on a revive: the most crowded ones, top to bottom on ties. */
export const reviveRows = (board: TBoard): number[] =>
    Array.from({ length: BOARD_SIZE }, (_, row) => ({
        row,
        filled: Array.from({ length: BOARD_SIZE }, (__, col) => board[cellIndex(row, col)]).filter(Boolean).length,
    }))
        .sort((a, b) => b.filled - a.filled || a.row - b.row)
        .slice(0, REVIVE_ROWS_CLEARED)
        .map(({ row }) => row)
        .sort((a, b) => a - b);

/**
 * Clears the most crowded rows and deals a fresh tray of small pieces. Score and streak are kept. Blocks holding gems
 * stay put, so a revive never completes an adventure goal on its own.
 */
export const revive = (state: TGameState): TReviveResult | null => {
    if (!canRevive(state)) return null;
    const clearedCells = lineCells(reviveRows(state.board), []).filter(
        (index) => state.board[index] !== 0 && state.gems[index] === 0
    );
    const board = state.board.slice();
    for (const index of clearedCells) board[index] = 0;

    const rng = createRng(state.rngState);
    const { tray, nextUid } = dealTray(
        board,
        rng,
        state.nextUid,
        dealOptions(state, true),
        neededGems(state.adventure)
    );

    return {
        state: {
            ...state,
            board,
            tray,
            combo: 0,
            movesSinceClear: 0,
            revivesUsed: state.revivesUsed + 1,
            status: isStuck(board, tray, rotationsLeft(state)) ? "over" : "playing",
            rngState: rng.state(),
            nextUid,
        },
        clearedCells,
    };
};

/** Guards against a corrupted or outdated save. */
export const isValidGameState = (value: unknown): value is TGameState => {
    if (!value || typeof value !== "object") return false;
    const state = value as Partial<TGameState>;
    return (
        state.version === GAME_STATE_VERSION &&
        (state.mode === "classic" || state.mode === "adventure") &&
        Array.isArray(state.board) &&
        state.board.length === CELL_COUNT &&
        Array.isArray(state.gems) &&
        state.gems.length === CELL_COUNT &&
        Array.isArray(state.tray) &&
        state.tray.length === TRAY_SIZE &&
        typeof state.score === "number" &&
        (state.mode === "classic" || !!state.adventure) &&
        (state.status === "playing" || state.status === "over" || state.status === "won")
    );
};
