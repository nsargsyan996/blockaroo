import { memo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { Button, CrownIcon, Mascot, PlayIcon, Typography, VideoIcon } from "@component";
import { formatScore } from "@util";

export interface GameOverCardProps {
    score: number;
    best: number;
    isNewBest: boolean;
    canRevive: boolean;
    reviving: boolean;
    onRevive: () => void;
    onPlayAgain: () => void;
    onHome: () => void;
}

export const GameOverCard = memo(function GameOverCard(props: GameOverCardProps) {
    const { score, best, isNewBest, canRevive, reviving, onRevive, onPlayAgain, onHome } = props;
    const { t } = useTranslation();
    const pop = useSharedValue(0.6);

    useEffect(() => {
        pop.value = withSpring(1, { damping: 10, stiffness: 160 });
    }, [pop]);

    const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

    return (
        <Animated.View entering={FadeIn.duration(200)} style={StyleSheet.absoluteFill} accessibilityViewIsModal>
            <View className="flex-1 items-center justify-center bg-ink/60 px-5">
                <Animated.View style={[cardStyle, { width: "100%", maxWidth: 380 }]}>
                    <View className="w-full items-center gap-4 rounded-4xl border-4 border-ink bg-cream px-6 pb-6 pt-2">
                        <View className="-mt-20">
                            <Mascot mood={isNewBest ? "happy" : "oops"} size={130} hop={isNewBest} />
                        </View>
                        <Typography variant="title" align="center">
                            {isNewBest ? t("gameOver.newBest") : t("gameOver.title")}
                        </Typography>

                        <View className="w-full flex-row gap-3">
                            <View className="flex-1 items-center rounded-3xl border-[3px] border-ink bg-white py-2">
                                <Typography variant="caption" tone="soft">
                                    {t("gameOver.score")}
                                </Typography>
                                <Typography variant="title" style={{ fontVariant: ["tabular-nums"] }}>
                                    {formatScore(score)}
                                </Typography>
                            </View>
                            <View className="flex-1 items-center rounded-3xl border-[3px] border-ink bg-white py-2">
                                <View className="flex-row items-center gap-1">
                                    <CrownIcon size={16} />
                                    <Typography variant="caption" tone="soft">
                                        {t("gameOver.best")}
                                    </Typography>
                                </View>
                                <Typography variant="title" style={{ fontVariant: ["tabular-nums"] }}>
                                    {formatScore(best)}
                                </Typography>
                            </View>
                        </View>

                        {canRevive ? (
                            <View className="w-full gap-1">
                                <Button
                                    title={t("gameOver.revive")}
                                    variant="success"
                                    size="md"
                                    icon={<VideoIcon />}
                                    onPress={onRevive}
                                    disabled={reviving}
                                />
                                <Typography variant="body" tone="soft" align="center" className="text-base">
                                    {t("gameOver.reviveHint")}
                                </Typography>
                            </View>
                        ) : null}

                        <Button
                            title={t("gameOver.playAgain")}
                            icon={<PlayIcon />}
                            onPress={onPlayAgain}
                            className="w-full"
                        />
                        <Button
                            title={t("gameOver.home")}
                            variant="secondary"
                            size="md"
                            onPress={onHome}
                            className="w-full"
                        />
                    </View>
                </Animated.View>
            </View>
        </Animated.View>
    );
});
