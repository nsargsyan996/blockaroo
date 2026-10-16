import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AdBanner, AppBackground } from "@component";
import { GAME_CONFIG } from "@config";
import {
    DragLayer,
    GameBoard,
    GameHud,
    GameOverCard,
    GoalsBar,
    LevelCompleteCard,
    PieceTray,
    PraiseBanner,
    TBoardBurst,
    TBoardPreview,
    useDragShared,
} from "@container";
import { canRevive, cellIndex, getShape, LEVEL_COUNT, previewClears, starsFor } from "@engine";
import { useBoardLayout, useRewardedReady } from "@hooks";
import { ads, haptic, playSound } from "@service";
import { selectActiveGame, TLastMove, useGameStore } from "@store";
import { resolveDropTarget } from "@util";
import { useRouter } from "expo-router";

const moveFeedback = (move: TLastMove) => {
    if (move.perfectClear || move.won) {
        playSound("perfect");
        haptic("big");
    } else if (move.lines >= 3 || (move.lines > 0 && move.combo >= 2)) {
        playSound("combo");
        haptic("big");
    } else if (move.lines > 0) {
        playSound("clear");
        haptic("clear");
    } else {
        playSound("place");
        haptic("place");
    }
};

type TResult = "none" | "over" | "won";

export const PlayPage = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const layout = useBoardLayout();
    const drag = useDragShared();

    const game = useGameStore(selectActiveGame);
    const mode = useGameStore((state) => state.activeMode);
    const best = useGameStore((state) => state.best);
    const bestAtStart = useGameStore((state) => state.bestAtStart);
    const lastMove = useGameStore((state) => state.lastMove);
    const reviveFlash = useGameStore((state) => state.reviveFlash);
    const hasHydrated = useGameStore((state) => state.hasHydrated);
    const startClassic = useGameStore((state) => state.startClassic);
    const startLevel = useGameStore((state) => state.startLevel);
    const place = useGameStore((state) => state.place);
    const reviveGame = useGameStore((state) => state.revive);
    const rewardedReady = useRewardedReady();

    const rootRef = useRef<View>(null);
    const boardRef = useRef<View>(null);
    const slotRef = useRef(-1);
    const targetRef = useRef<{ row: number; col: number } | null>(null);
    const overBoardRef = useRef(false);
    const [activeSlot, setActiveSlot] = useState(-1);
    const [preview, setPreview] = useState<TBoardPreview | null>(null);
    const [result, setResult] = useState<TResult>("none");
    const [reviving, setReviving] = useState(false);

    useEffect(() => {
        if (hasHydrated && !game) {
            if (mode === "adventure") startLevel(useGameStore.getState().progress.unlocked);
            else startClassic();
        }
    }, [hasHydrated, game, mode, startClassic, startLevel]);

    // A game that ended while the app was closed opens straight on its result card.
    useEffect(() => {
        if (lastMove || !game) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-off sync from the persisted store on hydration
        if (game.status === "over") setResult("over");
        else if (game.status === "won") setResult("won");
    }, [game, lastMove]);

    const measure = useCallback(() => {
        rootRef.current?.measureInWindow((x, y) => {
            drag.rootX.value = x;
            drag.rootY.value = y;
        });
        boardRef.current?.measureInWindow((x, y) => {
            drag.boardX.value = x + layout.padding;
            drag.boardY.value = y + layout.padding;
        });
    }, [drag, layout.padding]);

    const onPickUp = useCallback(
        (slot: number) => {
            slotRef.current = slot;
            targetRef.current = null;
            overBoardRef.current = false;
            setActiveSlot(slot);
            playSound("pickup");
            haptic("pickup");
            measure();
        },
        [measure]
    );

    const onHover = useCallback((fx: number, fy: number) => {
        const current = selectActiveGame(useGameStore.getState());
        const piece = current?.tray[slotRef.current];
        if (!current || !piece) return;
        const shape = getShape(piece.shapeId);
        overBoardRef.current = fx > -shape.cols && fx < 8 && fy > -shape.rows && fy < 8;
        const target = resolveDropTarget(current.board, shape, fx, fy, GAME_CONFIG.snapTolerance);
        const previous = targetRef.current;
        if (target?.row === previous?.row && target?.col === previous?.col) return;
        targetRef.current = target;
        if (!target) {
            setPreview(null);
            return;
        }
        setPreview({
            cells: shape.cells.map(([dr, dc]) => cellIndex(target.row + dr, target.col + dc)),
            color: piece.color,
            clearCells: previewClears(current.board, shape, target.row, target.col).cells,
        });
    }, []);

    const onRelease = useCallback(
        (slot: number) => {
            const target = targetRef.current;
            targetRef.current = null;
            slotRef.current = -1;
            setActiveSlot(-1);
            setPreview(null);
            if (!target) {
                if (overBoardRef.current) {
                    playSound("invalid");
                    haptic("invalid");
                }
                return;
            }
            const move = place(slot, target.row, target.col);
            if (!move) return;
            moveFeedback(move);
            if (move.won || move.gameOver) {
                setTimeout(() => {
                    setResult(move.won ? "won" : "over");
                    if (move.gameOver) {
                        playSound("gameover");
                        haptic("gameover");
                    }
                }, GAME_CONFIG.gameOverDelayMs);
            }
        },
        [place]
    );

    const onRevive = useCallback(async () => {
        setReviving(true);
        const earned = await ads.showRewarded();
        setReviving(false);
        if (earned && reviveGame()) {
            setResult("none");
            playSound("revive");
            haptic("big");
        }
    }, [reviveGame]);

    /** Between-game ad (when pacing allows), then the next game. */
    const afterAd = useCallback(async (next: () => void) => {
        await ads.maybeShowInterstitial(useGameStore.getState().gamesFinished);
        setResult("none");
        next();
    }, []);

    const levelId = game?.adventure?.levelId ?? 0;
    const onPlayAgain = useCallback(
        () => afterAd(() => (mode === "adventure" ? startLevel(levelId) : startClassic())),
        [afterAd, mode, levelId, startLevel, startClassic]
    );
    const onNextLevel = useCallback(() => afterAd(() => startLevel(levelId + 1)), [afterAd, levelId, startLevel]);

    const leave = useCallback(() => {
        if (mode === "adventure") router.replace("/levels");
        else if (router.canGoBack()) router.back();
        else router.replace("/");
    }, [router, mode]);

    const burst = useMemo<TBoardBurst | null>(() => {
        if (reviveFlash && (!lastMove || reviveFlash.id > lastMove.id)) {
            return {
                id: reviveFlash.id,
                blocks: reviveFlash.blocks,
                origin: cellIndex(4, 4),
                lines: 3,
                rows: [],
                cols: [],
                points: 0,
                big: true,
            };
        }
        if (lastMove && lastMove.lines > 0) {
            return {
                id: lastMove.id,
                blocks: lastMove.clearedBlocks,
                origin: lastMove.placedCells[0] ?? 0,
                lines: lastMove.lines,
                rows: lastMove.clearedRows,
                cols: lastMove.clearedCols,
                points: lastMove.points,
                big: lastMove.lines >= 3 || lastMove.perfectClear,
            };
        }
        return null;
    }, [lastMove, reviveFlash]);

    const landed = useMemo(
        () => (lastMove ? { id: lastMove.id, cells: lastMove.placedCells, color: lastMove.pieceColor } : null),
        [lastMove]
    );
    const activePiece = game && activeSlot >= 0 ? game.tray[activeSlot] : null;
    const adventure = game?.adventure ?? null;

    const hud = game ? (
        <View className="w-full gap-2">
            <GameHud score={game.score} best={best} levelId={adventure?.levelId} onHome={leave} />
            <GoalsBar game={game} />
        </View>
    ) : null;
    const boardView = game ? (
        <View>
            <GameBoard
                ref={boardRef}
                board={game.board}
                gems={game.gems}
                layout={layout}
                preview={preview}
                landed={landed}
                burst={burst}
                onLayout={measure}
            />
            <PraiseBanner move={lastMove} />
        </View>
    ) : null;
    const tray = game ? (
        <PieceTray
            tray={game.tray}
            board={game.board}
            layout={layout}
            drag={drag}
            activeSlot={activeSlot}
            disabled={game.status !== "playing"}
            onPickUp={onPickUp}
            onHover={onHover}
            onRelease={onRelease}
        />
    ) : null;

    return (
        <AppBackground>
            <View
                ref={rootRef}
                onLayout={measure}
                className="flex-1 items-center"
                style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 6, paddingHorizontal: 12 }}
            >
                {game ? (
                    layout.landscape ? (
                        // Landscape: board on the left, score, goals, pieces and banner in a column beside it.
                        <View className="flex-1 flex-row items-center justify-center gap-4">
                            {boardView}
                            <View className="h-full justify-between gap-2 py-1" style={{ width: layout.sideWidth }}>
                                {hud}
                                <View className="flex-1 items-center justify-center">{tray}</View>
                                <AdBanner />
                            </View>
                        </View>
                    ) : (
                        <>
                            <View style={{ width: layout.boardSize }}>{hud}</View>
                            <View className="flex-1 justify-center">{boardView}</View>
                            {tray}
                            <AdBanner />
                        </>
                    )
                ) : null}
                <DragLayer piece={activePiece} layout={layout} drag={drag} />
                {game && result === "over" ? (
                    <GameOverCard
                        game={game}
                        best={best}
                        isNewBest={mode === "classic" && game.score > bestAtStart && game.score > 0}
                        canRevive={canRevive(game) && rewardedReady}
                        reviving={reviving}
                        onRevive={onRevive}
                        onPlayAgain={onPlayAgain}
                        onHome={leave}
                    />
                ) : null}
                {game && adventure && result === "won" ? (
                    <LevelCompleteCard
                        levelId={adventure.levelId}
                        stars={lastMove?.stars || starsFor(game.moves, adventure.par)}
                        moves={game.moves}
                        par={adventure.par}
                        isLastLevel={adventure.levelId >= LEVEL_COUNT}
                        onNext={onNextLevel}
                        onReplay={onPlayAgain}
                        onLevels={leave}
                    />
                ) : null}
            </View>
        </AppBackground>
    );
};
