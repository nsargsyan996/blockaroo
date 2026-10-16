import { memo, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
    Easing,
    SharedValue,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

import { BOARD_SIZE } from "@engine";
import { BLOCK_COLORS } from "@theme";

/** The small "thunk" every successful drop gets: a colored ring ripples out from the piece and a few sparks scatter. */

const DURATION = 420;
const SPARKS = 8;

export interface LandingFxProps {
    cells: number[];
    color: number;
    size: number;
    pitch: number;
    padding: number;
}

const Spark = memo(function Spark({
    clock,
    x,
    y,
    angle,
    distance,
    color,
}: {
    clock: SharedValue<number>;
    x: number;
    y: number;
    angle: number;
    distance: number;
    color: string;
}) {
    const style = useAnimatedStyle(() => {
        const p = clock.value;
        const travel = 1 - Math.pow(1 - p, 3);
        return {
            opacity: 1 - p,
            transform: [
                { translateX: Math.cos(angle) * distance * travel },
                { translateY: Math.sin(angle) * distance * travel },
                { scale: 1 - 0.6 * p },
            ],
        };
    });
    return (
        <Animated.View
            style={[
                {
                    position: "absolute",
                    left: x - 3,
                    top: y - 3,
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: color,
                },
                style,
            ]}
        />
    );
});

export const LandingFx = memo(function LandingFx({ cells, color, size, pitch, padding }: LandingFxProps) {
    const reduceMotion = useReducedMotion();
    const clock = useSharedValue(0);

    useEffect(() => {
        clock.value = 0;
        clock.value = withTiming(1, { duration: DURATION, easing: Easing.out(Easing.quad) });
    }, [clock]);

    // Center and spread of the placed piece, in board coordinates.
    const xs = cells.map((index) => padding + (index % BOARD_SIZE) * pitch + size / 2);
    const ys = cells.map((index) => padding + Math.floor(index / BOARD_SIZE) * pitch + size / 2);
    const cx = xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
    const cy = ys.reduce((a, b) => a + b, 0) / Math.max(1, ys.length);
    const spread = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2 + size * 0.8;
    const tone = BLOCK_COLORS[color] ?? BLOCK_COLORS[1];

    const ringStyle = useAnimatedStyle(() => ({
        opacity: 0.8 * (1 - clock.value),
        transform: [{ scale: 0.6 + clock.value * 0.7 }],
    }));

    if (reduceMotion) return null;
    return (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Animated.View
                style={[
                    {
                        position: "absolute",
                        left: cx - spread,
                        top: cy - spread,
                        width: spread * 2,
                        height: spread * 2,
                        borderRadius: spread * 0.45,
                        borderWidth: 3,
                        borderColor: tone.light,
                    },
                    ringStyle,
                ]}
            />
            {Array.from({ length: SPARKS }, (_, i) => (
                <Spark
                    key={i}
                    clock={clock}
                    x={cx}
                    y={cy}
                    angle={(i / SPARKS) * Math.PI * 2 + 0.3}
                    distance={spread + size * (0.4 + (i % 3) * 0.25)}
                    color={i % 2 ? tone.light : "#FFFFFF"}
                />
            ))}
        </View>
    );
});
