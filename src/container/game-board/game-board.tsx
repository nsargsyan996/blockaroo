import { forwardRef, memo, useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";

import { BOARD_SIZE, TBoard, TGem } from "@engine";
import { TBoardLayout } from "@hooks";
import { TClearedBlock } from "@store";
import { palette } from "@theme";

import { Blast, BLAST_DURATION_MS } from "./blast";
import { BoardCell } from "./board-cell";
import { LandingFx } from "./landing-fx";

export interface TBoardPreview {
    cells: number[];
    color: number;
    clearCells: number[];
}

/** Blocks that just disappeared (a line clear or a revive). `id` changes each time so the effect replays. */
export interface TBoardBurst {
    id: number;
    blocks: TClearedBlock[];
    origin: number;
    lines: number;
    rows: number[];
    cols: number[];
    /** Points the move scored, floated up from the landing point (0 hides it). */
    points: number;
    /** 3+ lines or a perfect clear: the biggest version of the blast. */
    big: boolean;
}

export interface GameBoardProps {
    board: TBoard;
    gems: TGem[];
    layout: TBoardLayout;
    preview: TBoardPreview | null;
    /** Cells where a piece just landed, with an id that changes per move. */
    landed: { id: number; cells: number[]; color: number } | null;
    burst: TBoardBurst | null;
    onLayout?: () => void;
}

const EMPTY = new Set<number>();
const BORDER = 2;

export const GameBoard = memo(
    forwardRef<View, GameBoardProps>(function GameBoard(
        { board, gems, layout, preview, landed, burst, onLayout },
        ref
    ) {
        const { boardSize, pitch, cellSize, padding, gap } = layout;
        const inset = padding - BORDER + gap / 2;
        const shake = useSharedValue(0);
        const bump = useSharedValue(1);
        const [activeBurst, setActiveBurst] = useState<TBoardBurst | null>(null);

        const ghost = useMemo(() => (preview ? new Set(preview.cells) : EMPTY), [preview]);
        const highlight = useMemo(() => (preview ? new Set(preview.clearCells) : EMPTY), [preview]);
        const landedCells = useMemo(() => new Set(landed?.cells ?? []), [landed]);

        useEffect(() => {
            if (!burst || burst.blocks.length === 0) return;
            setActiveBurst(burst);
            if (burst.lines >= 2 || burst.big) {
                const amount = Math.min(12, 3 + burst.lines * 2);
                shake.value = withSequence(
                    withTiming(amount, { duration: 50 }),
                    withTiming(-amount, { duration: 70 }),
                    withTiming(amount * 0.5, { duration: 70 }),
                    withTiming(0, { duration: 60 })
                );
            }
            const timer = setTimeout(() => setActiveBurst(null), BLAST_DURATION_MS + 100);
            return () => clearTimeout(timer);
        }, [burst, shake]);

        // Every drop gives the board a tiny press, so placing a piece feels physical.
        useEffect(() => {
            if (!landed) return;
            bump.value = withSequence(withTiming(0.985, { duration: 70 }), withTiming(1, { duration: 160 }));
        }, [landed, bump]);

        const shakeStyle = useAnimatedStyle(() => ({
            transform: [{ translateX: shake.value }, { scale: bump.value }],
        }));

        return (
            <Animated.View style={shakeStyle}>
                <View
                    ref={ref}
                    onLayout={onLayout}
                    accessibilityLabel="Game board"
                    style={{
                        width: boardSize,
                        height: boardSize,
                        borderRadius: 22,
                        backgroundColor: palette.board,
                        borderWidth: BORDER,
                        borderColor: palette.glassBorder,
                        shadowColor: "#000000",
                        shadowOpacity: 0.45,
                        shadowRadius: 24,
                        shadowOffset: { width: 0, height: 12 },
                        elevation: 10,
                    }}
                >
                    {board.map((color, index) => (
                        <BoardCell
                            key={index}
                            color={color}
                            gem={gems[index] ?? 0}
                            ghostColor={preview && ghost.has(index) ? preview.color : 0}
                            // Cells in a line that would clear light up in the dragged piece's color.
                            highlightColor={preview && highlight.has(index) ? preview.color : 0}
                            popId={landed && landedCells.has(index) ? landed.id : 0}
                            size={cellSize}
                            left={inset + (index % BOARD_SIZE) * pitch}
                            top={inset + Math.floor(index / BOARD_SIZE) * pitch}
                        />
                    ))}
                    {landed && landed.cells.length > 0 ? (
                        <LandingFx
                            key={`land-${landed.id}`}
                            cells={landed.cells}
                            color={landed.color}
                            size={cellSize}
                            pitch={pitch}
                            padding={inset}
                        />
                    ) : null}
                    {activeBurst ? (
                        <Blast
                            key={activeBurst.id}
                            blocks={activeBurst.blocks}
                            rows={activeBurst.rows}
                            cols={activeBurst.cols}
                            origin={activeBurst.origin}
                            points={activeBurst.points}
                            big={activeBurst.big}
                            size={cellSize}
                            pitch={pitch}
                            padding={inset}
                            boardSize={boardSize}
                        />
                    ) : null}
                </View>
            </Animated.View>
        );
    })
);
