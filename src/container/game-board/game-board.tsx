import { forwardRef, memo, useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";

import { BOARD_SIZE, TBoard } from "@engine";
import { TBoardLayout } from "@hooks";
import { TClearedBlock } from "@store";
import { palette } from "@theme";

import { BoardCell } from "./board-cell";
import { ClearBurst } from "./clear-burst";

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
}

export interface GameBoardProps {
    board: TBoard;
    layout: TBoardLayout;
    preview: TBoardPreview | null;
    /** Cells where a piece just landed, with an id that changes per move. */
    landed: { id: number; cells: number[] } | null;
    burst: TBoardBurst | null;
    onLayout?: () => void;
}

const EMPTY = new Set<number>();
const BORDER = 4;

export const GameBoard = memo(
    forwardRef<View, GameBoardProps>(function GameBoard({ board, layout, preview, landed, burst, onLayout }, ref) {
        const { boardSize, pitch, cellSize, padding, gap } = layout;
        const inset = padding - BORDER + gap / 2;
        const shake = useSharedValue(0);
        const [activeBurst, setActiveBurst] = useState<TBoardBurst | null>(null);

        const ghost = useMemo(() => (preview ? new Set(preview.cells) : EMPTY), [preview]);
        const highlight = useMemo(() => (preview ? new Set(preview.clearCells) : EMPTY), [preview]);
        const landedCells = useMemo(() => new Set(landed?.cells ?? []), [landed]);

        useEffect(() => {
            if (!burst || burst.blocks.length === 0) return;
            setActiveBurst(burst);
            if (burst.lines >= 2) {
                const amount = Math.min(10, 3 + burst.lines * 1.5);
                shake.value = withSequence(
                    withTiming(amount, { duration: 50 }),
                    withTiming(-amount, { duration: 70 }),
                    withTiming(amount * 0.5, { duration: 70 }),
                    withTiming(0, { duration: 60 })
                );
            }
            const timer = setTimeout(() => setActiveBurst(null), 1000);
            return () => clearTimeout(timer);
        }, [burst, shake]);

        const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

        return (
            <Animated.View style={shakeStyle}>
                <View
                    ref={ref}
                    onLayout={onLayout}
                    accessibilityLabel="Game board"
                    style={{
                        width: boardSize,
                        height: boardSize,
                        borderRadius: 26,
                        backgroundColor: palette.board,
                        borderWidth: BORDER,
                        borderColor: palette.ink,
                        shadowColor: palette.ink,
                        shadowOpacity: 0.35,
                        shadowRadius: 0,
                        shadowOffset: { width: 0, height: 6 },
                        elevation: 6,
                    }}
                >
                    {board.map((color, index) => (
                        <BoardCell
                            key={index}
                            color={color}
                            ghostColor={preview && ghost.has(index) ? preview.color : 0}
                            // Cells in a line that would clear light up in the dragged piece's color.
                            highlightColor={preview && highlight.has(index) ? preview.color : 0}
                            popId={landed && landedCells.has(index) ? landed.id : 0}
                            size={cellSize}
                            left={inset + (index % BOARD_SIZE) * pitch}
                            top={inset + Math.floor(index / BOARD_SIZE) * pitch}
                        />
                    ))}
                    {activeBurst ? (
                        <ClearBurst
                            key={activeBurst.id}
                            blocks={activeBurst.blocks}
                            origin={activeBurst.origin}
                            size={cellSize}
                            pitch={pitch}
                            padding={inset}
                        />
                    ) : null}
                </View>
            </Animated.View>
        );
    })
);
