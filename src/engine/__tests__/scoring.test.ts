import { COMBO_WINDOW, MAX_COMBO, PERFECT_CLEAR_BONUS } from "../constants";
import { linePoints, movePoints, nextStreak } from "../scoring";

describe("scoring", () => {
    it("rewards clearing several lines at once", () => {
        expect(linePoints(1)).toBe(80);
        expect(linePoints(2)).toBe(240);
        expect(linePoints(3)).toBe(480);
    });

    it("scores placed cells, cleared lines times the streak, and a perfect clear", () => {
        expect(movePoints({ cellsPlaced: 4, lines: 0, combo: 3, perfectClear: false })).toBe(4);
        expect(movePoints({ cellsPlaced: 4, lines: 2, combo: 3, perfectClear: false })).toBe(4 + 240 * 3);
        expect(movePoints({ cellsPlaced: 1, lines: 1, combo: 1, perfectClear: true })).toBe(
            1 + 80 + PERFECT_CLEAR_BONUS
        );
    });

    it("starts a streak on the first clear and grows it on later clears", () => {
        const first = nextStreak({ combo: 0, movesSinceClear: 5 }, 1);
        expect(first).toEqual({ combo: 1, movesSinceClear: 0 });
        expect(nextStreak(first, 2)).toEqual({ combo: 2, movesSinceClear: 0 });
    });

    it("keeps a streak alive through a few placements that clear nothing", () => {
        let streak = { combo: 2, movesSinceClear: 0 };
        for (let i = 1; i < COMBO_WINDOW; i++) {
            streak = nextStreak(streak, 0);
            expect(streak.combo).toBe(2);
        }
        expect(nextStreak(streak, 1).combo).toBe(3);
        expect(nextStreak(streak, 0).combo).toBe(0);
    });

    it("caps the streak", () => {
        expect(nextStreak({ combo: MAX_COMBO, movesSinceClear: 0 }, 1).combo).toBe(MAX_COMBO);
    });
});
