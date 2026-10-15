import { createRng, pickWeighted, randomSeed } from "../rng";

describe("rng", () => {
    it("repeats the same sequence for the same seed and resumes from its state", () => {
        const a = createRng(42);
        const b = createRng(42);
        const first = [a.next(), a.next(), a.next()];
        expect([b.next(), b.next(), b.next()]).toEqual(first);

        const resumed = createRng(a.state());
        expect(resumed.next()).toBe(a.next());
    });

    it("returns integers in range", () => {
        const rng = createRng(7);
        for (let i = 0; i < 500; i++) {
            const value = rng.int(5);
            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThan(5);
        }
    });

    it("picks items in proportion to their weight", () => {
        const rng = createRng(1);
        const counts = { a: 0, b: 0 };
        for (let i = 0; i < 4000; i++) counts[pickWeighted(rng, ["a", "b"] as const, (k) => (k === "a" ? 3 : 1))]++;
        expect(counts.a / counts.b).toBeGreaterThan(2.5);
        expect(counts.a / counts.b).toBeLessThan(3.5);
        expect(pickWeighted(rng, ["only"], () => 0)).toBe("only");
    });

    it("creates seeds in the 32-bit range", () => {
        const seed = randomSeed();
        expect(seed).toBeGreaterThanOrEqual(0);
        expect(seed).toBeLessThan(2 ** 32);
    });
});
