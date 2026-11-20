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

/** Times per game a tray piece that no longer fits anywhere is swapped for one that does, instead of ending the game. */
export const MAX_RESCUES = 1;
/** Hints the player can ask for in one game. */
export const HINTS_PER_GAME = 3;
/** Quarter turns the player can give tray pieces in one game. */
export const ROTATIONS_PER_GAME = 5;

/** Score at which the classic dealer reaches its hardest mix. */
export const DIFFICULTY_MAX_SCORE = 5500;

/** Bumped whenever the saved game shape changes; older saves are discarded on load. */
export const GAME_STATE_VERSION = 2;

/** Gem kinds in adventure levels. */
export const GEM_TYPES = 3;
/** Block color used for the block that holds each gem type (index 0 unused). */
export const GEM_BLOCK_COLORS = [0, 1, 6, 3];
export const LEVEL_COUNT = 100;
/** Adventure: moves a revive adds when a level ran out of moves. */
export const REVIVE_EXTRA_MOVES = 5;
/** Adventure: chance that a newly dealt piece carries a gem the level still needs. */
export const PIECE_GEM_CHANCE = 0.25;
