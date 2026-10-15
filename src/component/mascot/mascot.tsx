import { memo, useEffect } from "react";
import Animated, {
    cancelAnimation,
    Easing,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";

import RooHappy from "@assets/brand/roo-happy.svg";
import RooOops from "@assets/brand/roo-oops.svg";

export type TRooMood = "happy" | "oops";

export interface MascotProps {
    mood?: TRooMood;
    size: number;
    /** Gentle idle hop. Turned off automatically when the device asks for reduced motion. */
    hop?: boolean;
}

const RATIO = 260 / 240;

/** Roo the kangaroo, Blockaroo's mascot. */
export const Mascot = memo(function Mascot({ mood = "happy", size, hop = true }: MascotProps) {
    const reduceMotion = useReducedMotion();
    const lift = useSharedValue(0);

    useEffect(() => {
        if (!hop || reduceMotion) return;
        lift.value = withRepeat(
            withSequence(
                withTiming(-size * 0.08, { duration: 320, easing: Easing.out(Easing.quad) }),
                withTiming(0, { duration: 320, easing: Easing.in(Easing.quad) }),
                withTiming(0, { duration: 900 })
            ),
            -1
        );
        return () => cancelAnimation(lift);
    }, [hop, reduceMotion, size, lift]);

    const style = useAnimatedStyle(() => ({ transform: [{ translateY: lift.value }] }));
    const Art = mood === "happy" ? RooHappy : RooOops;

    return (
        <Animated.View style={style} accessibilityRole="image" accessibilityLabel="Roo the kangaroo">
            <Art width={size} height={size * RATIO} />
        </Animated.View>
    );
});
