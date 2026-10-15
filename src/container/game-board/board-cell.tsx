import { memo, useEffect } from "react";
import { View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";

import { Block } from "@component";
import { palette } from "@theme";

export interface BoardCellProps {
    color: number;
    /** Color of the dragged piece when it would land here, else 0. */
    ghostColor: number;
    /** Color to show when this cell's line would clear, else 0. */
    highlightColor: number;
    /** Changes when a block lands here, which plays the landing bounce. */
    popId: number;
    size: number;
    left: number;
    top: number;
}

export const BoardCell = memo(function BoardCell(props: BoardCellProps) {
    const { color, ghostColor, highlightColor, popId, size, left, top } = props;
    const scale = useSharedValue(1);

    useEffect(() => {
        if (!popId) return;
        scale.value = withSequence(withTiming(0.7, { duration: 0 }), withSpring(1, { damping: 9, stiffness: 260 }));
    }, [popId, scale]);

    const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    const shown = highlightColor || color;
    return (
        <View style={{ position: "absolute", left, top, width: size, height: size }}>
            <View
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: size * 0.24,
                    backgroundColor: palette.boardCell,
                    borderTopWidth: 2,
                    borderTopColor: palette.boardCellShade,
                }}
            />
            {shown ? (
                <Animated.View style={popStyle}>
                    <Block color={shown} size={size} />
                </Animated.View>
            ) : ghostColor ? (
                <Block color={ghostColor} size={size} style={{ opacity: 0.45 }} />
            ) : null}
        </View>
    );
});
