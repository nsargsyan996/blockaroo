import { canPlace, cellIndex, filledCount, placeShape } from "./board";
import { BOARD_SIZE, HINTS_PER_GAME } from "./constants";
import { canPlaceAll } from "./dealer";
import { TBoard, TGameState, TGem, TShape } from "./engine.type";
import { rotationsLeft } from "./game";
import { getShape, shapeTurns } from "./shapes";

/** A suggested move: which tray piece to place and where. */
export interface THint {
    slot: number;
    row: number;
    col: number;
    /** Board cells the piece would cover. */
    cells: number[];
    /** Quarter turns the piece needs first; 0 for a move with the piece as it is. */
    turns: number;
}

/**
 * What one quarter turn costs a move's value. Above any gem or line reward, so a hint turns a piece only when no move
 * without turning is safe, and below the dead-end penalty, so turning beats leaving no room for the other pieces.
 */
const TURN_COST = 3000;

/** The look-ahead for the pieces left in the tray is capped, so a hint is always quick to work out. */
const LOOKAHEAD_BUDGET = 250;

const isFilled = (board: TBoard, row: number, col: number) =>
    row < 0 || col < 0 || row >= BOARD_SIZE || col >= BOARD_SIZE || board[cellIndex(row, col)] !== 0;

/** Empty cells boxed in on three or four sides: awkward holes that only small pieces can fill later. */
const pocketCount = (board: TBoard) => {
    let pockets = 0;
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[cellIndex(row, col)] !== 0) continue;
            const walls =
                Number(isFilled(board, row - 1, col)) +
                Number(isFilled(board, row + 1, col)) +
                Number(isFilled(board, row, col - 1)) +
                Number(isFilled(board, row, col + 1));
            if (walls >= 3) pockets++;
        }
    }
    return pockets;
};

/** Rewards filling up the rows and columns that hold gems, so hints work toward the level goal. */
const gemLineProgress = (board: TBoard, gems: TGem[]) => {
    let progress = 0;
    for (let index = 0; index < gems.length; index++) {
        if (gems[index] === 0) continue;
        const row = Math.floor(index / BOARD_SIZE);
        const col = index % BOARD_SIZE;
        let inRow = 0;
        let inCol = 0;
        for (let i = 0; i < BOARD_SIZE; i++) {
            if (board[cellIndex(row, i)] !== 0) inRow++;
            if (board[cellIndex(i, col)] !== 0) inCol++;
        }
        progress += Math.max(inRow, inCol);
    }
    return progress;
};

/**
 * The best move for the current tray, or null when nothing fits. Collecting gems comes first, then clearing lines,
 * then keeping the board open and tidy, and a move that leaves no room for the other tray pieces is avoided. Pieces
 * may be turned up to `maxTurns` quarter turns, but only when that is the way out (see TURN_COST).
 */
export const findHint = (state: Pick<TGameState, "board" | "gems" | "tray">, maxTurns = 0): THint | null => {
    const { board, gems, tray } = state;
    const hasGems = gems.some((gem) => gem > 0);
    let best: (THint & { value: number }) | null = null;
    const seen = new Set<string>();

    tray.forEach((piece, slot) => {
        if (!piece) return;
        const rest: TShape[] = tray
            .filter((other, index) => other !== null && index !== slot)
            .map((other) => getShape(other!.shapeId));

        shapeTurns(piece.shapeId)
            .slice(0, maxTurns + 1)
            .forEach((shapeId, turns) => {
                // Two copies of the same shape, needing the same turns, have the same best spot.
                const key = `${shapeId}:${turns}`;
                if (seen.has(key)) return;
                seen.add(key);
                const shape = getShape(shapeId);
                for (let row = 0; row <= BOARD_SIZE - shape.rows; row++) {
                    for (let col = 0; col <= BOARD_SIZE - shape.cols; col++) {
                        if (!canPlace(board, shape, row, col)) continue;
                        const placed = placeShape(board, shape, row, col, 1);
                        const lines = placed.clearedRows.length + placed.clearedCols.length;
                        const gemCount = placed.clearedCells.filter((index) => gems[index] > 0).length;
                        let value = gemCount * 1000 + lines * 150 - filledCount(placed.board) * 2 - turns * TURN_COST;
                        value -= pocketCount(placed.board) * 12;
                        if (hasGems) value += gemLineProgress(placed.board, gems) * 3;
                        if (rest.length > 0 && !canPlaceAll(placed.board, rest, { left: LOOKAHEAD_BUDGET })) {
                            value -= 5000;
                        }
                        if (!best || value > best.value) {
                            best = { slot, row, col, value, cells: placed.placedCells, turns };
                        }
                    }
                }
            });
    });

    if (!best) return null;
    const { slot, row, col, cells, turns } = best as THint;
    return { slot, row, col, cells, turns };
};

export const hintsLeft = (state: Pick<TGameState, "hintsUsed">) => Math.max(0, HINTS_PER_GAME - (state.hintsUsed ?? 0));

/**
 * Spends one of the game's hints. When the best move needs the piece turned, the hint turns it (spending those turns),
 * so the piece in the tray matches the cells the hint shows. Returns null when no hints are left or the game is not
 * being played.
 */
export const takeHint = (state: TGameState): { state: TGameState; hint: THint } | null => {
    if (state.status !== "playing" || hintsLeft(state) === 0) return null;
    const hint = findHint(state, rotationsLeft(state));
    if (!hint) return null;
    const piece = state.tray[hint.slot]!;
    const tray =
        hint.turns === 0
            ? state.tray
            : state.tray.map((item, index) =>
                  index === hint.slot ? { ...piece, shapeId: shapeTurns(piece.shapeId)[hint.turns] } : item
              );
    return {
        state: {
            ...state,
            tray,
            hintsUsed: (state.hintsUsed ?? 0) + 1,
            rotationsUsed: (state.rotationsUsed ?? 0) + hint.turns,
        },
        hint,
    };
};
