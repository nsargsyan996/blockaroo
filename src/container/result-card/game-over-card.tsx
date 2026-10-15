import { memo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Button, CrownIcon, GemIcon, Mascot, PlayIcon, Typography, VideoIcon } from "@component";
import { goalProgress, TGameState } from "@engine";
import { palette } from "@theme";
import { formatScore } from "@util";

import { ResultCardShell, StatTile } from "./result-card-shell";

export interface GameOverCardProps {
    game: TGameState;
    best: number;
    isNewBest: boolean;
    canRevive: boolean;
    reviving: boolean;
    onRevive: () => void;
    onPlayAgain: () => void;
    onHome: () => void;
}

export const GameOverCard = memo(function GameOverCard(props: GameOverCardProps) {
    const { game, best, isNewBest, canRevive, reviving, onRevive, onPlayAgain, onHome } = props;
    const { t } = useTranslation();
    const adventure = game.adventure;

    return (
        <ResultCardShell top={<Mascot mood={isNewBest ? "cheer" : "oops"} size={120} />}>
            <Typography variant="title" align="center">
                {isNewBest ? t("gameOver.newBest") : t("gameOver.title")}
            </Typography>

            {adventure ? (
                <View className="w-full items-center gap-2">
                    <Typography variant="caption" tone="soft">
                        {t("gameOver.goalsLeft")}
                    </Typography>
                    <View className="flex-row flex-wrap justify-center gap-2">
                        {adventure.goals.map((goal, index) => {
                            const { current, target } = goalProgress(goal, game);
                            return (
                                <View
                                    key={index}
                                    className="flex-row items-center gap-1.5 rounded-full bg-white/10 py-1 pl-1.5 pr-3"
                                >
                                    {goal.kind === "gems" ? (
                                        <GemIcon gem={goal.gem} size={22} />
                                    ) : (
                                        <Typography variant="caption" tone="soft" className="pl-1.5">
                                            {t("gameOver.score")}
                                        </Typography>
                                    )}
                                    <Typography variant="subtitle" className="text-base">
                                        {goal.kind === "gems"
                                            ? `${current}/${target}`
                                            : `${formatScore(current)}/${formatScore(target)}`}
                                    </Typography>
                                </View>
                            );
                        })}
                    </View>
                </View>
            ) : (
                <View className="w-full flex-row gap-3">
                    <StatTile>
                        <Typography variant="caption" tone="soft">
                            {t("gameOver.score")}
                        </Typography>
                        <Typography variant="title" style={{ fontVariant: ["tabular-nums"] }}>
                            {formatScore(game.score)}
                        </Typography>
                    </StatTile>
                    <StatTile>
                        <View className="flex-row items-center gap-1">
                            <CrownIcon size={14} />
                            <Typography variant="caption" tone="soft">
                                {t("gameOver.best")}
                            </Typography>
                        </View>
                        <Typography variant="title" style={{ fontVariant: ["tabular-nums"] }}>
                            {formatScore(best)}
                        </Typography>
                    </StatTile>
                </View>
            )}

            {canRevive ? (
                <View className="w-full gap-1.5">
                    <Button
                        title={t("gameOver.revive")}
                        variant="success"
                        size="md"
                        icon={<VideoIcon color={palette.ink} />}
                        onPress={onRevive}
                        disabled={reviving}
                    />
                    <Typography variant="body" tone="soft" align="center" className="text-sm">
                        {t("gameOver.reviveHint")}
                    </Typography>
                </View>
            ) : null}

            <Button
                title={adventure ? t("gameOver.retry") : t("gameOver.playAgain")}
                icon={<PlayIcon color={palette.ink} />}
                onPress={onPlayAgain}
                className="w-full"
            />
            <Button
                title={adventure ? t("gameOver.levels") : t("gameOver.home")}
                variant="secondary"
                size="md"
                onPress={onHome}
                className="w-full"
            />
        </ResultCardShell>
    );
});
