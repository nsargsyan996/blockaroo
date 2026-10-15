import { memo } from "react";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { Piece } from "@component";
import { GAME_CONFIG } from "@config";
import { getShape, TPiece } from "@engine";
import { TBoardLayout } from "@hooks";

import { TDragShared } from "../piece-tray";

export interface DragLayerProps {
    piece: TPiece | null;
    layout: TBoardLayout;
    drag: TDragShared;
}

/** Draws the piece being dragged above the finger, growing from tray size to board size as it lifts. */
export const DragLayer = memo(function DragLayer({ piece, layout, drag }: DragLayerProps) {
    const { pitch, gap } = layout;
    const shape = piece ? getShape(piece.shapeId) : null;
    const width = shape ? shape.cols * pitch : 0;
    const height = shape ? shape.rows * pitch : 0;
    const lift = GAME_CONFIG.dragLiftCells * pitch;
    const startScale = GAME_CONFIG.trayScale;

    const style = useAnimatedStyle(() => {
        const scale = startScale + (1 - startScale) * drag.grow.value;
        // While growing, ease the lift in too, so the piece rises out from under the finger.
        const rise = (lift + height / 2) * drag.grow.value;
        return {
            opacity: drag.slot.value >= 0 ? 1 : 0,
            transform: [
                { translateX: drag.x.value - drag.rootX.value - width / 2 },
                { translateY: drag.y.value - drag.rootY.value - height / 2 - rise },
                { scale },
            ],
        };
    });

    if (!piece) return null;
    return (
        <Animated.View pointerEvents="none" style={[{ position: "absolute", left: 0, top: 0, width, height }, style]}>
            <Piece shapeId={piece.shapeId} color={piece.color} pitch={pitch} gap={gap} />
        </Animated.View>
    );
});
