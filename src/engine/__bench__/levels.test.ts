// Tuning aid, not a unit test: a greedy bot plays every adventure level 5 times and prints win rates.
// Run with `pnpm bench:levels` after changing anything in levels.ts or the dealer.
import { createAdventureGame, findPlacements, getLevel, getShape, LEVEL_COUNT, placePiece, TGameState } from "@engine";

// Greedy bot: pick the move that collects the most gems, then clears the most lines, then keeps the board emptiest.
const bestMove = (s: TGameState) => {
    let best: { slot: number; row: number; col: number; value: number } | null = null;
    s.tray.forEach((piece, slot) => {
        if (!piece) return;
        for (const [row, col] of findPlacements(s.board, getShape(piece.shapeId))) {
            const r = placePiece(s, slot, row, col)!;
            const filled = r.state.board.filter(Boolean).length;
            const value =
                r.event.collectedGems.length * 1000 +
                r.event.lines * 100 -
                filled +
                (r.event.won ? 1e6 : 0) -
                (r.event.gameOver ? 1e5 : 0);
            if (!best || value > best.value) best = { slot, row, col, value };
        }
    });
    return best as { slot: number; row: number; col: number } | null;
};

it("bot plays every level", () => {
    const rows: string[] = [];
    let wins = 0;
    for (let id = 1; id <= LEVEL_COUNT; id++) {
        let w = 0,
            movesSum = 0;
        for (let seed = 1; seed <= 5; seed++) {
            let s = createAdventureGame(getLevel(id), seed);
            let guard = 0;
            while (s.status === "playing" && guard++ < 300) {
                const m = bestMove(s);
                if (!m) break;
                s = placePiece(s, m.slot, m.row, m.col)!.state;
            }
            if (s.status === "won") {
                w++;
                movesSum += s.moves;
            }
        }
        wins += w;
        rows.push(`${id}:${w}/5 par${getLevel(id).par} avg${w ? Math.round(movesSum / w) : "-"}`);
    }
    console.log(rows.join("  "), "\nTOTAL", wins, "/", LEVEL_COUNT * 5);
});
