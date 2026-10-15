import { canFitAnywhere, canPlace, cellIndex, createBoard, isBoardEmpty, lineCells, placeShape } from "./board";
import { BOARD_SIZE, COLOR_COUNT, GAME_STATE_VERSION, MAX_REVIVES, REVIVE_ROWS_CLEARED, TRAY_SIZE } from "./constants";
import { dealShapes } from "./dealer";
import { TBoard, TGameState, TMoveResult, TReviveResult, TTray } from "./engine.type";
import { createRng, randomSeed, TRng } from "./rng";
import { movePoints, nextStreak } from "./scoring";
import { getShape } from "./shapes";

const dealTray = (
    board: TBoard,
    rng: TRng,
    nextUid: number,
    options: { score: number; friendly?: boolean }
): { tray: TTray; nextUid: number } => {
    let uid = nextUid;
    const tray = dealShapes(board, rng, options).map((shape) => ({
        uid: uid++,
        shapeId: shape.id,
        color: 1 + rng.int(COLOR_COUNT),
    }));
    return { tray, nextUid: uid };
};

/** True when no piece left in the tray fits anywhere. */
export const isStuck = (board: TBoard, tray: TTray) =>
    tray.every((piece) => piece === null || !canFitAnywhere(board, getShape(piece.shapeId)));

export const createGame = (seed: number = randomSeed()): TGameState => {
    const rng = createRng(seed);
    const board = createBoard();
    const { tray, nextUid } = dealTray(board, rng, 1, { score: 0, friendly: true });
    return {
        version: GAME_STATE_VERSION,
        board,
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

    let tray: TTray = state.tray.map((item, index) => (index === slot ? null : item));
    let nextUid = state.nextUid;
    let rngState = state.rngState;
    let dealt = false;
    const score = state.score + points;

    if (tray.every((item) => item === null)) {
        const rng = createRng(rngState);
        ({ tray, nextUid } = dealTray(placement.board, rng, nextUid, { score }));
        rngState = rng.state();
        dealt = true;
    }

    const gameOver = isStuck(placement.board, tray);

    return {
        state: {
            ...state,
            board: placement.board,
            tray,
            score,
            combo: streak.combo,
            movesSinceClear: streak.movesSinceClear,
            linesCleared: state.linesCleared + lines,
            moves: state.moves + 1,
            status: gameOver ? "over" : "playing",
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
 * Roo's Big Hop: clears the most crowded rows and deals a fresh tray of small pieces. Score and streak are kept.
 */
export const revive = (state: TGameState): TReviveResult | null => {
    if (!canRevive(state)) return null;
    const clearedCells = lineCells(reviveRows(state.board), []).filter((index) => state.board[index] !== 0);
    const board = state.board.slice();
    for (const index of clearedCells) board[index] = 0;

    const rng = createRng(state.rngState);
    const { tray, nextUid } = dealTray(board, rng, state.nextUid, { score: state.score, friendly: true });

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
        Array.isArray(state.board) &&
        state.board.length === BOARD_SIZE * BOARD_SIZE &&
        Array.isArray(state.tray) &&
        state.tray.length === TRAY_SIZE &&
        typeof state.score === "number" &&
        (state.status === "playing" || state.status === "over")
    );
};
