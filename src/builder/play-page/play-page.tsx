import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SkyBackground } from "@component";
import { GAME_CONFIG } from "@config";
import {
    DragLayer,
    GameBoard,
    GameHud,
    GameOverCard,
    PieceTray,
    PraiseBanner,
    TBoardBurst,
    TBoardPreview,
    useDragShared,
} from "@container";
import { canRevive, cellIndex, getShape, previewClears } from "@engine";
import { useBoardLayout, useRewardedReady } from "@hooks";
import { ads, haptic, playSound } from "@service";
import { TLastMove, useGameStore } from "@store";
import { resolveDropTarget } from "@util";
import { useRouter } from "expo-router";

const moveFeedback = (move: TLastMove) => {
    if (move.perfectClear) {
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

export const PlayPage = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const layout = useBoardLayout();
    const drag = useDragShared();

    const game = useGameStore((state) => state.game);
    const best = useGameStore((state) => state.best);
    const bestAtStart = useGameStore((state) => state.bestAtStart);
    const lastMove = useGameStore((state) => state.lastMove);
    const reviveFlash = useGameStore((state) => state.reviveFlash);
    const hasHydrated = useGameStore((state) => state.hasHydrated);
    const startGame = useGameStore((state) => state.startGame);
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
    const [showOver, setShowOver] = useState(false);
    const [reviving, setReviving] = useState(false);

    useEffect(() => {
        if (hasHydrated && !game) startGame();
    }, [hasHydrated, game, startGame]);

    // A game that ended while the app was closed opens straight on the result card.
    useEffect(() => {
        if (game?.status === "over" && !lastMove) setShowOver(true);
    }, [game?.status, lastMove]);

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
        const current = useGameStore.getState().game;
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
            if (move.gameOver) {
                setTimeout(() => {
                    setShowOver(true);
                    playSound("gameover");
                    haptic("gameover");
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
            setShowOver(false);
            playSound("revive");
            haptic("big");
        }
    }, [reviveGame]);

    const onPlayAgain = useCallback(async () => {
        await ads.maybeShowInterstitial(useGameStore.getState().gamesFinished);
        setShowOver(false);
        startGame();
    }, [startGame]);

    const goHome = useCallback(() => {
        if (router.canGoBack()) router.back();
        else router.replace("/");
    }, [router]);

    const burst = useMemo<TBoardBurst | null>(() => {
        if (reviveFlash && (!lastMove || reviveFlash.id > lastMove.id)) {
            return { id: reviveFlash.id, blocks: reviveFlash.blocks, origin: cellIndex(4, 4), lines: 3 };
        }
        if (lastMove && lastMove.lines > 0) {
            return {
                id: lastMove.id,
                blocks: lastMove.clearedBlocks,
                origin: lastMove.placedCells[0] ?? 0,
                lines: lastMove.lines,
            };
        }
        return null;
    }, [lastMove, reviveFlash]);

    const landed = useMemo(() => (lastMove ? { id: lastMove.id, cells: lastMove.placedCells } : null), [lastMove]);
    const activePiece = game && activeSlot >= 0 ? game.tray[activeSlot] : null;

    return (
        <SkyBackground>
            <View
                ref={rootRef}
                onLayout={measure}
                className="flex-1 items-center"
                style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8, paddingHorizontal: 12 }}
            >
                {game ? (
                    <>
                        <View style={{ width: layout.boardSize }}>
                            <GameHud score={game.score} best={best} onHome={goHome} />
                        </View>
                        <View className="flex-1 justify-center">
                            <View>
                                <GameBoard
                                    ref={boardRef}
                                    board={game.board}
                                    layout={layout}
                                    preview={preview}
                                    landed={landed}
                                    burst={burst}
                                    onLayout={measure}
                                />
                                <PraiseBanner move={lastMove} />
                            </View>
                        </View>
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
                    </>
                ) : null}
                <DragLayer piece={activePiece} layout={layout} drag={drag} />
                {game && showOver ? (
                    <GameOverCard
                        score={game.score}
                        best={best}
                        isNewBest={game.score > bestAtStart && game.score > 0}
                        canRevive={canRevive(game) && rewardedReady}
                        reviving={reviving}
                        onRevive={onRevive}
                        onPlayAgain={onPlayAgain}
                        onHome={goHome}
                    />
                ) : null}
            </View>
        </SkyBackground>
    );
};
