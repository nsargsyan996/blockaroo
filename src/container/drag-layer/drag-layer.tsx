import { memo } from "react";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { Piece } from "@component";
import { GAME_CONFIG } from "@config";
import { getShape, TPiece, TTray } from "@engine";
import { TBoardLayout } from "@hooks";

import { TDragShared } from "../piece-tray";

export interface DragLayerProps {
    tray: TTray;
    layout: TBoardLayout;
    drag: TDragShared;
}

interface DragPieceProps extends Omit<DragLayerProps, "tray"> {
    piece: TPiece;
    slot: number;
}

const DragPiece = memo(function DragPiece({ piece, slot, layout, drag }: DragPieceProps) {
    const { pitch, gap } = layout;
    const shape = getShape(piece.shapeId);
    const width = shape.cols * pitch;
    const height = shape.rows * pitch;
    const lift = GAME_CONFIG.dragLiftCells * pitch;
    const startScale = GAME_CONFIG.trayScale;

    const style = useAnimatedStyle(() => {
        const scale = startScale + (1 - startScale) * drag.grow.value;
        // While growing, ease the lift in too, so the piece rises out from under the finger.
        const rise = (lift + height / 2) * drag.grow.value;
        return {
            opacity: drag.slot.value === slot ? 1 : 0,
            transform: [
                { translateX: drag.x.value - drag.rootX.value - width / 2 },
                { translateY: drag.y.value - drag.rootY.value - height / 2 - rise },
                { scale },
            ],
        };
    });

    return (
        <Animated.View pointerEvents="none" style={[{ position: "absolute", left: 0, top: 0, width, height }, style]}>
            <Piece shapeId={piece.shapeId} color={piece.color} pitch={pitch} gap={gap} gem={piece.gem} />
        </Animated.View>
    );
});

/**
 * Draws the piece being dragged above the finger, growing from tray size to board size as it lifts. A copy of every
 * tray piece is kept mounted and only shown while its slot is dragged, so a pick-up is answered on the UI thread right
 * away, even when JavaScript is still busy with the previous move.
 */
export const DragLayer = memo(function DragLayer({ tray, layout, drag }: DragLayerProps) {
    return (
        <>
            {tray.map((piece, slot) =>
                piece ? <DragPiece key={piece.uid} piece={piece} slot={slot} layout={layout} drag={drag} /> : null
            )}
        </>
    );
});
