import { COMBO_WINDOW, MAX_COMBO, PERFECT_CLEAR_BONUS } from "./constants";

/** Clearing more lines at once is worth much more: 1 line = 80, 2 = 240, 3 = 480, 4 = 800. */
export const linePoints = (lines: number) => 40 * lines * (lines + 1);

export interface TStreak {
    combo: number;
    movesSinceClear: number;
}

/**
 * A streak grows each time a placement clears a line, as long as the previous clear was fewer than COMBO_WINDOW
 * placements ago. Placements that clear nothing count toward ending it.
 */
export const nextStreak = (previous: TStreak, lines: number): TStreak => {
    if (lines > 0) {
        const alive = previous.combo > 0 && previous.movesSinceClear < COMBO_WINDOW;
        return { combo: alive ? Math.min(previous.combo + 1, MAX_COMBO) : 1, movesSinceClear: 0 };
    }
    const movesSinceClear = previous.movesSinceClear + 1;
    return { combo: movesSinceClear >= COMBO_WINDOW ? 0 : previous.combo, movesSinceClear };
};

export const movePoints = ({
    cellsPlaced,
    lines,
    combo,
    perfectClear,
}: {
    cellsPlaced: number;
    lines: number;
    combo: number;
    perfectClear: boolean;
}) => cellsPlaced + (lines > 0 ? linePoints(lines) * Math.max(combo, 1) : 0) + (perfectClear ? PERFECT_CLEAR_BONUS : 0);
