import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppBackground, GemIcon, HomeIcon, IconButton, StarIcon, Typography } from "@component";
import { getLevel, LEVEL_COUNT } from "@engine";
import { playSound } from "@service/sound";
import { selectTotalStars, useGameStore } from "@store";
import { cn } from "@util";
import { useRouter } from "expo-router";

const COLUMNS = 4;
/** How far a tile sits above its shaded edge. */
const TILE_DEPTH = 5;

interface LevelTileProps {
    id: number;
    size: number;
    stars: number;
    locked: boolean;
    current: boolean;
    onPress: (id: number) => void;
}

const LevelTile = memo(function LevelTile({ id, size, stars, locked, current, onPress }: LevelTileProps) {
    const { t } = useTranslation();
    const scoreLevel = getLevel(id).goals[0]?.kind === "score";
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={
                locked ? `${t("levels.level", { level: id })}, ${t("levels.locked")}` : t("levels.level", { level: id })
            }
            accessibilityState={{ disabled: locked }}
            disabled={locked}
            onPress={() => {
                playSound("tap");
                onPress(id);
            }}
            className="active:scale-95"
            style={{ width: size, paddingBottom: TILE_DEPTH }}
        >
            {/* Unlocked tiles are solid blocks on a shaded edge: the next level is a sun block, the rest are white. */}
            {locked ? null : (
                <View
                    className={cn("absolute inset-x-0 bottom-0 rounded-2xl", current ? "bg-sun-shade" : "bg-ink/40")}
                    style={{ top: TILE_DEPTH }}
                />
            )}
            <View
                className={cn(
                    "items-center justify-center gap-1 overflow-hidden rounded-2xl",
                    locked ? "border border-white/10 bg-white/5" : current ? "bg-sun" : "bg-white"
                )}
                style={{ height: size - TILE_DEPTH }}
            >
                {current ? <View pointerEvents="none" className="absolute inset-x-0 top-0 h-1/2 bg-white/25" /> : null}
                <Typography variant="title" tone={locked ? "soft" : "ink"} className={cn(locked && "opacity-40")}>
                    {id}
                </Typography>
                {locked ? (
                    <Typography variant="caption" tone="soft" className="opacity-50">
                        {t("levels.locked")}
                    </Typography>
                ) : (
                    <View className="flex-row gap-0.5">
                        {[0, 1, 2].map((index) => (
                            <StarIcon key={index} size={14} filled={index < stars} onLight />
                        ))}
                    </View>
                )}
                {!locked && scoreLevel ? (
                    <View className="absolute right-1.5 top-1.5 rounded-full bg-ink px-1.5">
                        <Typography variant="caption" tone="sun" className="text-[9px]">
                            ★
                        </Typography>
                    </View>
                ) : null}
            </View>
        </Pressable>
    );
});

export const LevelsPage = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const progress = useGameStore((state) => state.progress);
    const totalStars = useGameStore(selectTotalStars);
    const startLevel = useGameStore((state) => state.startLevel);

    const contentWidth = Math.min(width, 520) - 40;
    const gap = 12;
    const size = Math.max(48, Math.floor((contentWidth - gap * (COLUMNS - 1)) / COLUMNS));
    const ids = useMemo(() => Array.from({ length: LEVEL_COUNT }, (_, index) => index + 1), []);

    const play = (id: number) => {
        startLevel(id);
        router.push("/play");
    };

    return (
        <AppBackground>
            <View className="flex-1" style={{ paddingTop: insets.top + 12 }}>
                <View className="flex-row items-center justify-between px-5 pb-3">
                    <IconButton
                        label={t("game.home")}
                        onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
                    >
                        <HomeIcon size={22} />
                    </IconButton>
                    <View className="items-center">
                        <Typography variant="title">{t("levels.title")}</Typography>
                        <View className="flex-row items-center gap-1">
                            <StarIcon size={14} />
                            <Typography variant="body" tone="soft" className="text-sm">
                                {t("levels.stars", { count: totalStars, total: LEVEL_COUNT * 3 })}
                            </Typography>
                        </View>
                    </View>
                    <View className="h-12 w-12 items-center justify-center">
                        <GemIcon gem={1} size={30} />
                    </View>
                </View>
                <ScrollView
                    contentContainerStyle={{
                        paddingHorizontal: 20,
                        paddingBottom: insets.bottom + 24,
                        alignItems: "center",
                    }}
                >
                    <View className="flex-row flex-wrap" style={{ width: contentWidth, gap }}>
                        {ids.map((id) => (
                            <LevelTile
                                key={id}
                                id={id}
                                size={size}
                                stars={progress.stars[id] ?? 0}
                                locked={id > progress.unlocked}
                                current={id === progress.unlocked}
                                onPress={play}
                            />
                        ))}
                    </View>
                </ScrollView>
            </View>
        </AppBackground>
    );
};
