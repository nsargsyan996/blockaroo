import { useTranslation } from "react-i18next";
import { useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
    Button,
    CrownIcon,
    IconButton,
    Mascot,
    PlayIcon,
    SkyBackground,
    SoundIcon,
    Typography,
    VibrationIcon,
    Wordmark,
} from "@component";
import { selectCanContinue, useGameStore, useSettingsStore } from "@store";
import { formatScore } from "@util";
import { useRouter } from "expo-router";

export const HomePage = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();

    const best = useGameStore((state) => state.best);
    const canContinue = useGameStore(selectCanContinue);
    const startGame = useGameStore((state) => state.startGame);
    const { soundOn, hapticsOn, toggleSound, toggleHaptics } = useSettingsStore();

    const compact = height < 700;
    const play = () => {
        if (!canContinue) startGame();
        router.push("/play");
    };
    const newGame = () => {
        startGame();
        router.push("/play");
    };

    return (
        <SkyBackground>
            <View
                className="flex-1 items-center"
                style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20, paddingHorizontal: 20 }}
            >
                <View className="w-full flex-row justify-end gap-3">
                    <IconButton
                        label={`${t("settings.sound")}: ${soundOn ? t("settings.on") : t("settings.off")}`}
                        onPress={toggleSound}
                    >
                        <SoundIcon off={!soundOn} />
                    </IconButton>
                    <IconButton
                        label={`${t("settings.vibration")}: ${hapticsOn ? t("settings.on") : t("settings.off")}`}
                        onPress={toggleHaptics}
                    >
                        <VibrationIcon off={!hapticsOn} />
                    </IconButton>
                </View>

                <View className="flex-1 items-center justify-center gap-2">
                    <Wordmark width={Math.min(width - 40, 380)} />
                    <Typography variant="subtitle" tone="white" align="center">
                        {t("home.tagline")}
                    </Typography>
                    <View className={compact ? "mt-2" : "mt-6"}>
                        <Mascot size={compact ? 150 : 200} />
                    </View>
                </View>

                <View className="w-full max-w-[380px] gap-4">
                    {best > 0 ? (
                        <View className="flex-row items-center justify-center gap-2 self-center rounded-full border-[3px] border-ink bg-white px-5 py-1">
                            <CrownIcon />
                            <Typography variant="subtitle">
                                {t("home.best")}: {formatScore(best)}
                            </Typography>
                        </View>
                    ) : null}
                    <Button
                        title={canContinue ? t("home.continue") : t("home.play")}
                        icon={<PlayIcon />}
                        onPress={play}
                    />
                    {canContinue ? (
                        <Button title={t("home.newGame")} variant="secondary" size="md" onPress={newGame} />
                    ) : null}
                </View>
            </View>
        </SkyBackground>
    );
};
