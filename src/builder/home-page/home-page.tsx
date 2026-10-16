import { memo, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, useWindowDimensions, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
    AdBanner,
    AppBackground,
    Block,
    Button,
    BUTTON_DEPTH,
    CrownIcon,
    Entrance,
    GemIcon,
    IconButton,
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

/** How far a mode card sinks onto its shaded edge when pressed: deeper than a button, it is a bigger block. */
const CARD_DEPTH = 8;

/**
 * One orchestrated entrance: the wordmark pops in over the bright spot, then the mode cards rise one after the
 * other. The pieces in the sky are already drifting; nothing else moves.
 */
const BEAT = { wordmark: 120, tagline: 320, classic: 260, adventure: 340, extra: 420 };

interface ModeCardProps {
    title: string;
    /** Inner width of the card, used to size the title so long names (e.g. "Приключение") fit on small phones. */
    width: number;
    art: ReactNode;
    stat: ReactNode;
    cta: string;
    accent: "sun" | "amethyst";
    onPress: () => void;
}

/**
 * One of the two mode cards: a big glossy block in its own color, sitting on a shaded edge, with art, name and a
 * stat on the left and a white play pill on the right. Pressing it sinks the whole card onto its edge, like Button.
 */
const ModeCard = memo(function ModeCard({ title, width, art, stat, cta, accent, onPress }: ModeCardProps) {
    const sun = accent === "sun";
    // Rubik ExtraBold averages about 0.62 em per character.
    const titleSize = Math.max(16, Math.min(24, width / (title.length * 0.62)));
    const press = useSharedValue(0);
    const faceStyle = useAnimatedStyle(() => ({ transform: [{ translateY: press.value * CARD_DEPTH }] }));
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${title}: ${cta}`}
            pressRetentionOffset={16}
            onPressIn={() => press.set(withSpring(1, { duration: 120 }))}
            onPressOut={() => press.set(withSpring(0, { duration: 220 }))}
            onPress={() => {
                playSound("tap");
                onPress();
            }}
            style={{ paddingBottom: CARD_DEPTH }}
        >
            <View
                className={cn("absolute inset-x-0 bottom-0 rounded-3xl", sun ? "bg-sun-shade" : "bg-amethyst-shade")}
                style={{ top: CARD_DEPTH }}
            />
            <Animated.View style={faceStyle}>
                <View
                    className={cn(
                        "min-h-[92px] flex-row items-center gap-3 overflow-hidden rounded-3xl px-3 py-3",
                        sun ? "bg-sun" : "bg-amethyst"
                    )}
                >
                    {/* The glossy upper half, the same sheen as the blocks and the wordmark. */}
                    <View pointerEvents="none" className="absolute inset-x-0 top-0 h-1/2 bg-white/25" />
                    <View className="h-14 w-14 items-center justify-center rounded-2xl bg-ink/15">{art}</View>
                    <View className="flex-1 gap-0.5">
                        <Typography
                            variant="subtitle"
                            tone={sun ? "ink" : "white"}
                            style={{ fontSize: titleSize, lineHeight: titleSize * 1.3 }}
                            numberOfLines={1}
                        >
                            {title}
                        </Typography>
                        <View className="flex-row items-center gap-1">{stat}</View>
                    </View>
                    <View className="min-w-[112px]" style={{ paddingBottom: BUTTON_DEPTH }}>
                        <View
                            className="absolute inset-x-0 bottom-0 rounded-2xl bg-ink/35"
                            style={{ top: BUTTON_DEPTH }}
                        />
                        <View className="min-h-[48px] flex-row items-center justify-center gap-1.5 rounded-2xl bg-white px-3">
                            <PlayIcon size={16} color={palette.ink} />
                            <Typography variant="subtitle" tone="ink" className="text-lg" numberOfLines={1}>
                                {cta}
                            </Typography>
                        </View>
                    </View>
                </View>
            </Animated.View>
        </Pressable>
    );
});

/** Four tiny blocks, the Classic card's art. */
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

    // Landscape (tablets, desktop browsers, phones turned sideways): brand on the left, mode cards on the right.
    const landscape = width > height;
    const actionsWidth = landscape ? Math.min(420, (width - 40) * 0.5) : Math.min(width - 40, 420);
    // Room left for a card's title: the actions column minus card padding (24), art (56), gaps (24), pill (~124).
    const cardWidth = actionsWidth - 228;
    // Landscape brand column = screen minus side padding (40), the actions column and the gap between them (20).
    const brandWidth = width - 40 - actionsWidth - 20;
    // Clamped: the web briefly reports a 1px-wide window on load, and an SVG with a negative width throws.
    const wordmarkWidth = Math.max(120, landscape ? Math.min(brandWidth - 16, 380) : Math.min(width - 32, 420));
    const playClassic = () => {
        if (canContinue) resumeClassic();
        else startClassic();
        router.push("/play");
    };

    const brand = (
        <>
            <Entrance kind="pop" delay={BEAT.wordmark}>
                <Wordmark width={wordmarkWidth} />
            </Entrance>
            <Entrance kind="fade" delay={BEAT.tagline} duration={220}>
                {/* Body size on narrow phones keeps the tagline on one line. */}
                <Typography
                    variant={width < 430 ? "body" : "subtitle"}
                    tone="white"
                    align="center"
                    className="opacity-90"
                >
                    {t("home.tagline")}
                </Typography>
            </Entrance>
        </>
    );

    const actions = (
        <>
            <View className="gap-4">
                <Entrance delay={BEAT.classic}>
                    <ModeCard
                        title={t("home.classic")}
                        width={cardWidth}
                        accent="sun"
                        art={<BlockCluster />}
                        stat={
                            <>
                                <CrownIcon size={16} color={palette.ink} />
                                <Typography
                                    variant="body"
                                    tone="ink"
                                    className="text-sm opacity-80"
                                    style={{ fontVariant: ["tabular-nums"] }}
                                >
                                    {formatScore(best)}
                                </Typography>
                            </>
                        }
                        cta={canContinue ? t("home.continue") : t("home.play")}
                        onPress={playClassic}
                    />
                </Entrance>
                <Entrance delay={BEAT.adventure}>
                    <ModeCard
                        title={t("home.adventure")}
                        width={cardWidth}
                        accent="amethyst"
                        art={<GemIcon gem={1} size={36} />}
                        stat={
                            <>
                                <StarIcon size={16} />
                                <Typography
                                    variant="body"
                                    tone="white"
                                    className="text-sm opacity-90"
                                    style={{ fontVariant: ["tabular-nums"] }}
                                >
                                    {totalStars} / {LEVEL_COUNT * 3}
                                </Typography>
                            </>
                        }
                        cta={t("home.levelShort", { level: Math.min(unlocked, LEVEL_COUNT) })}
                        onPress={() => router.push("/levels")}
                    />
                </Entrance>
            </View>
            {canContinue ? (
                <Entrance delay={BEAT.extra}>
                    <Button
                        title={t("home.newGame")}
                        variant="secondary"
                        size="md"
                        onPress={() => {
                            startClassic();
                            router.push("/play");
                        }}
                    />
                </Entrance>
            ) : null}
            <Entrance delay={BEAT.extra}>
                <AdBanner />
            </Entrance>
        </>
    );

    return (
        <AppBackground pieces>
            <View
                className="flex-1 items-center"
                style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12, paddingHorizontal: 20 }}
            >
                <View
                    className={landscape ? "flex-row gap-3" : "w-full flex-row justify-end gap-3"}
                    // In landscape the buttons float in the top-left corner, above the brand column, so both columns get
                    // the full height and nothing covers the mode cards.
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
                        <View className="flex-1 items-center justify-center gap-4">{brand}</View>
                        <ScrollView
                            style={{ width: actionsWidth, flexGrow: 0, flexShrink: 0 }}
                            contentContainerStyle={{
                                flexGrow: 1,
                                justifyContent: "center",
                                gap: 16,
                                paddingVertical: 12,
                            }}
                            showsVerticalScrollIndicator={false}
                        >
                            {actions}
                        </ScrollView>
                    </View>
                ) : (
                    <>
                        <View className="flex-1 items-center justify-center gap-4">{brand}</View>
                        <View className="gap-4" style={{ width: actionsWidth }}>
                            {actions}
                        </View>
                    </>
                )}
            </View>
        </AppBackground>
    );
};
