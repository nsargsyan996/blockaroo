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
    rotatePiece,
    ROTATIONS_PER_GAME,
    rotationsLeft,
    shapeTurns,
    TGameState,
} from "@engine";

/** What a quarter turn costs the greedy bot: it turns a piece for a gem or a bigger clear, not to tidy up. */
const BOT_TURN_COST = 150;

type TBotMove = { slot: number; row: number; col: number; turns: number };

// Greedy bot: pick the move that collects the most gems, then clears the most lines, then keeps the board emptiest.
// With `turns` it also tries each piece turned, up to the turns the game has left.
const bestMove = (s: TGameState, turns: boolean) => {
    let best: (TBotMove & { value: number }) | null = null;
    s.tray.forEach((piece, slot) => {
        if (!piece) return;
        shapeTurns(piece.shapeId)
            .slice(0, turns ? rotationsLeft(s) + 1 : 1)
            .forEach((shapeId, turnCount) => {
                const turned = applyTurns(s, slot, turnCount);
                for (const [row, col] of findPlacements(s.board, getShape(shapeId))) {
                    const r = placePiece(turned, slot, row, col)!;
                    const filled = r.state.board.filter(Boolean).length;
                    const value =
                        r.event.collectedGems.length * 1000 +
                        r.event.lines * 100 -
                        filled -
                        turnCount * BOT_TURN_COST +
                        (r.event.won ? 1e6 : 0) -
                        (r.event.gameOver ? 1e5 : 0);
                    if (!best || value > best.value) best = { slot, row, col, turns: turnCount, value };
                }
            });
    });
    return best as TBotMove | null;
};

const applyTurns = (s: TGameState, slot: number, turns: number) => {
    let turned = s;
    for (let i = 0; i < turns; i++) turned = rotatePiece(turned, slot)!;
    return turned;
};

const play = (s: TGameState, m: TBotMove) => placePiece(applyTurns(s, m.slot, m.turns), m.slot, m.row, m.col)!.state;

const BOTS = [
    { name: "no turns", turns: false },
    { name: "with turns", turns: true },
];

/** A player who never turns pieces: with no turns in hand, the rules play out as they did before rotation existed. */
const start = (s: TGameState, turns: boolean): TGameState => (turns ? s : { ...s, rotationsUsed: ROTATIONS_PER_GAME });

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
                const m = findHint(s, rotationsLeft(s));
                slowest = Math.max(slowest, performance.now() - started);
                if (!m) break;
                s = play(s, m);
            }
            if (s.status === "won") w++;
        }
        wins += w;
        if (w < 5) lost.push(`${id}:${w}/5`);
    }
    console.log("HINT TOTAL", wins, "/", LEVEL_COUNT * 5, `slowest hint ${slowest.toFixed(1)}ms`, lost.join(" "));
});

it.each(BOTS)("bot plays every level, $name", ({ name, turns }) => {
    const rows: string[] = [];
    const neverWon: number[] = [];
    let wins = 0;
    for (let id = 1; id <= LEVEL_COUNT; id++) {
        let w = 0,
            movesSum = 0;
        for (let seed = 1; seed <= 5; seed++) {
            let s = start(createAdventureGame(getLevel(id), seed), turns);
            let guard = 0;
            while (s.status === "playing" && guard++ < 300) {
                const m = bestMove(s, turns);
                if (!m) break;
                s = play(s, m);
            }
            if (s.status === "won") {
                w++;
                movesSum += s.moves;
            }
        }
        wins += w;
        if (w === 0) neverWon.push(id);
        rows.push(`${id}:${w}/5 par${getLevel(id).par} avg${w ? Math.round(movesSum / w) : "-"}`);
    }
    console.log(
        rows.join("  "),
        `\nTOTAL (${name})`,
        wins,
        "/",
        LEVEL_COUNT * 5,
        `never won: ${neverWon.join(" ") || "none"}`
    );
});

// Classic has no win state, so the readout is how long the same bot survives and what it scores.
it.each(BOTS)("bot plays classic, $name", ({ name, turns }) => {
    const GAMES = 40;
    const MOVE_CAP = 600;
    const scores: number[] = [];
    const moves: number[] = [];
    let slowest = 0;
    for (let seed = 1; seed <= GAMES; seed++) {
        let s = start(createGame(seed), turns);
        while (s.status === "playing" && s.moves < MOVE_CAP) {
            const m = bestMove(s, turns);
            if (!m) break;
            const started = performance.now();
            s = play(s, m);
            slowest = Math.max(slowest, performance.now() - started);
        }
        scores.push(s.score);
        moves.push(s.moves);
    }
    const sorted = (list: number[]) => [...list].sort((a, b) => a - b);
    const median = (list: number[]) => sorted(list)[Math.floor(list.length / 2)];
    console.log(
        `CLASSIC (${name}) median score ${median(scores)}, median moves ${median(moves)}, shortest game ${sorted(moves)[0]} moves,`,
        `survived ${MOVE_CAP} moves: ${moves.filter((n) => n >= MOVE_CAP).length}/${GAMES},`,
        `slowest move ${slowest.toFixed(1)}ms`
    );
});
