import { memo } from "react";
import { View, ViewStyle } from "react-native";

import { BLOCK_COLORS, palette } from "@theme";

export interface BlockProps {
    /** 1-7, an index into BLOCK_COLORS. */
    color: number;
    size: number;
    style?: ViewStyle;
}

/** One glossy candy block: a darker edge, the main face and a highlight stripe. Pure Views, so it is cheap. */
export const Block = memo(function Block({ color, size, style }: BlockProps) {
    const tone = BLOCK_COLORS[color] ?? BLOCK_COLORS[1];
    const radius = size * 0.24;
    return (
        <View
            style={[
                {
                    width: size,
                    height: size,
                    borderRadius: radius,
                    backgroundColor: tone.shade,
                    borderWidth: Math.max(1.5, size * 0.05),
                    borderColor: palette.ink,
                    overflow: "hidden",
                },
                style,
            ]}
        >
            <View
                style={{
                    position: "absolute",
                    left: size * 0.04,
                    right: size * 0.04,
                    top: size * 0.03,
                    bottom: size * 0.16,
                    borderRadius: radius * 0.8,
                    backgroundColor: tone.base,
                }}
            />
            <View
                style={{
                    position: "absolute",
                    left: size * 0.17,
                    top: size * 0.13,
                    width: size * 0.36,
                    height: Math.max(2, size * 0.13),
                    borderRadius: size,
                    backgroundColor: tone.light,
                }}
            />
        </View>
    );
});
