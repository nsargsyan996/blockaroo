import { memo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { CrownIcon, HomeIcon, IconButton, Typography } from "@component";
import { useCountUp } from "@hooks";
import { formatScore } from "@util";

export interface GameHudProps {
    score: number;
    best: number;
    onHome: () => void;
}

export const GameHud = memo(function GameHud({ score, best, onHome }: GameHudProps) {
    const { t } = useTranslation();
    const shown = useCountUp(score);
    return (
        <View className="w-full flex-row items-center justify-between px-1">
            <IconButton label={t("game.home")} onPress={onHome}>
                <HomeIcon />
            </IconButton>
            <View className="items-center" accessibilityLabel={`${t("game.score")} ${score}`}>
                <Typography variant="caption" tone="white">
                    {t("game.score")}
                </Typography>
                <Typography variant="hero" tone="white" style={{ fontVariant: ["tabular-nums"] }}>
                    {formatScore(shown)}
                </Typography>
            </View>
            <View
                className="min-w-[56px] items-center rounded-2xl border-[3px] border-ink bg-white px-2 py-1"
                accessibilityLabel={`${t("game.best")} ${best}`}
            >
                <CrownIcon />
                <Typography variant="subtitle" style={{ fontVariant: ["tabular-nums"] }}>
                    {formatScore(best)}
                </Typography>
            </View>
        </View>
    );
});
