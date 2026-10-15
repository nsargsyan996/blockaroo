import { memo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from "react-native-reanimated";

import { Button, Mascot, PlayIcon, StarIcon, Typography } from "@component";
import { palette } from "@theme";

import { ResultCardShell } from "./result-card-shell";

export interface LevelCompleteCardProps {
    levelId: number;
    stars: number;
    moves: number;
    par: number;
    isLastLevel: boolean;
    onNext: () => void;
    onReplay: () => void;
    onLevels: () => void;
}

const EarnedStar = memo(function EarnedStar({ index, filled }: { index: number; filled: boolean }) {
    const scale = useSharedValue(0);
    useEffect(() => {
        scale.value = withDelay(250 + index * 220, withSpring(1, { damping: 7, stiffness: 180 }));
    }, [index, scale]);
    const style = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }, { translateY: index === 1 ? -6 : 0 }],
    }));
    return (
        <Animated.View style={style}>
            <StarIcon size={index === 1 ? 64 : 52} filled={filled} />
        </Animated.View>
    );
});

export const LevelCompleteCard = memo(function LevelCompleteCard(props: LevelCompleteCardProps) {
    const { levelId, stars, moves, par, isLastLevel, onNext, onReplay, onLevels } = props;
    const { t } = useTranslation();
    return (
        <ResultCardShell top={<Mascot mood="cheer" size={120} />}>
            <View className="items-center gap-1">
                <Typography variant="caption" tone="soft">
                    {t("game.level", { level: levelId })}
                </Typography>
                <Typography variant="title" align="center">
                    {isLastLevel ? t("won.allDone") : t("won.title")}
                </Typography>
            </View>
            <View className="mt-3 flex-row items-end gap-2" accessibilityLabel={`${stars} / 3`}>
                {[0, 1, 2].map((index) => (
                    <EarnedStar key={index} index={index} filled={index < stars} />
                ))}
            </View>
            <View className="items-center">
                <Typography variant="subtitle">{t("won.moves", { count: moves })}</Typography>
                <Typography variant="body" tone="soft" className="text-sm">
                    {t("won.par", { par })}
                </Typography>
            </View>
            {isLastLevel ? null : (
                <Button
                    title={t("won.next")}
                    icon={<PlayIcon color={palette.ink} />}
                    onPress={onNext}
                    className="w-full"
                />
            )}
            <View className="w-full flex-row gap-3">
                <Button title={t("won.replay")} variant="secondary" size="md" onPress={onReplay} className="flex-1" />
                <Button title={t("won.levels")} variant="secondary" size="md" onPress={onLevels} className="flex-1" />
            </View>
        </ResultCardShell>
    );
});
