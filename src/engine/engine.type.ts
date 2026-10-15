/** 0 is an empty cell; 1-7 is a block color index (see BLOCK_COLORS in @theme). */
export type TCell = number;

/** Row-major BOARD_SIZE x BOARD_SIZE grid. */
export type TBoard = TCell[];

/** [row, col] offset from a shape's top-left corner. */
export type TOffset = [number, number];

/** 1 = small and easy to fit, 3 = big. The dealer leans on tiers to tune difficulty. */
export type TShapeTier = 1 | 2 | 3;

export interface TShape {
    id: string;
    cells: TOffset[];
    rows: number;
    cols: number;
    size: number;
    tier: TShapeTier;
}

export interface TPiece {
    /** Unique per dealt piece, used as a React key so new pieces animate in. */
    uid: number;
    shapeId: string;
    color: number;
}

/** Always TRAY_SIZE slots; a slot is null once its piece has been placed. */
export type TTray = (TPiece | null)[];

export type TGameStatus = "playing" | "over";

export interface TGameState {
    version: number;
    board: TBoard;
    tray: TTray;
    score: number;
    /** Current streak multiplier. 0 means no streak is running. */
    combo: number;
    /** Placements since the last clear; the streak ends when this reaches COMBO_WINDOW. */
    movesSinceClear: number;
    linesCleared: number;
    moves: number;
    revivesUsed: number;
    status: TGameStatus;
    rngState: number;
    nextUid: number;
}

export interface TPlacement {
    board: TBoard;
    placedCells: number[];
    clearedRows: number[];
    clearedCols: number[];
    clearedCells: number[];
}

export interface TMoveEvent {
    placedCells: number[];
    clearedRows: number[];
    clearedCols: number[];
    clearedCells: number[];
    lines: number;
    points: number;
    combo: number;
    perfectClear: boolean;
    dealt: boolean;
    gameOver: boolean;
}

export interface TMoveResult {
    state: TGameState;
    event: TMoveEvent;
}

export interface TReviveResult {
    state: TGameState;
    clearedCells: number[];
}
