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

import { Block, GemIcon, Typography } from "@component";
import { BOARD_SIZE } from "@engine";
import { TClearedBlock } from "@store";
import { BLOCK_COLORS } from "@theme";

/**
 * The line-clear explosion, driven by ONE shared clock (milliseconds since the clear) so dozens of parts stay cheap:
 * a light beam sweeps each cleared line, every block swells and shatters into spinning shards that fly out and fall,
 * a shockwave rings out from where the piece landed, and the points float up. Big clears get more shards and a flash.
 */

const TOTAL_MS = 1100;
/** Delay per cell of distance from the landing point, so the blast travels outward like a wave. */
const WAVE_MS = 26;

export interface BlastProps {
    blocks: TClearedBlock[];
    rows: number[];
    cols: number[];
    /** Board cell where the piece landed: the blast starts there. */
    origin: number;
    points: number;
    /** 3+ lines or a perfect clear: more shards, a flash and a bigger shockwave. */
    big: boolean;
    size: number;
    pitch: number;
    padding: number;
    boardSize: number;
}

const clamp01 = (value: number) => {
    "worklet";
    return Math.min(1, Math.max(0, value));
};

/** Local 0..1 progress of a part that starts at `delay` and lasts `duration`. */
const phase = (clock: number, delay: number, duration: number) => {
    "worklet";
    return clamp01((clock - delay) / duration);
};

const cellCenter = (index: number, pitch: number, padding: number, size: number) => ({
    x: padding + (index % BOARD_SIZE) * pitch + size / 2,
    y: padding + Math.floor(index / BOARD_SIZE) * pitch + size / 2,
});

interface CoreProps {
    clock: SharedValue<number>;
    block: TClearedBlock;
    left: number;
    top: number;
    size: number;
    delay: number;
}

/** The block itself: a quick bright swell, then it pops out of existence as its shards fly. */
const BlastCore = memo(function BlastCore({ clock, block, left, top, size, delay }: CoreProps) {
    const style = useAnimatedStyle(() => {
        const p = phase(clock.value, delay, 220);
        return {
            opacity: 1 - p,
            transform: [{ scale: 1 + Math.sin(p * Math.PI) * 0.28 }],
        };
    });
    return (
        <Animated.View style={[{ position: "absolute", left, top }, style]}>
            <Block color={block.color} size={size} />
            {block.gem ? (
                <View style={styles.center}>
                    <GemIcon gem={block.gem} size={size * 0.62} />
                </View>
            ) : null}
        </Animated.View>
    );
});

interface ShardProps {
    clock: SharedValue<number>;
    x: number;
    y: number;
    size: number;
    color: string;
    angle: number;
    speed: number;
    spin: number;
    delay: number;
}

/** One flying piece of a shattered block: thrown outward, pulled down by gravity, spinning and fading. */
const Shard = memo(function Shard({ clock, x, y, size, color, angle, speed, spin, delay }: ShardProps) {
    const style = useAnimatedStyle(() => {
        const p = phase(clock.value, delay + 120, 620);
        const travel = 1 - Math.pow(1 - p, 2.2);
        return {
            opacity: p <= 0 ? 0 : 1 - p * p,
            transform: [
                { translateX: Math.cos(angle) * speed * travel },
                { translateY: Math.sin(angle) * speed * travel + 90 * p * p },
                { rotate: `${spin * p}deg` },
                { scale: 1 - 0.5 * p },
            ],
        };
    });
    return (
        <Animated.View
            style={[
                {
                    position: "absolute",
                    left: x - size / 2,
                    top: y - size / 2,
                    width: size,
                    height: size,
                    borderRadius: size * 0.22,
                    backgroundColor: color,
                },
                style,
            ]}
        />
    );
});

/** A bright bar that flashes along a cleared row or column. */
const Beam = memo(function Beam({
    clock,
    vertical,
    offset,
    span,
    thickness,
    delay,
}: {
    clock: SharedValue<number>;
    vertical: boolean;
    offset: number;
    span: number;
    thickness: number;
    delay: number;
}) {
    const style = useAnimatedStyle(() => {
        const p = phase(clock.value, delay, 420);
        const grow = 0.35 + 1.1 * (1 - Math.pow(1 - p, 3));
        return {
            opacity: p <= 0 ? 0 : 0.95 * (1 - p),
            transform: vertical ? [{ scaleX: grow }] : [{ scaleY: grow }],
        };
    });
    const box = vertical
        ? { left: offset, top: 0, width: thickness, height: span }
        : { left: 0, top: offset, width: span, height: thickness };
    return (
        <Animated.View
            style={[{ position: "absolute", ...box, borderRadius: thickness / 2, backgroundColor: "#FFFFFF" }, style]}
        />
    );
});

/** Expanding ring from the landing point. */
const Shockwave = memo(function Shockwave({
    clock,
    x,
    y,
    radius,
    color,
}: {
    clock: SharedValue<number>;
    x: number;
    y: number;
    radius: number;
    color: string;
}) {
    const style = useAnimatedStyle(() => {
        const p = phase(clock.value, 0, 520);
        return {
            opacity: p <= 0 ? 0 : 0.85 * (1 - p),
            transform: [{ scale: 0.15 + p * 1.0 }],
        };
    });
    return (
        <Animated.View
            style={[
                {
                    position: "absolute",
                    left: x - radius,
                    top: y - radius,
                    width: radius * 2,
                    height: radius * 2,
                    borderRadius: radius,
                    borderWidth: 4,
                    borderColor: color,
                },
                style,
            ]}
        />
    );
});

