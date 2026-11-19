import { memo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { BulbIcon, CrownIcon, HomeIcon, IconButton, Typography } from "@component";
import { useCountUp } from "@hooks";
import { formatScore } from "@util";

export interface GameHudProps {
    score: number;
    best: number;
    /** Adventure only: shows the level instead of the best score. */
    levelId?: number;
    /** Hints the player can still ask for in this game. */
    hintsLeft: number;
    onHint: () => void;
    onHome: () => void;
}

export const GameHud = memo(function GameHud({ score, best, levelId, hintsLeft, onHint, onHome }: GameHudProps) {
    const { t } = useTranslation();
    const shown = useCountUp(score);
    return (
        <View className="w-full flex-row items-center justify-between">
            <IconButton label={levelId ? t("game.levels") : t("game.home")} onPress={onHome}>
                <HomeIcon />
            </IconButton>
            <View className="items-center" accessibilityLabel={`${t("game.score")} ${score}`}>
                {levelId ? (
                    <Typography variant="caption" tone="soft">
                        {t("game.level", { level: levelId })}
                    </Typography>
                ) : (
                    <View className="flex-row items-center gap-1" accessibilityLabel={`${t("game.best")} ${best}`}>
                        <CrownIcon size={14} />
                        <Typography variant="caption" tone="soft" style={{ fontVariant: ["tabular-nums"] }}>
                            {formatScore(best)}
                        </Typography>
                    </View>
                )}
                <Typography variant="hero" style={{ fontVariant: ["tabular-nums"] }}>
                    {formatScore(shown)}
                </Typography>
            </View>
            <View>
                <IconButton
                    label={t("game.hint", { count: hintsLeft })}
                    onPress={onHint}
                    disabled={hintsLeft === 0}
                    className={hintsLeft === 0 ? "opacity-40" : undefined}
                >
                    <BulbIcon />
                </IconButton>
                {hintsLeft > 0 ? (
                    <View
                        pointerEvents="none"
                        className="absolute -right-1 -top-1 h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1"
                    >
                        <Typography variant="caption" tone="ink" className="text-xs leading-4">
                            {hintsLeft}
                        </Typography>
                    </View>
                ) : null}
            </View>
        </View>
    );
});
