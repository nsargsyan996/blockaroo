import { memo, useEffect } from "react";
import { View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";

import { Block, GemIcon } from "@component";
import { BOARD_SIZE } from "@engine";
import { TClearedBlock } from "@store";

interface BurstBlockProps {
    block: TClearedBlock;
    size: number;
    pitch: number;
    padding: number;
    delay: number;
}

const BurstBlock = memo(function BurstBlock({ block, size, pitch, padding, delay }: BurstBlockProps) {
    const progress = useSharedValue(0);
    useEffect(() => {
        progress.value = withDelay(delay, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }));
    }, [delay, progress]);

    const style = useAnimatedStyle(() => ({
        opacity: 1 - progress.value,
        transform: [{ scale: 1 + progress.value * 0.45 }, { rotate: `${progress.value * 25}deg` }],
    }));

    const row = Math.floor(block.index / BOARD_SIZE);
    const col = block.index % BOARD_SIZE;
    return (
        <Animated.View
            style={[{ position: "absolute", left: padding + col * pitch, top: padding + row * pitch }, style]}
        >
            <Block color={block.color} size={size} />
            {block.gem ? (
                <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}>
                    <GemIcon gem={block.gem} size={size * 0.62} />
                </View>
            ) : null}
        </Animated.View>
    );
});

const Sparkle = memo(function Sparkle({ x, y, angle, delay }: { x: number; y: number; angle: number; delay: number }) {
    const progress = useSharedValue(0);
    useEffect(() => {
        progress.value = withDelay(delay, withTiming(1, { duration: 520, easing: Easing.out(Easing.quad) }));
    }, [delay, progress]);
    const style = useAnimatedStyle(() => ({
        opacity: 1 - progress.value,
        transform: [
            { translateX: Math.cos(angle) * progress.value * 46 },
            { translateY: Math.sin(angle) * progress.value * 46 },
            { rotate: "45deg" },
            { scale: 1 - progress.value * 0.6 },
        ],
    }));
    return (
        <Animated.View
            style={[
                {
                    position: "absolute",
                    left: x - 5,
                    top: y - 5,
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    backgroundColor: "#FFFFFF",
                },
                style,
            ]}
        />
    );
});

export interface ClearBurstProps {
    blocks: TClearedBlock[];
    origin: number;
    size: number;
    pitch: number;
    padding: number;
}

/** Cleared blocks swell, spin and fade in a wave that starts where the piece landed, with a few sparkles. */
export const ClearBurst = memo(function ClearBurst({ blocks, origin, size, pitch, padding }: ClearBurstProps) {
    const originRow = Math.floor(origin / BOARD_SIZE);
    const originCol = origin % BOARD_SIZE;
    return (
        <View pointerEvents="none" style={{ position: "absolute", inset: 0 }}>
            {blocks.map((block) => {
                const distance =
                    Math.abs(Math.floor(block.index / BOARD_SIZE) - originRow) +
                    Math.abs((block.index % BOARD_SIZE) - originCol);
                return (
                    <BurstBlock
                        key={block.index}
                        block={block}
                        size={size}
                        pitch={pitch}
                        padding={padding}
                        delay={distance * 28}
                    />
                );
            })}
            {blocks
                .filter((_, i) => i % 3 === 0)
                .map((block, i) => {
                    const x = padding + (block.index % BOARD_SIZE) * pitch + size / 2;
                    const y = padding + Math.floor(block.index / BOARD_SIZE) * pitch + size / 2;
                    return (
                        <Sparkle
                            key={`s${block.index}`}
                            x={x}
                            y={y}
                            angle={(i * 2.4) % (Math.PI * 2)}
                            delay={60 + i * 20}
                        />
                    );
                })}
        </View>
    );
});
