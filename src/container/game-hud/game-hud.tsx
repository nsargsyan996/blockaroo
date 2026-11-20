import { memo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { BulbIcon, CrownIcon, HomeIcon, IconButton, RotateIcon, Typography } from "@component";
import { useCountUp } from "@hooks";
import { cn, formatScore } from "@util";

export interface GameHudProps {
    score: number;
    best: number;
    /** Adventure only: shows the level instead of the best score. */
    levelId?: number;
    /** Hints the player can still ask for in this game. */
    hintsLeft: number;
    /** Quarter turns left for tray pieces in this game. Pieces are turned by tapping them, so this only counts. */
    turnsLeft: number;
    onHint: () => void;
    onHome: () => void;
}

export const GameHud = memo(function GameHud({
    score,
    best,
    levelId,
    hintsLeft,
    turnsLeft,
    onHint,
    onHome,
}: GameHudProps) {
    const { t } = useTranslation();
    const shown = useCountUp(score);
    return (
        // Both sides share the leftover width equally, so the score stays centered although the right side is wider.
        <View className="w-full flex-row items-center">
            <View className="flex-1 items-start">
                <IconButton label={levelId ? t("game.levels") : t("game.home")} onPress={onHome}>
                    <HomeIcon />
                </IconButton>
            </View>
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
            <View className="flex-1 flex-row items-center justify-end gap-2">
                <View
                    className={cn(
                        "h-12 flex-row items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5",
                        turnsLeft === 0 && "opacity-40"
                    )}
                    accessibilityLabel={t("game.turns", { count: turnsLeft })}
                >
                    <RotateIcon size={20} />
                    <Typography variant="subtitle" tone="white" style={{ fontVariant: ["tabular-nums"] }}>
                        {turnsLeft}
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
        </View>
    );
});
