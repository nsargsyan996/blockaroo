import { BOARD_SIZE, CELL_COUNT } from "./constants";
import { TBoard, TPlacement, TShape } from "./engine.type";

export const createBoard = (): TBoard => new Array<number>(CELL_COUNT).fill(0);

export const cellIndex = (row: number, col: number) => row * BOARD_SIZE + col;

export const canPlace = (board: TBoard, shape: TShape, row: number, col: number): boolean => {
    if (row < 0 || col < 0 || row + shape.rows > BOARD_SIZE || col + shape.cols > BOARD_SIZE) return false;
    for (const [dr, dc] of shape.cells) {
        if (board[cellIndex(row + dr, col + dc)] !== 0) return false;
    }
    return true;
};

/** Every top-left position where the shape fits. */
export const findPlacements = (board: TBoard, shape: TShape): [number, number][] => {
    const positions: [number, number][] = [];
    for (let row = 0; row <= BOARD_SIZE - shape.rows; row++) {
        for (let col = 0; col <= BOARD_SIZE - shape.cols; col++) {
            if (canPlace(board, shape, row, col)) positions.push([row, col]);
        }
    }
    return positions;
};

export const canFitAnywhere = (board: TBoard, shape: TShape): boolean => {
    for (let row = 0; row <= BOARD_SIZE - shape.rows; row++) {
        for (let col = 0; col <= BOARD_SIZE - shape.cols; col++) {
            if (canPlace(board, shape, row, col)) return true;
        }
    }
    return false;
};

const isRowFull = (board: TBoard, row: number) => {
    for (let col = 0; col < BOARD_SIZE; col++) if (board[cellIndex(row, col)] === 0) return false;
    return true;
};

const isColFull = (board: TBoard, col: number) => {
    for (let row = 0; row < BOARD_SIZE; row++) if (board[cellIndex(row, col)] === 0) return false;
    return true;
};

/** Rows and columns that are completely filled. */
export const findFullLines = (board: TBoard) => {
    const rows: number[] = [];
    const cols: number[] = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
        if (isRowFull(board, i)) rows.push(i);
        if (isColFull(board, i)) cols.push(i);
    }
    return { rows, cols };
};

/** Cells covered by the given rows and columns, without duplicates where they cross. */
export const lineCells = (rows: number[], cols: number[]): number[] => {
    const cells = new Set<number>();
    for (const row of rows) for (let col = 0; col < BOARD_SIZE; col++) cells.add(cellIndex(row, col));
    for (const col of cols) for (let row = 0; row < BOARD_SIZE; row++) cells.add(cellIndex(row, col));
    return [...cells].sort((a, b) => a - b);
};

/**
 * Places a shape and clears every completed row and column at once. The caller must check canPlace first.
 */
export const placeShape = (board: TBoard, shape: TShape, row: number, col: number, color: number): TPlacement => {
    const next = board.slice();
    const placedCells = shape.cells.map(([dr, dc]) => cellIndex(row + dr, col + dc));
    for (const index of placedCells) next[index] = color;

    const { rows, cols } = findFullLines(next);
    const clearedCells = lineCells(rows, cols);
    for (const index of clearedCells) next[index] = 0;

    return { board: next, placedCells, clearedRows: rows, clearedCols: cols, clearedCells };
};

/** Lines that would clear if the shape were placed here. Used for the drag preview. */
export const previewClears = (board: TBoard, shape: TShape, row: number, col: number) => {
    const next = board.slice();
    for (const [dr, dc] of shape.cells) next[cellIndex(row + dr, col + dc)] = 1;
    const { rows, cols } = findFullLines(next);
    return { rows, cols, cells: lineCells(rows, cols) };
};

export const isBoardEmpty = (board: TBoard) => board.every((cell) => cell === 0);

export const filledCount = (board: TBoard) => board.reduce((count, cell) => count + (cell === 0 ? 0 : 1), 0);
