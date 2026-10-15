import { memo } from "react";
import { View } from "react-native";

import { getShape } from "@engine";

import { Block } from "../block";

export interface PieceProps {
    shapeId: string;
    color: number;
    /** Distance between cell origins. */
    pitch: number;
    gap: number;
}

export const pieceSize = (shapeId: string, pitch: number) => {
    const shape = getShape(shapeId);
    return { width: shape.cols * pitch, height: shape.rows * pitch };
};

/** A tray or dragged piece, drawn at any scale. */
export const Piece = memo(function Piece({ shapeId, color, pitch, gap }: PieceProps) {
    const shape = getShape(shapeId);
    const { width, height } = pieceSize(shapeId, pitch);
    const blockSize = pitch - gap;
    return (
        <View style={{ width, height }} pointerEvents="none">
            {shape.cells.map(([row, col]) => (
                <Block
                    key={`${row}-${col}`}
                    color={color}
                    size={blockSize}
                    style={{ position: "absolute", left: col * pitch + gap / 2, top: row * pitch + gap / 2 }}
                />
            ))}
        </View>
    );
});
