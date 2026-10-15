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
 * One jewel block: a darker rim, the colored face, a soft top sheen and a small highlight. Plain Views keep 64+ of
 * them cheap to render.
 */
export const Block = memo(function Block({ color, size, style }: BlockProps) {
    const tone = BLOCK_COLORS[color] ?? BLOCK_COLORS[1];
    const radius = size * 0.22;
    return (
        <View
            style={[
                {
                    width: size,
                    height: size,
                    borderRadius: radius,
                    backgroundColor: tone.shade,
                    borderWidth: 1,
                    borderColor: "rgba(0,0,0,0.28)",
                    overflow: "hidden",
                },
                style,
            ]}
        >
            <View
                style={{
                    position: "absolute",
                    left: size * 0.06,
                    right: size * 0.06,
                    top: size * 0.05,
                    bottom: size * 0.14,
                    borderRadius: radius * 0.75,
                    backgroundColor: tone.base,
                }}
            />
            <View
                style={{
                    position: "absolute",
                    left: size * 0.06,
                    right: size * 0.06,
                    top: size * 0.05,
                    height: size * 0.36,
                    borderTopLeftRadius: radius * 0.75,
                    borderTopRightRadius: radius * 0.75,
                    backgroundColor: tone.light,
                    opacity: 0.45,
                }}
            />
            <View
                style={{
                    position: "absolute",
                    left: size * 0.16,
                    top: size * 0.12,
                    width: size * 0.18,
                    height: size * 0.12,
                    borderRadius: size,
                    backgroundColor: "#FFFFFF",
                    opacity: 0.7,
                }}
            />
        </View>
    );
});
