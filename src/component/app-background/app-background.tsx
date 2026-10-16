import { memo, ReactNode } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";

import { BLOCK_COLORS, palette } from "@theme";
import { LinearGradient } from "expo-linear-gradient";

import { FloatingPieces } from "./floating-pieces";

// Fixed positions so the sky looks the same on every launch (and in screenshots).
const STARS = [
    [8, 6, 2],
    [22, 14, 1.5],
    [41, 4, 2],
    [63, 11, 1.5],
    [82, 7, 2.5],
    [93, 19, 1.5],
    [12, 27, 1.5],
    [74, 29, 2],
    [55, 23, 1],
    [31, 35, 1.5],
    [88, 41, 1.5],
    [5, 48, 2],
    [47, 55, 1],
    [69, 62, 1.5],
    [17, 70, 1.5],
    [91, 74, 2],
    [36, 82, 1.5],
    [60, 88, 1],
    [8, 92, 1.5],
    [80, 95, 1.5],
] as const;

const GLOWS = [
    { top: "-8%", left: "-25%", size: 320, color: BLOCK_COLORS[6].glow },
    { top: "38%", right: "-30%", size: 300, color: BLOCK_COLORS[5].glow },
    { bottom: "-12%", left: "-20%", size: 300, color: BLOCK_COLORS[7].glow },
] as const;

const GRID = 36;

export interface AppBackgroundProps {
    children: ReactNode;
    /** Night (default) is the play and level screens' focused sky; arcade is the home screen's bright blue stage. */
    variant?: "night" | "arcade";
}

/** A faint tile grid over the whole stage, the same one the board is made of. */
const Grid = memo(function Grid() {
    const { width, height } = useWindowDimensions();
    const cols = Math.ceil(width / GRID);
    const rows = Math.ceil(height / GRID);
    return (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {Array.from({ length: cols }, (_, i) => (
                <View key={`c${i}`} style={[styles.gridLine, { left: i * GRID, top: 0, bottom: 0, width: 1 }]} />
            ))}
            {Array.from({ length: rows }, (_, i) => (
                <View key={`r${i}`} style={[styles.gridLine, { top: i * GRID, left: 0, right: 0, height: 1 }]} />
            ))}
        </View>
    );
});

/**
 * Night sky with soft color glows and a few stars, or the arcade stage: royal blue, a faint grid, a bright spot
 * behind the title and real game pieces drifting around the edges.
 */
export const AppBackground = memo(function AppBackground({ children, variant = "night" }: AppBackgroundProps) {
    if (variant === "arcade") {
        return (
            <View className="flex-1 overflow-hidden" style={{ backgroundColor: palette.arcade.mid }}>
                <LinearGradient
                    colors={[palette.arcade.top, palette.arcade.mid, palette.arcade.deep]}
                    locations={[0, 0.5, 1]}
                    style={StyleSheet.absoluteFill}
                />
                <Grid />
                <Svg
                    pointerEvents="none"
                    style={StyleSheet.absoluteFill}
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                >
                    <Defs>
                        <RadialGradient id="spot" cx="50%" cy="34%" r="45%">
                            <Stop offset="0" stopColor={palette.arcade.spot} stopOpacity="0.55" />
                            <Stop offset="1" stopColor={palette.arcade.spot} stopOpacity="0" />
                        </RadialGradient>
                    </Defs>
                    <Circle cx="50" cy="34" r="60" fill="url(#spot)" />
                </Svg>
                <FloatingPieces />
                {children}
            </View>
        );
    }
    return (
        <View className="flex-1 overflow-hidden" style={{ backgroundColor: palette.night }}>
            <LinearGradient
                colors={[palette.nightMid, palette.night, palette.nightDeep]}
                locations={[0, 0.55, 1]}
                style={StyleSheet.absoluteFill}
            />
            {GLOWS.map(({ size, color, ...position }, index) => (
                <View
                    key={`g${index}`}
                    pointerEvents="none"
                    style={[
                        styles.glow,
                        position,
                        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
                    ]}
                />
            ))}
            {STARS.map(([x, y, r], index) => (
                <View
                    key={`s${index}`}
                    pointerEvents="none"
                    style={[
                        styles.star,
                        {
                            left: `${x}%`,
                            top: `${y}%`,
                            width: r * 2,
                            height: r * 2,
                            borderRadius: r,
                            opacity: 0.25 + (index % 4) * 0.15,
                        },
                    ]}
                />
            ))}
            {children}
        </View>
    );
});

const styles = StyleSheet.create({
    glow: { position: "absolute", opacity: 0.18 },
    star: { position: "absolute", backgroundColor: "#FFFFFF" },
    gridLine: { position: "absolute", backgroundColor: palette.arcade.grid },
});
