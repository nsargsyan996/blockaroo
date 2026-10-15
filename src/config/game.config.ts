/** Feel and layout tuning for the play screen. Engine rules live in @engine/constants. */
export const GAME_CONFIG = {
    /** Largest board edge in points; tablets get a bigger board but not a huge one. */
    maxBoardSize: 460,
    boardPadding: 8,
    cellGap: 3,
    /** Tray pieces are drawn at this fraction of a board cell. */
    trayScale: 0.6,
    /**
     * How far above the finger a dragged piece floats, in cells, so small fingers never hide where it will land.
     */
    dragLiftCells: 1.4,
    /** A drop this close (in cells) to a valid spot snaps into it, which forgives slightly-off drops. */
    snapTolerance: 0.7,
    gameOverDelayMs: 700,
} as const;
