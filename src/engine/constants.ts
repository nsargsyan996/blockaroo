export const BOARD_SIZE = 8;
export const CELL_COUNT = BOARD_SIZE * BOARD_SIZE;
export const TRAY_SIZE = 3;

/** Block colors are 1..COLOR_COUNT; the UI maps each to a palette entry. */
export const COLOR_COUNT = 7;

/** Placements in a row without a clear before a streak ends. */
export const COMBO_WINDOW = 3;
export const MAX_COMBO = 10;
export const PERFECT_CLEAR_BONUS = 500;

/** One revive per game, granted by a rewarded ad. */
export const MAX_REVIVES = 1;
export const REVIVE_ROWS_CLEARED = 3;

/** Score at which the dealer reaches its hardest mix. Kept high so young players get a long, gentle ramp. */
export const DIFFICULTY_MAX_SCORE = 8000;

export const GAME_STATE_VERSION = 1;
