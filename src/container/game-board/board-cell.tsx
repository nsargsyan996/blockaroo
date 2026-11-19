import { memo, useEffect } from "react";
import { View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";

import { Block, GemIcon } from "@component";
import { palette } from "@theme";

export interface BoardCellProps {
    color: number;
    /** Color of the dragged piece when it would land here, else 0. */
    ghostColor: number;
    /** Color to show when this cell's line would clear, else 0. */
    highlightColor: number;
    /** Color of the hinted piece when the hint wants it here, else 0. */
    hintColor: number;
    /** Gem inside this cell's block (adventure), else 0. */
    gem: number;
    /** Changes when a block lands here, which plays the landing bounce. */
    popId: number;
    size: number;
    left: number;
    top: number;
}

/** A hinted cell: the block breathes in and out so it reads as a suggestion, not as a placed piece. */
const HintBlock = memo(function HintBlock({ color, size }: { color: number; size: number }) {
    const glow = useSharedValue(0.3);

    useEffect(() => {
        glow.value = withRepeat(
            withSequence(withTiming(0.85, { duration: 380 }), withTiming(0.3, { duration: 380 })),
            -1
        );
    }, [glow]);

    const style = useAnimatedStyle(() => ({ opacity: glow.value }));
    return (
        <Animated.View style={style}>
            <Block color={color} size={size} />
        </Animated.View>
    );
});

export const BoardCell = memo(function BoardCell(props: BoardCellProps) {
    const { color, ghostColor, highlightColor, hintColor, gem, popId, size, left, top } = props;
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
                    borderRadius: size * 0.22,
                    backgroundColor: palette.boardCell,
                    borderBottomWidth: 1.5,
                    borderBottomColor: palette.boardCellEdge,
                }}
            />
            {shown ? (
                <Animated.View style={popStyle}>
                    <Block color={shown} size={size} />
                    {gem ? (
                        <View
                            style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}
                        >
                            <GemIcon gem={gem} size={size * 0.62} />
                        </View>
                    ) : null}
                </Animated.View>
            ) : ghostColor ? (
                <Block color={ghostColor} size={size} style={{ opacity: 0.45 }} />
            ) : hintColor ? (
                <HintBlock color={hintColor} size={size} />
            ) : null}
        </View>
    );
});
