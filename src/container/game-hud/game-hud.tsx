import { memo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { CrownIcon, HomeIcon, IconButton, Typography } from "@component";
import { useCountUp } from "@hooks";
import { formatScore } from "@util";

export interface GameHudProps {
    score: number;
    best: number;
    /** Adventure only: shows the level instead of the best score. */
    levelId?: number;
    onHome: () => void;
}

export const GameHud = memo(function GameHud({ score, best, levelId, onHome }: GameHudProps) {
    const { t } = useTranslation();
    const shown = useCountUp(score);
    return (
        <View className="w-full flex-row items-center justify-between">
            <IconButton label={levelId ? t("game.levels") : t("game.home")} onPress={onHome}>
                <HomeIcon />
            </IconButton>
            <View className="items-center" accessibilityLabel={`${t("game.score")} ${score}`}>
                <Typography variant="caption" tone="soft">
                    {levelId ? t("game.level", { level: levelId }) : t("game.score")}
                </Typography>
                <Typography variant="hero" style={{ fontVariant: ["tabular-nums"] }}>
                    {formatScore(shown)}
                </Typography>
            </View>
            {levelId ? (
                <View className="w-12" />
            ) : (
                <View
                    className="min-w-[56px] flex-row items-center gap-1 rounded-full border border-white/15 bg-white/10 px-3 py-2"
                    accessibilityLabel={`${t("game.best")} ${best}`}
                >
                    <CrownIcon size={18} />
                    <Typography variant="subtitle" className="text-base" style={{ fontVariant: ["tabular-nums"] }}>
                        {formatScore(best)}
                    </Typography>
                </View>
            )}
        </View>
    );
});
