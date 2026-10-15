export type TPraiseKey = "nice" | "great" | "super" | "amazing" | "rootastic" | "perfect";

/** Picks the cheer for a clear: more lines at once and longer streaks get bigger words. */
export const praiseFor = ({ lines, combo, perfectClear }: { lines: number; combo: number; perfectClear: boolean }) => {
    if (perfectClear) return "perfect" satisfies TPraiseKey;
    if (lines <= 0) return null;
    const power = lines + Math.max(0, combo - 1);
    if (power >= 6) return "rootastic" satisfies TPraiseKey;
    if (power >= 4) return "amazing" satisfies TPraiseKey;
    if (power >= 3) return "super" satisfies TPraiseKey;
    if (power >= 2) return "great" satisfies TPraiseKey;
    return "nice" satisfies TPraiseKey;
};
