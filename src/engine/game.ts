import { canFitAnywhere, canPlace, cellIndex, createBoard, isBoardEmpty, lineCells, placeShape } from "./board";
import {
    BOARD_SIZE,
    CELL_COUNT,
    COLOR_COUNT,
    GAME_STATE_VERSION,
    GEM_TYPES,
    MAX_REVIVES,
    REVIVE_ROWS_CLEARED,
    TRAY_SIZE,
} from "./constants";
import { dealShapes, TDealOptions } from "./dealer";
import {
    TAdventureState,
    TBoard,
    TGameState,
    TGem,
    TLevel,
    TLevelGoal,
    TMoveResult,
    TReviveResult,
    TTray,
} from "./engine.type";
import { createRng, randomSeed, TRng } from "./rng";
import { movePoints, nextStreak } from "./scoring";
import { getShape } from "./shapes";

const dealTray = (
    board: TBoard,
    rng: TRng,
    nextUid: number,
    options: TDealOptions
): { tray: TTray; nextUid: number } => {
    let uid = nextUid;
    const tray = dealShapes(board, rng, options).map((shape) => ({
        uid: uid++,
        shapeId: shape.id,
        color: 1 + rng.int(COLOR_COUNT),
    }));
    return { tray, nextUid: uid };
};

const dealOptions = (state: Pick<TGameState, "score" | "adventure">, friendly = false): TDealOptions => ({
    score: state.score,
    difficulty: state.adventure?.difficulty,
    friendly,
});

/** True when no piece left in the tray fits anywhere. */
export const isStuck = (board: TBoard, tray: TTray) =>
    tray.every((piece) => piece === null || !canFitAnywhere(board, getShape(piece.shapeId)));

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
    const { tray, nextUid } = dealTray(level.board, rng, 1, { score: 0, difficulty: level.difficulty });
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

    // Gems inside cleared blocks are collected.
    const collectedGems = placement.clearedCells
        .filter((index) => state.gems[index] > 0)
        .map((index) => ({ index, gem: state.gems[index] }));
    const gems = state.gems.slice();
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
        ({ tray, nextUid } = dealTray(placement.board, rng, nextUid, dealOptions({ score, adventure })));
        rngState = rng.state();
        dealt = true;
    }

    const gameOver = !won && isStuck(placement.board, tray);

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
    const { tray, nextUid } = dealTray(board, rng, state.nextUid, dealOptions(state, true));

    return {
        state: {
            ...state,
            board,
            tray,
            combo: 0,
            movesSinceClear: 0,
            revivesUsed: state.revivesUsed + 1,
            status: isStuck(board, tray) ? "over" : "playing",
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
