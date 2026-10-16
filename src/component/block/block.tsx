import { memo } from "react";
import { View, ViewStyle } from "react-native";

import { BLOCK_COLORS } from "@theme";

export interface BlockProps {
    /** 1-7, an index into BLOCK_COLORS. */
    color: number;
    size: number;
    style?: ViewStyle;
}

/**
 * One beveled jewel block, like a glossy plastic tile: a lit top-left bevel, a shaded bottom-right bevel, the flat
 * colored face between them and a small glint. Plain Views keep 64+ of them cheap to render.
 */
export const Block = memo(function Block({ color, size, style }: BlockProps) {
    const tone = BLOCK_COLORS[color] ?? BLOCK_COLORS[1];
    const radius = size * 0.14;
    const bevel = size * 0.16;
    return (
        <View
            style={[
                { width: size, height: size, borderRadius: radius, backgroundColor: tone.light, overflow: "hidden" },
                style,
            ]}
        >
            {/* Bottom-right bevel, drawn over the lit base so the top-right and bottom-left corners split cleanly. */}
            <View
                style={{
                    position: "absolute",
                    left: bevel,
                    top: bevel,
                    right: 0,
                    bottom: 0,
                    borderBottomRightRadius: radius,
                    backgroundColor: tone.shade,
                }}
            />
            <View
                style={{
                    position: "absolute",
                    left: bevel,
                    top: bevel,
                    right: bevel,
                    bottom: bevel,
                    borderRadius: radius * 0.4,
                    backgroundColor: tone.base,
                }}
            />
            <View
                style={{
                    position: "absolute",
                    left: bevel * 1.35,
                    top: bevel * 1.35,
                    width: size * 0.16,
                    height: size * 0.1,
                    borderRadius: size,
                    backgroundColor: "#FFFFFF",
                    opacity: 0.8,
                }}
            />
        </View>
    );
});
