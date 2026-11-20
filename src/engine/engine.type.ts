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
    /** Adventure: a gem riding on one block of the piece. Placing the piece drops it on the board. */
    gem?: TPieceGem;
}

/** A gem inside one block of a tray piece: which gem, and which of the shape's cells holds it. */
export interface TPieceGem {
    gem: TGem;
    cell: TOffset;
}

/** Always TRAY_SIZE slots; a slot is null once its piece has been placed. */
export type TTray = (TPiece | null)[];

export type TGameStatus = "playing" | "over" | "won";

export type TGameMode = "classic" | "adventure";

/** 0 = no gem; 1..GEM_TYPES = a gem inside the block on that cell. Gems are collected when their line clears. */
export type TGem = number;

export type TLevelGoal = { kind: "gems"; gem: number; count: number } | { kind: "score"; target: number };

export interface TLevel {
    id: number;
    board: TBoard;
    gems: TGem[];
    goals: TLevelGoal[];
    /** Moves for three stars. */
    par: number;
    /** Moves the level allows; running out ends the level. */
    moveLimit: number;
    /** 0..1, feeds the dealer instead of the score. */
    difficulty: number;
}

export interface TAdventureState {
    levelId: number;
    goals: TLevelGoal[];
    /** Gems collected so far, indexed by gem type (index 0 unused). */
    collected: number[];
    par: number;
    /** Moves allowed before the level ends. Missing in saves from before move limits, which then have none. */
    moveLimit?: number;
    difficulty: number;
}

export interface TGameState {
    version: number;
    mode: TGameMode;
    board: TBoard;
    /** Parallel to `board`. Always all zeros in classic mode. */
    gems: TGem[];
    /** Present in adventure mode only. */
    adventure: TAdventureState | null;
    tray: TTray;
    score: number;
    /** Current streak multiplier. 0 means no streak is running. */
    combo: number;
    /** Placements since the last clear; the streak ends when this reaches COMBO_WINDOW. */
    movesSinceClear: number;
    linesCleared: number;
    moves: number;
    revivesUsed: number;
    /** Stuck tray pieces swapped so far (see MAX_RESCUES). Missing in saves from before rescues existed. */
    rescuesUsed?: number;
    /** Hints taken so far (see HINTS_PER_GAME). Missing in saves from before hints existed. */
    hintsUsed?: number;
    /** Quarter turns given to tray pieces so far (see ROTATIONS_PER_GAME). Missing in saves from before rotation. */
    rotationsUsed?: number;
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
    /** Tray slots whose piece no longer fit anywhere and was swapped for one that does. */
    rescuedSlots: number[];
    gameOver: boolean;
    /** Adventure: the game ended because the level's moves ran out. */
    outOfMoves: boolean;
    collectedGems: { index: number; gem: TGem }[];
    /** Adventure: every goal of the level is met. */
    won: boolean;
}

export interface TMoveResult {
    state: TGameState;
    event: TMoveEvent;
}

export interface TReviveResult {
    state: TGameState;
    clearedCells: number[];
}