/** "+240" rising from the landing point. */
const ScorePop = memo(function ScorePop({
    clock,
    x,
    y,
    points,
    boardSize,
}: {
    clock: SharedValue<number>;
    x: number;
    y: number;
    points: number;
    boardSize: number;
}) {
    // Kept inside the board, so a clear in a corner doesn't cut the number off.
    const left = Math.min(Math.max(x - 60, 0), boardSize - 124);
    const top = Math.max(y - 24, 40);
    const style = useAnimatedStyle(() => {
        const p = phase(clock.value, 80, 900);
        return {
            opacity: p <= 0 ? 0 : p < 0.15 ? p / 0.15 : 1 - Math.pow((p - 0.15) / 0.85, 2),
            transform: [{ translateY: -56 * (1 - Math.pow(1 - p, 2)) }, { scale: 0.7 + 0.5 * Math.min(1, p * 4) }],
        };
    });
    return (
        <Animated.View pointerEvents="none" style={[{ position: "absolute", left, top, width: 120 }, style]}>
            <Typography
                variant="title"
                align="center"
                style={{
                    textShadowColor: "rgba(20,15,56,0.9)",
                    textShadowRadius: 6,
                    textShadowOffset: { width: 0, height: 2 },
                }}
            >
                +{points}
            </Typography>
        </Animated.View>
    );
});

/** Brief white flash over the whole board for big clears. */
const Flash = memo(function Flash({ clock }: { clock: SharedValue<number> }) {
    const style = useAnimatedStyle(() => ({ opacity: 0.35 * (1 - phase(clock.value, 0, 260)) }));
    return (
        <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { backgroundColor: "#FFFFFF", borderRadius: 18 }, style]}
        />
    );
});

export const Blast = memo(function Blast(props: BlastProps) {
    const { blocks, rows, cols, origin, points, big, size, pitch, padding, boardSize } = props;
    const reduceMotion = useReducedMotion();
    const clock = useSharedValue(0);

    useEffect(() => {
        clock.value = 0;
        clock.value = withTiming(TOTAL_MS, { duration: TOTAL_MS, easing: Easing.linear });
    }, [clock]);

    const originRow = Math.floor(origin / BOARD_SIZE);
    const originCol = origin % BOARD_SIZE;
    const center = cellCenter(origin, pitch, padding, size);
    const delayOf = (index: number) =>
        reduceMotion
            ? 0
            : (Math.abs(Math.floor(index / BOARD_SIZE) - originRow) + Math.abs((index % BOARD_SIZE) - originCol)) *
              WAVE_MS;
    const shardsPerBlock = reduceMotion ? 0 : big ? 6 : 4;
    const accent = BLOCK_COLORS[blocks[0]?.color ?? 1]?.light ?? "#FFFFFF";

    return (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {big && !reduceMotion ? <Flash clock={clock} /> : null}
            {reduceMotion
                ? null
                : rows.map((row) => (
                      <Beam
                          key={`r${row}`}
                          clock={clock}
                          vertical={false}
                          offset={padding + row * pitch}
                          span={boardSize - 4}
                          thickness={size}
                          delay={0}
                      />
                  ))}
            {reduceMotion
                ? null
                : cols.map((col) => (
                      <Beam
                          key={`c${col}`}
                          clock={clock}
                          vertical
                          offset={padding + col * pitch}
                          span={boardSize - 4}
                          thickness={size}
                          delay={0}
                      />
                  ))}
            {blocks.map((block) => (
                <BlastCore
                    key={block.index}
                    clock={clock}
                    block={block}
                    left={padding + (block.index % BOARD_SIZE) * pitch}
                    top={padding + Math.floor(block.index / BOARD_SIZE) * pitch}
                    size={size}
                    delay={delayOf(block.index)}
                />
            ))}
            {blocks.flatMap((block, i) => {
                const { x, y } = cellCenter(block.index, pitch, padding, size);
                const tone = BLOCK_COLORS[block.color] ?? BLOCK_COLORS[1];
                return Array.from({ length: shardsPerBlock }, (_, j) => {
                    // Deterministic scatter: every shard of every block gets its own direction, speed and spin.
                    const angle = ((j / shardsPerBlock) * 2 + ((i * 37) % 10) / 20) * Math.PI;
                    const speed = size * (0.9 + (((i * 31 + j * 17) % 10) / 10) * 1.1) * (big ? 1.35 : 1);
                    const spin = (j % 2 ? 1 : -1) * (200 + ((i * 53 + j * 29) % 160));
                    return (
                        <Shard
                            key={`${block.index}-${j}`}
                            clock={clock}
                            x={x}
                            y={y}
                            size={size * (j % 3 === 0 ? 0.34 : 0.24)}
                            color={j % 3 === 2 ? tone.light : tone.base}
                            angle={angle}
                            speed={speed}
                            spin={spin}
                            delay={delayOf(block.index)}
                        />
                    );
                });
            })}
            {reduceMotion ? null : (
                <Shockwave
                    clock={clock}
                    x={center.x}
                    y={center.y}
                    radius={big ? boardSize * 0.55 : boardSize * 0.38}
                    color={accent}
                />
            )}
            {points > 0 ? (
                <ScorePop clock={clock} x={center.x} y={center.y} points={points} boardSize={boardSize} />
            ) : null}
        </View>
    );
});

export const BLAST_DURATION_MS = TOTAL_MS;

const styles = StyleSheet.create({
    center: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
});
