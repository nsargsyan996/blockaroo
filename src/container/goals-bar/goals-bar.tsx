import { memo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";

import { GemIcon, Typography } from "@component";
import { goalProgress, TGameState, TLevelGoal } from "@engine";
import { palette } from "@theme";
import { formatScore } from "@util";

const GoalChip = memo(function GoalChip({ goal, game }: { goal: TLevelGoal; game: TGameState }) {
    const { t } = useTranslation();
    const { current, target, done } = goalProgress(goal, game);
    const pulse = useSharedValue(1);
    const previous = useRef(current);

    // The chip bounces each time it moves forward, so collecting a gem is felt at the goal too.
    useEffect(() => {
        if (current > previous.current) {
            pulse.value = withSequence(withTiming(1.25, { duration: 90 }), withSpring(1, { damping: 8 }));
        }
        previous.current = current;
    }, [current, pulse]);

    const style = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

    if (goal.kind === "score") {
        const ratio = target ? current / target : 0;
        return (
            <View
                className="min-w-[180px] flex-1 gap-1"
                accessibilityLabel={`${t("game.score")} ${current} / ${target}`}
            >
                <View className="flex-row justify-between">
                    <Typography variant="caption" tone="soft">
                        {t("game.score")}
                    </Typography>
                    <Typography variant="caption" tone={done ? "sun" : "white"}>
                        {formatScore(current)} / {formatScore(target)}
                    </Typography>
                </View>
                <View className="h-3 overflow-hidden rounded-full bg-white/10">
                    <View
                        style={{
                            width: `${Math.round(ratio * 100)}%`,
                            height: "100%",
                            backgroundColor: done ? palette.leaf : palette.sun,
                            borderRadius: 999,
                        }}
                    />
                </View>
            </View>
        );
    }

    const left = target - current;
    return (
        <Animated.View style={style} accessibilityLabel={`${current} / ${target}`}>
            <View className="flex-row items-center gap-1.5 rounded-full border border-white/15 bg-white/10 py-1 pl-1.5 pr-3">
                <GemIcon gem={goal.gem} size={24} />
                <Typography
                    variant="subtitle"
                    className="text-base"
                    tone={done ? "sun" : "white"}
                    style={{ fontVariant: ["tabular-nums"] }}
                >
                    {done ? "✓" : left}
                </Typography>
            </View>
        </Animated.View>
    );
});

/** Adventure goals under the score: gems still to collect, or progress toward the target score. */
export const GoalsBar = memo(function GoalsBar({ game }: { game: TGameState }) {
    if (!game.adventure) return null;
    return (
        <View className="w-full flex-row flex-wrap items-center justify-center gap-2">
            {game.adventure.goals.map((goal, index) => (
                <GoalChip key={index} goal={goal} game={game} />
            ))}
        </View>
    );
});
