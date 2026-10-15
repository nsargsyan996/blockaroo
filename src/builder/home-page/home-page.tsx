import { memo, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
    AdBanner,
    AppBackground,
    Block,
    Button,
    CrownIcon,
    GemIcon,
    IconButton,
    Mascot,
    PlayIcon,
    SoundIcon,
    StarIcon,
    Typography,
    VibrationIcon,
    Wordmark,
} from "@component";
import { LEVEL_COUNT } from "@engine";
import { playSound } from "@service/sound";
import { selectCanContinueClassic, selectTotalStars, useGameStore, useSettingsStore } from "@store";
import { palette } from "@theme";
import { cn, formatScore } from "@util";
import { useRouter } from "expo-router";

interface ModeTileProps {
    title: string;
    /** Inner width of the tile, used to size the title so long names (e.g. "Приключение") fit on small phones. */
    width: number;
    art: ReactNode;
    stat: ReactNode;
    cta: string;
    accent: "sun" | "amethyst";
    onPress: () => void;
}

/** One of the two equal-weight mode rows: art, name and a stat on the left, its own play pill on the right. */
const ModeTile = memo(function ModeTile({ title, width, art, stat, cta, accent, onPress }: ModeTileProps) {
    const sun = accent === "sun";
    // Rubik ExtraBold averages about 0.62 em per character.
    const titleSize = Math.max(16, Math.min(24, width / (title.length * 0.62)));
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${title}: ${cta}`}
            onPress={() => {
                playSound("tap");
                onPress();
            }}
            className="active:scale-[0.98]"
        >
            <View
                className={cn(
                    "min-h-[88px] flex-row items-center gap-3 rounded-3xl border px-3 py-3",
                    sun ? "border-sun/40 bg-sun/10" : "border-amethyst/50 bg-amethyst/15"
                )}
            >
                <View className="h-14 w-14 items-center justify-center rounded-2xl bg-white/10">{art}</View>
                <View className="flex-1 gap-0.5">
                    <Typography
                        variant="subtitle"
                        style={{ fontSize: titleSize, lineHeight: titleSize * 1.3 }}
                        numberOfLines={1}
                    >
                        {title}
                    </Typography>
                    <View className="flex-row items-center gap-1">{stat}</View>
                </View>
                <View className="min-w-[112px] pb-1">
                    <View
                        className={cn(
                            "absolute inset-x-0 bottom-0 top-1 rounded-2xl",
                            sun ? "bg-sun-shade" : "bg-amethyst-shade"
                        )}
                    />
                    <View
                        className={cn(
                            "min-h-[48px] flex-row items-center justify-center gap-1.5 rounded-2xl px-3",
                            sun ? "bg-sun" : "bg-amethyst"
                        )}
                    >
                        <PlayIcon size={16} color={sun ? palette.ink : palette.text} />
                        <Typography
                            variant="subtitle"
                            tone={sun ? "ink" : "white"}
                            className="text-lg"
                            numberOfLines={1}
                        >
                            {cta}
                        </Typography>
                    </View>
                </View>
            </View>
        </Pressable>
    );
});

/** Four tiny blocks, the Classic tile's art. */
const BlockCluster = () => (
    <View className="flex-row flex-wrap" style={{ width: 40, gap: 4 }}>
        {[5, 4, 6, 1].map((color, index) => (
            <Block key={index} color={color} size={18} />
        ))}
    </View>
);

export const HomePage = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();

    const best = useGameStore((state) => state.best);
    const canContinue = useGameStore(selectCanContinueClassic);
    const totalStars = useGameStore(selectTotalStars);
    const unlocked = useGameStore((state) => state.progress.unlocked);
    const startClassic = useGameStore((state) => state.startClassic);
    const resumeClassic = useGameStore((state) => state.resumeClassic);
    const { soundOn, hapticsOn, toggleSound, toggleHaptics } = useSettingsStore();

    // Landscape (tablets, desktop browsers, phones turned sideways): brand on the left, mode buttons on the right.
    const landscape = width > height;
    const compact = height < 720;
    const actionsWidth = landscape ? Math.min(420, (width - 40) * 0.5) : Math.min(width - 40, 420);
    // Room left for a row's title: the actions column minus row padding (24), art (56), gaps (24), pill (~124).
    const tileWidth = actionsWidth - 228;
    const mascotSize = landscape ? Math.max(90, Math.min(150, height * 0.3)) : compact ? 110 : 150;
    // Landscape brand column = screen minus side padding (40), the actions column and the gap between them (20).
    const brandWidth = width - 40 - actionsWidth - 20;
    const wordmarkWidth = landscape ? Math.min(brandWidth - 16, 340) : Math.min(width - 48, 360);
    const playClassic = () => {
        if (canContinue) resumeClassic();
        else startClassic();
        router.push("/play");
    };

    return (
        <AppBackground>
            <View
                className="flex-1 items-center"
                style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12, paddingHorizontal: 20 }}
            >
                <View
                    className={landscape ? "flex-row gap-3" : "w-full flex-row justify-end gap-3"}
                    // In landscape the buttons float in the top-left corner, above Roo's column, so both columns get the full
                    // height and nothing covers the mode buttons.
                    style={landscape ? { position: "absolute", top: insets.top + 12, left: 20, zIndex: 1 } : null}
                >
                    <IconButton
                        label={`${t("settings.sound")}: ${soundOn ? t("settings.on") : t("settings.off")}`}
                        onPress={toggleSound}
                    >
                        <SoundIcon off={!soundOn} size={22} />
                    </IconButton>
                    <IconButton
                        label={`${t("settings.vibration")}: ${hapticsOn ? t("settings.on") : t("settings.off")}`}
                        onPress={toggleHaptics}
                    >
                        <VibrationIcon off={!hapticsOn} size={22} />
                    </IconButton>
                </View>

                {landscape ? (
                    <View className="flex-1 flex-row items-center gap-5">
                        <View className="flex-1 items-center justify-center gap-3">
                            <Mascot size={mascotSize} onPress={() => playSound("pickup")} />
                            <Wordmark width={wordmarkWidth} />
                            <Typography variant="body" tone="soft" align="center">
                                {t("home.tagline")}
                            </Typography>
                        </View>

                        <ScrollView
                            style={{ width: actionsWidth, flexGrow: 0, flexShrink: 0 }}
                            contentContainerStyle={{
                                flexGrow: 1,
                                justifyContent: "center",
                                gap: 12,
                                paddingVertical: 12,
                            }}
                            showsVerticalScrollIndicator={false}
                        >
                            <View className="gap-3">
                                <ModeTile
                                    title={t("home.classic")}
                                    width={tileWidth}
                                    accent="sun"
                                    art={<BlockCluster />}
                                    stat={
                                        <>
                                            <CrownIcon size={16} />
                                            <Typography
                                                variant="body"
                                                tone="soft"
                                                className="text-sm"
                                                style={{ fontVariant: ["tabular-nums"] }}
                                            >
                                                {formatScore(best)}
                                            </Typography>
                                        </>
                                    }
                                    cta={canContinue ? t("home.continue") : t("home.play")}
                                    onPress={playClassic}
                                />
                                <ModeTile
                                    title={t("home.adventure")}
                                    width={tileWidth}
                                    accent="amethyst"
                                    art={<GemIcon gem={1} size={36} />}
                                    stat={
                                        <>
                                            <StarIcon size={16} />
                                            <Typography
                                                variant="body"
                                                tone="soft"
                                                className="text-sm"
                                                style={{ fontVariant: ["tabular-nums"] }}
                                            >
                                                {totalStars} / {LEVEL_COUNT * 3}
                                            </Typography>
                                        </>
                                    }
                                    cta={t("home.levelShort", { level: Math.min(unlocked, LEVEL_COUNT) })}
                                    onPress={() => router.push("/levels")}
                                />
                            </View>
                            {canContinue ? (
                                <Button
                                    title={t("home.newGame")}
                                    variant="secondary"
                                    size="md"
                                    onPress={() => {
                                        startClassic();
                                        router.push("/play");
                                    }}
                                />
                            ) : null}
                            <AdBanner />
                        </ScrollView>
                    </View>
                ) : (
                    <>
                        <View className="flex-1 items-center justify-center gap-3">
                            <Mascot size={mascotSize} onPress={() => playSound("pickup")} />
                            <Wordmark width={wordmarkWidth} />
                            <Typography variant="body" tone="soft" align="center">
                                {t("home.tagline")}
                            </Typography>
                        </View>

                        <View className="gap-3" style={{ width: actionsWidth }}>
                            <View className="gap-3">
                                <ModeTile
                                    title={t("home.classic")}
                                    width={tileWidth}
                                    accent="sun"
                                    art={<BlockCluster />}
                                    stat={
                                        <>
                                            <CrownIcon size={16} />
                                            <Typography
                                                variant="body"
                                                tone="soft"
                                                className="text-sm"
                                                style={{ fontVariant: ["tabular-nums"] }}
                                            >
                                                {formatScore(best)}
                                            </Typography>
                                        </>
                                    }
                                    cta={canContinue ? t("home.continue") : t("home.play")}
                                    onPress={playClassic}
                                />
                                <ModeTile
                                    title={t("home.adventure")}
                                    width={tileWidth}
                                    accent="amethyst"
                                    art={<GemIcon gem={1} size={36} />}
                                    stat={
                                        <>
                                            <StarIcon size={16} />
                                            <Typography
                                                variant="body"
                                                tone="soft"
                                                className="text-sm"
                                                style={{ fontVariant: ["tabular-nums"] }}
                                            >
                                                {totalStars} / {LEVEL_COUNT * 3}
                                            </Typography>
                                        </>
                                    }
                                    cta={t("home.levelShort", { level: Math.min(unlocked, LEVEL_COUNT) })}
                                    onPress={() => router.push("/levels")}
                                />
                            </View>
                            {canContinue ? (
                                <Button
                                    title={t("home.newGame")}
                                    variant="secondary"
                                    size="md"
                                    onPress={() => {
                                        startClassic();
                                        router.push("/play");
                                    }}
                                />
                            ) : null}
                            <AdBanner />
                        </View>
                    </>
                )}
            </View>
        </AppBackground>
    );
};
