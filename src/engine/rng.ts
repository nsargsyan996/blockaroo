/**
 * Small seeded PRNG (mulberry32). The game keeps its state as a plain number, so a saved game resumes with the
 * same upcoming pieces and tests are deterministic.
 */
export interface TRng {
    next: () => number;
    int: (maxExclusive: number) => number;
    state: () => number;
}

export const createRng = (seed: number): TRng => {
    let state = seed >>> 0;

    const next = () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    return {
        next,
        int: (maxExclusive) => Math.floor(next() * maxExclusive),
        state: () => state,
    };
};

export const randomSeed = () => Math.floor(Math.random() * 4294967296) >>> 0;

/** Picks an item with probability proportional to its weight. */
export const pickWeighted = <T>(rng: TRng, items: T[], weightOf: (item: T) => number): T => {
    const total = items.reduce((sum, item) => sum + weightOf(item), 0);
    let roll = rng.next() * total;
    for (const item of items) {
        roll -= weightOf(item);
        if (roll < 0) return item;
    }
    return items[items.length - 1];
};
