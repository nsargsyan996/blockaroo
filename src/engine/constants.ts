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

/** Score at which the classic dealer reaches its hardest mix. */
export const DIFFICULTY_MAX_SCORE = 5000;

/** Bumped whenever the saved game shape changes; older saves are discarded on load. */
export const GAME_STATE_VERSION = 2;

/** Gem kinds in adventure levels. */
export const GEM_TYPES = 3;
/** Block color used for the block that holds each gem type (index 0 unused). */
export const GEM_BLOCK_COLORS = [0, 1, 6, 3];
export const LEVEL_COUNT = 60;
