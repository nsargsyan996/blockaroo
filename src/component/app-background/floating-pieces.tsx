import { memo } from "react";
import { StyleSheet } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";

import { Piece } from "../piece";

/**
 * Real game pieces hanging in the air around the edges of the home screen, tilted and drifting slowly. Fixed
 * positions and timings so the scene looks the same on every launch. Each one runs as a Reanimated CSS animation
 * on the UI thread; with reduced motion they simply hang still.
 */
const PIECES = [
    { shapeId: "l-0", color: 5, left: "-6%", top: "4%", pitch: 30, tilt: -18, duration: 9, delay: 0, drift: 18 },
    { shapeId: "t-up", color: 4, left: "52%", top: "9%", pitch: 26, tilt: 14, duration: 11, delay: 1.5, drift: 16 },
    { shapeId: "square2", color: 2, left: "84%", top: "15%", pitch: 32, tilt: -12, duration: 10, delay: 3, drift: 22 },
    { shapeId: "bar3-v", color: 3, left: "4%", top: "19%", pitch: 24, tilt: 16, duration: 8, delay: 2.2, drift: 14 },
    { shapeId: "s-h", color: 1, left: "-4%", top: "52%", pitch: 26, tilt: 10, duration: 12, delay: 0.8, drift: 20 },
    {
        shapeId: "corner-tl",
        color: 6,
        left: "84%",
        top: "50%",
        pitch: 28,
        tilt: -22,
        duration: 10,
        delay: 4,
        drift: 16,
    },
    { shapeId: "z-v", color: 7, left: "88%", top: "70%", pitch: 22, tilt: 12, duration: 9, delay: 1, drift: 12 },
] as const;

export const FloatingPieces = memo(function FloatingPieces() {
    const reduceMotion = useReducedMotion();
    return (
        <>
            {PIECES.map(({ shapeId, color, left, top, pitch, tilt, duration, delay, drift }, index) => (
                <Animated.View
                    key={index}
                    pointerEvents="none"
                    style={[
                        styles.piece,
                        { left, top },
                        reduceMotion
                            ? { transform: [{ rotate: `${tilt}deg` }] }
                            : {
                                  animationName: {
                                      from: { transform: [{ translateY: 0 }, { rotate: `${tilt}deg` }] },
                                      "50%": { transform: [{ translateY: -drift }, { rotate: `${tilt * 1.5}deg` }] },
                                      to: { transform: [{ translateY: 0 }, { rotate: `${tilt}deg` }] },
                                  },
                                  animationDuration: `${duration}s`,
                                  animationDelay: `${delay}s`,
                                  animationIterationCount: "infinite",
                                  animationTimingFunction: "ease-in-out",
                              },
                    ]}
                >
                    <Piece shapeId={shapeId} color={color} pitch={pitch} gap={3} />
                </Animated.View>
            ))}
        </>
    );
});

const styles = StyleSheet.create({
    piece: { position: "absolute", opacity: 0.9 },
});
