// Tuning aid, not a unit test: a greedy bot plays every adventure level 5 times and prints win rates.
// Run with `pnpm bench:levels` after changing anything in levels.ts or the dealer.
import {
    createAdventureGame,
    createGame,
    findHint,
    findPlacements,
    getLevel,
    getShape,
    LEVEL_COUNT,
    placePiece,
    TGameState,
} from "@engine";

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

// Following the in-game hint on every move shows how good the hint's advice is.
it("hint plays every level", () => {
    let wins = 0;
    let slowest = 0;
    const lost: string[] = [];
    for (let id = 1; id <= LEVEL_COUNT; id++) {
        let w = 0;
        for (let seed = 1; seed <= 5; seed++) {
            let s = createAdventureGame(getLevel(id), seed);
            let guard = 0;
            while (s.status === "playing" && guard++ < 300) {
                const started = performance.now();
                const m = findHint(s);
                slowest = Math.max(slowest, performance.now() - started);
                if (!m) break;
                s = placePiece(s, m.slot, m.row, m.col)!.state;
            }
            if (s.status === "won") w++;
        }
        wins += w;
        if (w < 5) lost.push(`${id}:${w}/5`);
    }
    console.log("HINT TOTAL", wins, "/", LEVEL_COUNT * 5, `slowest hint ${slowest.toFixed(1)}ms`, lost.join(" "));
});

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

// Classic has no win state, so the readout is how long the same bot survives and what it scores.
it("bot plays classic", () => {
    const GAMES = 40;
    const MOVE_CAP = 600;
    const scores: number[] = [];
    const moves: number[] = [];
    let slowest = 0;
    for (let seed = 1; seed <= GAMES; seed++) {
        let s = createGame(seed);
        while (s.status === "playing" && s.moves < MOVE_CAP) {
            const m = bestMove(s);
            if (!m) break;
            const started = performance.now();
            s = placePiece(s, m.slot, m.row, m.col)!.state;
            slowest = Math.max(slowest, performance.now() - started);
        }
        scores.push(s.score);
        moves.push(s.moves);
    }
    const sorted = (list: number[]) => [...list].sort((a, b) => a - b);
    const median = (list: number[]) => sorted(list)[Math.floor(list.length / 2)];
    console.log(
        `CLASSIC median score ${median(scores)}, median moves ${median(moves)}, shortest game ${sorted(moves)[0]} moves,`,
        `survived ${MOVE_CAP} moves: ${moves.filter((n) => n >= MOVE_CAP).length}/${GAMES},`,
        `slowest move ${slowest.toFixed(1)}ms`
    );
});
