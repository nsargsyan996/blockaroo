import { memo, ReactNode, useEffect } from "react";
import { ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

/** Dimmed backdrop plus a springy card, shared by the game-over and level-complete cards. */
export const ResultCardShell = memo(function ResultCardShell({
    top,
    children,
}: {
    top?: ReactNode;
    children: ReactNode;
}) {
    const pop = useSharedValue(0.85);
    useEffect(() => {
        pop.value = withSpring(1, { damping: 12, stiffness: 170 });
    }, [pop]);
    const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
    // Short screens (phones in landscape) skip the mascot and let the card scroll.
    const { height } = useWindowDimensions();
    const short = height < 620;

    return (
        <Animated.View entering={FadeIn.duration(200)} style={StyleSheet.absoluteFill} accessibilityViewIsModal>
            <View className="flex-1 bg-ink/80">
                <ScrollView
                    contentContainerStyle={{
                        flexGrow: 1,
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 20,
                        paddingTop: short ? 20 : 72,
                    }}
                >
                    <Animated.View style={[cardStyle, { width: "100%", maxWidth: 380 }]}>
                        <View
                            className={`w-full items-center rounded-3xl border border-white/15 bg-card px-5 pb-5 ${short ? "gap-3 pt-5" : "gap-4 pt-3"}`}
                        >
                            {top && !short ? <View className="-mt-16">{top}</View> : null}
                            {children}
                        </View>
                    </Animated.View>
                </ScrollView>
            </View>
        </Animated.View>
    );
});

export const StatTile = memo(function StatTile({ children }: { children: ReactNode }) {
    return <View className="flex-1 items-center rounded-2xl border border-white/10 bg-white/5 py-2">{children}</View>;
});
