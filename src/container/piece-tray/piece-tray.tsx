import { memo, useEffect, useMemo } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming,
} from "react-native-reanimated";

import { Piece, pieceSize } from "@component";
import { GAME_CONFIG } from "@config";
import { canFitAnywhere, getShape, TBoard, TPiece, TTray } from "@engine";
import { TBoardLayout } from "@hooks";

import { TDragShared } from "./drag.type";

export interface PieceTrayProps {
    tray: TTray;
    board: TBoard;
    layout: TBoardLayout;
    drag: TDragShared;
    activeSlot: number;
    disabled: boolean;
    onPickUp: (slot: number) => void;
    /** Fractional grid position of the piece's top-left cell. */
    onHover: (fx: number, fy: number) => void;
    onRelease: (slot: number) => void;
}

interface TraySlotProps extends Omit<PieceTrayProps, "tray" | "activeSlot"> {
    piece: TPiece | null;
    slot: number;
    hidden: boolean;
}

const TraySlot = memo(function TraySlot(props: TraySlotProps) {
    const { piece, slot, board, layout, drag, hidden, disabled, onPickUp, onHover, onRelease } = props;
    const { trayPitch, pitch, gap, slotWidth, slotHeight } = layout;
    const enter = useSharedValue(0);

    // New pieces bounce into the tray one after another.
    useEffect(() => {
        if (!piece) return;
        enter.value = 0;
        enter.value = withDelay(slot * 70, withSpring(1, { damping: 11, stiffness: 180 }));
    }, [piece, slot, enter]);

    const fits = useMemo(() => (piece ? canFitAnywhere(board, getShape(piece.shapeId)) : false), [board, piece]);

    const gesture = useMemo(() => {
        const shape = piece ? getShape(piece.shapeId) : null;
        const width = shape ? shape.cols * pitch : 0;
        const height = shape ? shape.rows * pitch : 0;
        const lift = GAME_CONFIG.dragLiftCells * pitch;
        return Gesture.Pan()
            .enabled(!!piece && !disabled)
            .minDistance(0)
            .shouldCancelWhenOutside(false)
            .onBegin((event) => {
                drag.x.value = event.absoluteX;
                drag.y.value = event.absoluteY;
                drag.slot.value = slot;
                drag.lastKey.value = -1;
                drag.grow.value = withTiming(1, { duration: 120 });
                runOnJS(onPickUp)(slot);
            })
            .onUpdate((event) => {
                drag.x.value = event.absoluteX;
                drag.y.value = event.absoluteY;
                const fx = (event.absoluteX - width / 2 - drag.boardX.value) / pitch;
                const fy = (event.absoluteY - lift - height - drag.boardY.value) / pitch;
                const key = (Math.round(fy) + 20) * 100 + (Math.round(fx) + 20);
                if (key !== drag.lastKey.value) {
                    drag.lastKey.value = key;
                    runOnJS(onHover)(fx, fy);
                }
            })
            .onFinalize(() => {
                drag.slot.value = -1;
                drag.grow.value = 0;
                runOnJS(onRelease)(slot);
            });
    }, [piece, pitch, disabled, drag, slot, onPickUp, onHover, onRelease]);

    const style = useAnimatedStyle(() => ({ transform: [{ scale: enter.value }] }));

    const size = piece ? pieceSize(piece.shapeId, trayPitch) : { width: 0, height: 0 };
    return (
        <GestureDetector gesture={gesture}>
            <View
                style={{ width: slotWidth, height: slotHeight }}
                className="items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel={piece ? `Piece ${slot + 1}` : undefined}
            >
                {piece ? (
                    <Animated.View
                        style={[
                            style,
                            { opacity: hidden ? 0 : fits ? 1 : 0.35, width: size.width, height: size.height },
                        ]}
                    >
                        <Piece shapeId={piece.shapeId} color={piece.color} pitch={trayPitch} gap={gap * 0.6} />
                    </Animated.View>
                ) : null}
            </View>
        </GestureDetector>
    );
});

/**
 * The three pieces to place, side by side: under the board in portrait, in the side column in landscape. Each slot
 * is a big touch target; a piece that cannot fit anywhere is dimmed.
 */
export const PieceTray = memo(function PieceTray({ tray, activeSlot, ...rest }: PieceTrayProps) {
    return (
        <View className="flex-row">
            {tray.map((piece, slot) => (
                <TraySlot
                    key={piece?.uid ?? `empty-${slot}`}
                    piece={piece}
                    slot={slot}
                    hidden={activeSlot === slot}
                    {...rest}
                />
            ))}
        </View>
    );
});
