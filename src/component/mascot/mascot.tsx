import { memo, ReactNode, useCallback, useEffect, useRef } from "react";
import { Pressable, StyleProp, View, ViewStyle } from "react-native";
import Animated, {
    AnimatedStyle,
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

import ArmLeft from "@assets/brand/roo/arm-left.svg";
import ArmRight from "@assets/brand/roo/arm-right.svg";
import Body from "@assets/brand/roo/body.svg";
import EarLeft from "@assets/brand/roo/ear-left.svg";
import EarRight from "@assets/brand/roo/ear-right.svg";
import EyesClosedHappy from "@assets/brand/roo/eyes-closed-happy.svg";
import EyesOpen from "@assets/brand/roo/eyes-open.svg";
import EyesWorried from "@assets/brand/roo/eyes-worried.svg";
import FootLeft from "@assets/brand/roo/foot-left.svg";
import FootRight from "@assets/brand/roo/foot-right.svg";
import Sparkles from "@assets/brand/roo/fx-sparkles.svg";
import Sweat from "@assets/brand/roo/fx-sweat.svg";
import Head from "@assets/brand/roo/head.svg";
import MouthLaugh from "@assets/brand/roo/mouth-laugh.svg";
import MouthSmile from "@assets/brand/roo/mouth-smile.svg";
import MouthWobble from "@assets/brand/roo/mouth-wobble.svg";
import Nose from "@assets/brand/roo/nose.svg";
import PouchBlock from "@assets/brand/roo/pouch-block.svg";
import PouchFront from "@assets/brand/roo/pouch-front.svg";
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
    /** Drops in from above and lands with a squash the first time he shows. */
    entrance?: boolean;
}

/**
 * Every part is drawn on the same 520x600 canvas (store/art-kit/README.md, "Roo rig"), so layers stack exactly. Roo
 * himself fills a 400x520 box at (60, 40); the margin leaves room for swaying ears, the tail and sparkles. `size` is
 * Roo's width: the layout box hugs Roo and the margin spills outside it.
 */
const CANVAS = { width: 520, height: 600 };
const ROO = { x: 60, y: 40, width: 400, height: 520 };
const RATIO = ROO.height / ROO.width;

/** Entrance: a short beat, then a fall that ends in a crouch, a stretch and a settle. */
const FALL_DELAY_MS = 80;
const FALL_MS = 420;
/** When Roo touches down. The home screen times its own entrance to this beat. */
export const MASCOT_LANDING_MS = FALL_DELAY_MS + FALL_MS;

/** Pivot points from the rig (canvas pixels), turned into percentages for rotating and squashing each layer. */
// Array form on purpose: React Native's "x% y%" string parser only understands whole-number percentages.
const pivot = (x: number, y: number): [string, string, number] => [
    `${(x / CANVAS.width) * 100}%`,
    `${(y / CANVAS.height) * 100}%`,
    0,
];
const PIVOT = {
    tail: pivot(322, 470),
    earLeft: pivot(210, 162),
    earRight: pivot(310, 162),
    armLeft: pivot(210, 360),
    armRight: pivot(310, 360),
    eyes: pivot(260, 218),
    body: pivot(260, 520),
    head: pivot(260, 322),
    base: pivot(260, 546),
};

/** Cheer raises both arms this far (degrees) around the shoulders, behind the head as the rig asks. */
const ARMS_UP = 115;
/** Oops droops the ears this far (degrees), from the rig notes. */
const EAR_DROOP = 26;

const loop = (value: SharedValue<number>, from: number, to: number, duration: number) => {
    value.set(from);
    value.set(withRepeat(withTiming(to, { duration, easing: Easing.inOut(Easing.sin) }), -1, true));
};

const Layer = ({ children, style }: { children: ReactNode; style?: StyleProp<AnimatedStyle<ViewStyle>> }) => (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", inset: 0 }, style]}>
        {children}
    </Animated.View>
);

