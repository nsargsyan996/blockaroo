import { memo, ReactNode } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";

import { palette } from "@theme";
import { LinearGradient } from "expo-linear-gradient";

import { FloatingPieces } from "./floating-pieces";

const GRID = 36;

export interface AppBackgroundProps {
    children: ReactNode;
    /** Real game pieces drifting around the edges. Only the home screen wants them; they would distract from a board. */
    pieces?: boolean;
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

/** The arcade stage behind every screen: royal blue, a faint grid and a bright spot high in the middle. */
export const AppBackground = memo(function AppBackground({ children, pieces = false }: AppBackgroundProps) {
    return (
        <View className="flex-1 overflow-hidden" style={{ backgroundColor: palette.arcade.mid }}>
            <LinearGradient
                colors={[palette.arcade.top, palette.arcade.mid, palette.arcade.deep]}
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFill}
            />
            <Grid />
            <Svg pointerEvents="none" style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none">
                <Defs>
                    <RadialGradient id="spot" cx="50%" cy="34%" r="45%">
                        <Stop offset="0" stopColor={palette.arcade.spot} stopOpacity="0.55" />
                        <Stop offset="1" stopColor={palette.arcade.spot} stopOpacity="0" />
                    </RadialGradient>
                </Defs>
                <Circle cx="50" cy="34" r="60" fill="url(#spot)" />
            </Svg>
            {pieces ? <FloatingPieces /> : null}
            {children}
        </View>
    );
});

const styles = StyleSheet.create({
    gridLine: { position: "absolute", backgroundColor: palette.arcade.grid },
});
