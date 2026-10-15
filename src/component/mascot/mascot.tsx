import { memo, ReactNode, useCallback, useEffect } from "react";
import { Pressable, View, ViewStyle } from "react-native";
import Animated, {
    cancelAnimation,
    Easing,
    interpolate,
    SharedValue,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";

import ArmLeftUp from "@assets/brand/roo/arm-left-up.svg";
import ArmLeft from "@assets/brand/roo/arm-left.svg";
import ArmRightUp from "@assets/brand/roo/arm-right-up.svg";
import ArmRight from "@assets/brand/roo/arm-right.svg";
import Body from "@assets/brand/roo/body.svg";
import EarLeft from "@assets/brand/roo/ear-left.svg";
import EarRight from "@assets/brand/roo/ear-right.svg";
import EyesCheer from "@assets/brand/roo/eyes-cheer.svg";
import EyesHappy from "@assets/brand/roo/eyes-happy.svg";
import EyesOops from "@assets/brand/roo/eyes-oops.svg";
import Feet from "@assets/brand/roo/feet.svg";
import Head from "@assets/brand/roo/head.svg";
import MouthCheer from "@assets/brand/roo/mouth-cheer.svg";
import MouthHappy from "@assets/brand/roo/mouth-happy.svg";
import MouthOops from "@assets/brand/roo/mouth-oops.svg";
import Shadow from "@assets/brand/roo/shadow.svg";
import Tail from "@assets/brand/roo/tail.svg";

export type TRooMood = "happy" | "oops" | "cheer";

export interface MascotProps {
    mood?: TRooMood;
    size: number;
    /** Hops on a loop. Cheer always bounces. All motion stops when the device asks for reduced motion. */
    hop?: boolean;
    /** Tapping Roo makes him jump. */
    onPress?: () => void;
}

/** Every part is drawn on the same 240x260 canvas (scripts/brand/roo.py), so layers stack exactly. */
const RATIO = 260 / 240;

/** Pivot points on that canvas, as percentages, for rotating and squashing each layer. */
const PIVOT = {
    tail: "66.7% 78.8%",
    earLeft: "36.7% 32.3%",
    earRight: "63.3% 32.3%",
    armLeft: "40.8% 67.7%",
    armRight: "59.2% 67.7%",
    armLeftUp: "30.8% 63.8%",
    armRightUp: "69.2% 63.8%",
    eyes: "50% 36.2%",
    feet: "50% 92%",
    head: "50% 60%",
} as const;

const loop = (value: SharedValue<number>, from: number, to: number, duration: number) => {
    value.value = from;
    value.value = withRepeat(withTiming(to, { duration, easing: Easing.inOut(Easing.sin) }), -1, true);
};

const Layer = ({ children, style }: { children: ReactNode; style?: ViewStyle | ViewStyle[] }) => (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", inset: 0 }, style]}>
        {children}
    </Animated.View>
);

/** Roo the kangaroo. Each part moves on its own: breathing, blinking, ear twitches, tail swish and squashy hops. */
export const Mascot = memo(function Mascot({ mood = "happy", size, hop = true, onPress }: MascotProps) {
    const reduceMotion = useReducedMotion();
    const height = size * RATIO;

    const breathe = useSharedValue(0);
    const tail = useSharedValue(0);
    const earLeft = useSharedValue(0);
    const earRight = useSharedValue(0);
    const blink = useSharedValue(1);
    const arms = useSharedValue(0);
    const lift = useSharedValue(0);
    const squash = useSharedValue(0);
    const shake = useSharedValue(0);

    const jump = useCallback(
        (power = 1) => {
            const up = -size * 0.13 * power;
            squash.value = withSequence(
                withTiming(1, { duration: 110 }),
                withTiming(-0.8, { duration: 200 }),
                withTiming(0, { duration: 260 }),
                withTiming(0.8, { duration: 90 }),
                withTiming(0, { duration: 170, easing: Easing.out(Easing.back(2)) })
            );
            lift.value = withSequence(
                withTiming(0, { duration: 110 }),
                withTiming(up, { duration: 230, easing: Easing.out(Easing.quad) }),
                withTiming(0, { duration: 230, easing: Easing.in(Easing.quad) })
            );
        },
        [size, lift, squash]
    );

    useEffect(() => {
        const values = [breathe, tail, earLeft, earRight, blink, arms, lift, squash, shake];
        if (reduceMotion) {
            values.forEach((value) => cancelAnimation(value));
            return;
        }

        loop(breathe, 0, 1, 1300);
        loop(tail, -1, 1, mood === "oops" ? 1500 : 850);

        const twitch = (value: SharedValue<number>, delay: number) => {
            value.value = withRepeat(
                withSequence(
                    withDelay(delay, withTiming(1, { duration: 90 })),
                    withTiming(-0.4, { duration: 110 }),
                    withTiming(0, { duration: 140 })
                ),
                -1
            );
        };
        twitch(earLeft, 2600);
        twitch(earRight, 3900);

        if (mood !== "cheer") {
            blink.value = withRepeat(
                withSequence(
                    withDelay(2900, withTiming(0.08, { duration: 70 })),
                    withTiming(1, { duration: 110 }),
                    withDelay(180, withTiming(0.08, { duration: 60 })),
                    withTiming(1, { duration: 100 })
                ),
                -1
            );
        }

        if (mood === "cheer") loop(arms, -1, 1, 260);

        if (mood === "oops") {
            shake.value = withSequence(...[1, -1, 0.7, -0.7, 0.3, 0].map((v) => withTiming(v, { duration: 60 })));
        }

        const hops = mood === "cheer" || (hop && mood === "happy");
        if (hops) {
            const gap = mood === "cheer" ? 250 : 1700;
            const up = -size * (mood === "cheer" ? 0.1 : 0.13);
            squash.value = withRepeat(
                withSequence(
                    withDelay(gap, withTiming(1, { duration: 110 })),
                    withTiming(-0.8, { duration: 200 }),
                    withTiming(0, { duration: 260 }),
                    withTiming(0.8, { duration: 90 }),
                    withTiming(0, { duration: 170 })
                ),
                -1
            );
            lift.value = withRepeat(
                withSequence(
                    withDelay(gap + 110, withTiming(up, { duration: 230, easing: Easing.out(Easing.quad) })),
                    withTiming(0, { duration: 230, easing: Easing.in(Easing.quad) }),
                    withTiming(0, { duration: 260 })
                ),
                -1
            );
        }

        return () => values.forEach((value) => cancelAnimation(value));
    }, [mood, hop, size, reduceMotion, breathe, tail, earLeft, earRight, blink, arms, lift, squash, shake]);

    // squash: 1 = crouched before a jump or on landing, -1 = stretched in the air.
    const characterStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: shake.value * size * 0.03 },
            { translateY: lift.value },
            { scaleX: 1 + squash.value * 0.07 },
            { scaleY: 1 - squash.value * 0.09 },
        ],
    }));
    const shadowStyle = useAnimatedStyle(() => {
        const air = interpolate(lift.value, [-size * 0.15, 0], [1, 0], "clamp");
        return { opacity: 1 - air * 0.5, transform: [{ scaleX: 1 - air * 0.35 + squash.value * 0.05 }] };
    });
    const bodyStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: 1 + breathe.value * 0.02 }] }));
    const headStyle = useAnimatedStyle(() => ({ transform: [{ translateY: breathe.value * size * 0.008 }] }));
    const tailStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${tail.value * 9}deg` }] }));
    const droop = mood === "oops" ? 16 : 0;
    const earLeftStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${-droop - earLeft.value * 9}deg` }] }));
    const earRightStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${droop + earRight.value * 9}deg` }] }));
    const eyesStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: blink.value }] }));
    const armLeftStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${arms.value * 14}deg` }] }));
    const armRightStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${-arms.value * 14}deg` }] }));

    const part = { width: size, height };
    const [Eyes, Mouth] =
        mood === "oops" ? [EyesOops, MouthOops] : mood === "cheer" ? [EyesCheer, MouthCheer] : [EyesHappy, MouthHappy];
    const cheer = mood === "cheer";

    const art = (
        <View style={part} accessibilityRole="image" accessibilityLabel="Roo the kangaroo">
            <Layer style={[{ transformOrigin: "50% 96%" }, shadowStyle]}>
                <Shadow {...part} />
            </Layer>
            <Layer style={[{ transformOrigin: "50% 96%" }, characterStyle]}>
                <Layer style={[{ transformOrigin: PIVOT.tail }, tailStyle]}>
                    <Tail {...part} />
                </Layer>
                <Layer style={{ transformOrigin: PIVOT.feet }}>
                    <Feet {...part} />
                </Layer>
                <Layer style={[{ transformOrigin: PIVOT.feet }, bodyStyle]}>
                    <Body {...part} />
                </Layer>
                {cheer ? null : (
                    <>
                        <Layer style={[{ transformOrigin: PIVOT.armLeft }, armLeftStyle]}>
                            <ArmLeft {...part} />
                        </Layer>
                        <Layer style={[{ transformOrigin: PIVOT.armRight }, armRightStyle]}>
                            <ArmRight {...part} />
                        </Layer>
                    </>
                )}
                <Layer style={[{ transformOrigin: PIVOT.head }, headStyle]}>
                    <Layer style={[{ transformOrigin: PIVOT.earLeft }, earLeftStyle]}>
                        <EarLeft {...part} />
                    </Layer>
                    <Layer style={[{ transformOrigin: PIVOT.earRight }, earRightStyle]}>
                        <EarRight {...part} />
                    </Layer>
                    <Head {...part} />
                    <Layer style={[{ transformOrigin: PIVOT.eyes }, eyesStyle]}>
                        <Eyes {...part} />
                    </Layer>
                    <Layer>
                        <Mouth {...part} />
                    </Layer>
                </Layer>
                {cheer ? (
                    <>
                        <Layer style={[{ transformOrigin: PIVOT.armLeftUp }, armLeftStyle]}>
                            <ArmLeftUp {...part} />
                        </Layer>
                        <Layer style={[{ transformOrigin: PIVOT.armRightUp }, armRightStyle]}>
                            <ArmRightUp {...part} />
                        </Layer>
                    </>
                ) : null}
            </Layer>
        </View>
    );

    if (!onPress) return art;
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel="Roo the kangaroo"
            onPress={() => {
                if (!reduceMotion) jump(1.3);
                onPress();
            }}
        >
            {art}
        </Pressable>
    );
});