/** Roo the kangaroo. Each part moves on its own: breathing, blinking, ear twitches, tail swish and squashy hops. */
export const Mascot = memo(function Mascot({
    mood = "happy",
    size: rawSize,
    hop = true,
    onPress,
    entrance = false,
}: MascotProps) {
    const size = Math.max(1, rawSize);
    const reduceMotion = useReducedMotion();
    const height = size * RATIO;
    const entered = useRef(false);

    const breathe = useSharedValue(0);
    const tail = useSharedValue(0);
    const earLeft = useSharedValue(0);
    const earRight = useSharedValue(0);
    const blink = useSharedValue(1);
    const arms = useSharedValue(0);
    const lift = useSharedValue(0);
    const squash = useSharedValue(0);
    const shake = useSharedValue(0);
    const entry = useSharedValue(entrance && !reduceMotion ? 0 : 1);

    const jump = useCallback(
        (power = 1) => {
            const up = -size * 0.13 * power;
            squash.set(
                withSequence(
                    withTiming(1, { duration: 110 }),
                    withTiming(-0.8, { duration: 200 }),
                    withTiming(0, { duration: 260 }),
                    withTiming(0.8, { duration: 90 }),
                    withTiming(0, { duration: 170, easing: Easing.out(Easing.back(2)) })
                )
            );
            lift.set(
                withSequence(
                    withTiming(0, { duration: 110 }),
                    withTiming(up, { duration: 230, easing: Easing.out(Easing.quad) }),
                    withTiming(0, { duration: 230, easing: Easing.in(Easing.quad) })
                )
            );
        },
        [size, lift, squash]
    );

    useEffect(() => {
        const values = [breathe, tail, earLeft, earRight, blink, arms, lift, squash, shake];
        if (reduceMotion) {
            values.forEach((value) => cancelAnimation(value));
            entry.set(1);
            return;
        }

        const landing = entrance && !entered.current;
        entered.current = true;
        if (landing) {
            entry.set(withTiming(1, { duration: 160 }));
            lift.set(-size * 0.6);
        }
        // Gravity is the one place ease-in belongs: a falling body speeds up.
        const fall = withDelay(FALL_DELAY_MS, withTiming(0, { duration: FALL_MS, easing: Easing.in(Easing.quad) }));
        const touchdown = withSequence(
            withDelay(MASCOT_LANDING_MS, withTiming(1, { duration: 90 })),
            withTiming(-0.5, { duration: 170 }),
            withTiming(0, { duration: 220, easing: Easing.out(Easing.back(2)) })
        );

        loop(breathe, 0, 1, 1300);
        loop(tail, -1, 1, mood === "oops" ? 1500 : 850);

        const twitch = (value: SharedValue<number>, delay: number) => {
            value.set(
                withRepeat(
                    withSequence(
                        withDelay(delay, withTiming(1, { duration: 90 })),
                        withTiming(-0.4, { duration: 110 }),
                        withTiming(0, { duration: 140 })
                    ),
                    -1
                )
            );
        };
        twitch(earLeft, 2600);
        twitch(earRight, 3900);

        if (mood !== "cheer") {
            blink.set(
                withRepeat(
                    withSequence(
                        withDelay(2900, withTiming(0.08, { duration: 70 })),
                        withTiming(1, { duration: 110 }),
                        withDelay(180, withTiming(0.08, { duration: 60 })),
                        withTiming(1, { duration: 100 })
                    ),
                    -1
                )
            );
        }

        if (mood === "cheer") loop(arms, -1, 1, 260);

        if (mood === "oops") {
            shake.set(withSequence(...[1, -1, 0.7, -0.7, 0.3, 0].map((v) => withTiming(v, { duration: 60 }))));
        }

        const hops = mood === "cheer" || (hop && mood === "happy");
        if (hops) {
            const gap = mood === "cheer" ? 250 : 1700;
            const up = -size * (mood === "cheer" ? 0.1 : 0.13);
            const hopSquash = withRepeat(
                withSequence(
                    withDelay(gap, withTiming(1, { duration: 110 })),
                    withTiming(-0.8, { duration: 200 }),
                    withTiming(0, { duration: 260 }),
                    withTiming(0.8, { duration: 90 }),
                    withTiming(0, { duration: 170 })
                ),
                -1
            );
            const hopLift = withRepeat(
                withSequence(
                    withDelay(gap + 110, withTiming(up, { duration: 230, easing: Easing.out(Easing.quad) })),
                    withTiming(0, { duration: 230, easing: Easing.in(Easing.quad) }),
                    withTiming(0, { duration: 260 })
                ),
                -1
            );
            squash.set(landing ? withSequence(touchdown, hopSquash) : hopSquash);
            lift.set(landing ? withSequence(fall, hopLift) : hopLift);
        } else if (landing) {
            squash.set(touchdown);
            lift.set(fall);
        }

        return () => values.forEach((value) => cancelAnimation(value));
    }, [
        mood,
        hop,
        size,
        reduceMotion,
        entrance,
        entry,
        breathe,
        tail,
        earLeft,
        earRight,
        blink,
        arms,
        lift,
        squash,
        shake,
    ]);

    // squash: 1 = crouched before a jump or on landing, -1 = stretched in the air.
    const characterStyle = useAnimatedStyle(() => ({
        opacity: entry.value,
        transform: [
            { translateX: shake.value * size * 0.03 },
            { translateY: lift.value },
            { scaleX: 1 + squash.value * 0.07 },
            { scaleY: 1 - squash.value * 0.09 },
        ],
    }));
    const shadowStyle = useAnimatedStyle(() => {
        const air = interpolate(lift.value, [-size * 0.15, 0], [1, 0], "clamp");
        return {
            opacity: (1 - air * 0.5) * entry.value,
            transform: [{ scaleX: 1 - air * 0.35 + squash.value * 0.05 }],
        };
    });
    const bodyStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: 1 + breathe.value * 0.02 }] }));
    const headStyle = useAnimatedStyle(() => ({ transform: [{ translateY: breathe.value * size * 0.008 }] }));
    const tailStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${tail.value * 9}deg` }] }));
    const droop = mood === "oops" ? EAR_DROOP : 0;
    const earLeftStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${-droop - earLeft.value * 9}deg` }] }));
    const earRightStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${droop + earRight.value * 9}deg` }] }));
    const eyesStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: blink.value }] }));
    const raise = mood === "cheer" ? ARMS_UP : 0;
    const armLeftStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${raise + arms.value * 14}deg` }] }));
    const armRightStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${-raise - arms.value * 14}deg` }] }));

    const scale = size / ROO.width;
    const part = { width: CANVAS.width * scale, height: CANVAS.height * scale };
    const canvas = { position: "absolute", left: -ROO.x * scale, top: -ROO.y * scale, ...part } as const;
    const [Eyes, Mouth] =
        mood === "oops"
            ? [EyesWorried, MouthWobble]
            : mood === "cheer"
              ? [EyesClosedHappy, MouthLaugh]
              : [EyesOpen, MouthSmile];
    const cheer = mood === "cheer";
    const arm = (side: "left" | "right") => (
        <Layer
            style={[
                { transformOrigin: side === "left" ? PIVOT.armLeft : PIVOT.armRight },
                side === "left" ? armLeftStyle : armRightStyle,
            ]}
        >
            {side === "left" ? <ArmLeft {...part} /> : <ArmRight {...part} />}
        </Layer>
    );

    const art = (
        <View style={{ width: size, height }} accessibilityRole="image" accessibilityLabel="Roo the kangaroo">
            <View pointerEvents="none" style={canvas}>
                <Layer style={[{ transformOrigin: PIVOT.base }, shadowStyle]}>
                    <Shadow {...part} />
                </Layer>
                <Layer style={[{ transformOrigin: PIVOT.base }, characterStyle]}>
                    <Layer style={[{ transformOrigin: PIVOT.tail }, tailStyle]}>
                        <Tail {...part} />
                    </Layer>
                    <Layer>
                        <FootLeft {...part} />
                    </Layer>
                    <Layer>
                        <FootRight {...part} />
                    </Layer>
                    <Layer style={[{ transformOrigin: PIVOT.body }, bodyStyle]}>
                        <Body {...part} />
                        <Layer>
                            <PouchBlock {...part} />
                        </Layer>
                        <Layer>
                            <PouchFront {...part} />
                        </Layer>
                    </Layer>
                    {/* Raised arms go behind the head; resting arms hold the pouch in front of everything. */}
                    {cheer ? (
                        <>
                            {arm("left")}
                            {arm("right")}
                        </>
                    ) : null}
                    <Layer style={[{ transformOrigin: PIVOT.head }, headStyle]}>
                        <Layer style={[{ transformOrigin: PIVOT.earLeft }, earLeftStyle]}>
                            <EarLeft {...part} />
                        </Layer>
                        <Layer style={[{ transformOrigin: PIVOT.earRight }, earRightStyle]}>
                            <EarRight {...part} />
                        </Layer>
                        <Head {...part} />
                        <Layer>
                            <Nose {...part} />
                        </Layer>
                        <Layer style={[{ transformOrigin: PIVOT.eyes }, eyesStyle]}>
                            <Eyes {...part} />
                        </Layer>
                        <Layer>
                            <Mouth {...part} />
                        </Layer>
                    </Layer>
                    {cheer ? null : (
                        <>
                            {arm("left")}
                            {arm("right")}
                        </>
                    )}
                    {mood === "oops" ? (
                        <Layer style={[{ transformOrigin: PIVOT.head }, headStyle]}>
                            <Sweat {...part} />
                        </Layer>
                    ) : null}
                </Layer>
                {cheer ? (
                    <Layer>
                        <Sparkles {...part} />
                    </Layer>
                ) : null}
            </View>
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
