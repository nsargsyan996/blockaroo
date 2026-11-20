import { memo } from "react";
import { View } from "react-native";

import { getShape, TPieceGem } from "@engine";

import { Block } from "../block";
import { GemIcon } from "../gem-icon";

export interface PieceProps {
    shapeId: string;
    color: number;
    /** Distance between cell origins. */
    pitch: number;
    gap: number;
    /** Adventure: a gem drawn on one of the piece's blocks. */
    gem?: TPieceGem;
}

export const pieceSize = (shapeId: string, pitch: number) => {
    const shape = getShape(shapeId);
    return { width: shape.cols * pitch, height: shape.rows * pitch };
};

/** A tray or dragged piece, drawn at any scale. */
export const Piece = memo(function Piece({ shapeId, color, pitch, gap, gem }: PieceProps) {
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
            {gem ? (
                <View
                    style={{
                        position: "absolute",
                        left: gem.cell[1] * pitch + gap / 2,
                        top: gem.cell[0] * pitch + gap / 2,
                        width: blockSize,
                        height: blockSize,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {/* Same size as on the board (see board-cell), so the gem doesn't jump when the piece lands. */}
                    <GemIcon gem={gem.gem} size={blockSize * 0.62} />
                </View>
            ) : null}
        </View>
    );
});
