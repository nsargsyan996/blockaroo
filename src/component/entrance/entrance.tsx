import { memo, ReactNode, useEffect } from "react";
import { ViewStyle } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withDelay,
    withTiming,
} from "react-native-reanimated";

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

export interface EntranceProps {
    /** rise: up from just below its place; pop: from slightly smaller; fade: opacity only. */
    kind?: "rise" | "pop" | "fade";
    delay?: number;
    duration?: number;
    style?: ViewStyle;
    children: ReactNode;
}

/**
 * Mount animation driven by a shared value, so it behaves the same on native and web. (Reanimated's layout
 * `entering` animations take the element out of the layout flow on web and can leave it there.) With reduced motion
 * every kind becomes a short fade.
 */
export const Entrance = memo(function Entrance({
    kind = "rise",
    delay = 0,
    duration = 360,
    style,
    children,
}: EntranceProps) {
    const reduceMotion = useReducedMotion();
    const progress = useSharedValue(0);
    const motion = reduceMotion ? "fade" : kind;

    useEffect(() => {
        progress.set(withDelay(delay, withTiming(1, { duration: reduceMotion ? 220 : duration, easing: EASE_OUT })));
    }, [progress, delay, duration, reduceMotion]);

    const animatedStyle = useAnimatedStyle(() => {
        const p = progress.value;
        return {
            opacity: p,
            transform:
                motion === "rise" ? [{ translateY: (1 - p) * 28 }] : motion === "pop" ? [{ scale: 0.9 + 0.1 * p }] : [],
        };
    });

    return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
});
