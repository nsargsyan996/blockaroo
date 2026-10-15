import { memo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";

import { Typography } from "@component";
import { TLastMove } from "@store";
import { palette } from "@theme";
import { praiseFor } from "@util";

/** Cheers over the board after a clear: "Great!", "Super!", plus the streak count. */
export const PraiseBanner = memo(function PraiseBanner({ move }: { move: TLastMove | null }) {
    const { t } = useTranslation();
    const [shown, setShown] = useState<{ id: number; word: string; combo: number } | null>(null);
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);
    const rise = useSharedValue(0);

    useEffect(() => {
        if (!move) return;
        const key = praiseFor(move);
        if (!key) return;
        setShown({ id: move.id, word: t(`game.praise.${key}`), combo: move.combo });
        scale.value = withSequence(withTiming(0.3, { duration: 0 }), withSpring(1, { damping: 8, stiffness: 220 }));
        opacity.value = withSequence(withTiming(1, { duration: 80 }), withDelay(750, withTiming(0, { duration: 260 })));
        rise.value = withSequence(
            withTiming(0, { duration: 0 }),
            withDelay(750, withTiming(-28, { duration: 260, easing: Easing.in(Easing.quad) }))
        );
    }, [move, t, scale, opacity, rise]);

    const style = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: rise.value }, { scale: scale.value }],
    }));

    if (!shown) return null;
    return (
        <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
            <Animated.View style={[style, { alignItems: "center" }]}>
                <View>
                    {/* A dark copy offset underneath gives the word a chunky outline that reads on any board. */}
                    <Typography
                        variant="hero"
                        align="center"
                        style={{ position: "absolute", top: 4, left: 0, right: 0, color: palette.ink }}
                    >
                        {shown.word}
                    </Typography>
                    <Typography variant="hero" tone="white" align="center">
                        {shown.word}
                    </Typography>
                </View>
                {shown.combo > 1 ? (
                    <View className="mt-1 rounded-full border-[3px] border-ink bg-sun px-4">
                        <Typography variant="subtitle">{t("game.combo", { count: shown.combo })}</Typography>
                    </View>
                ) : null}
            </Animated.View>
        </View>
    );
});
