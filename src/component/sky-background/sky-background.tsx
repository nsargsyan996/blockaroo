import { memo, ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { palette } from "@theme";
import { LinearGradient } from "expo-linear-gradient";

const CLOUDS = [
    { top: "7%", left: "-6%", width: 150, opacity: 0.55 },
    { top: "16%", right: "-4%", width: 120, opacity: 0.4 },
    { top: "62%", left: "-10%", width: 130, opacity: 0.25 },
    { bottom: "6%", right: "-8%", width: 170, opacity: 0.3 },
] as const;

/** Daytime sky with soft clouds, shared by every screen. */
export const SkyBackground = memo(function SkyBackground({ children }: { children: ReactNode }) {
    return (
        <View className="flex-1">
            <LinearGradient
                colors={[palette.sky, palette.skyDeep, palette.skyNight]}
                locations={[0, 0.6, 1]}
                style={StyleSheet.absoluteFill}
            />
            {CLOUDS.map(({ width, opacity, ...position }, index) => (
                <View
                    key={index}
                    pointerEvents="none"
                    style={[styles.cloud, position, { width, height: width * 0.36, borderRadius: width, opacity }]}
                />
            ))}
            {children}
        </View>
    );
});

const styles = StyleSheet.create({
    cloud: { position: "absolute", backgroundColor: palette.cloud },
});
