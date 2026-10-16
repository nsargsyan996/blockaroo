import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { Button, Typography, VideoIcon } from "@component";
import { useDevAdStore } from "@service/ads";
import { palette } from "@theme";

const REWARD_SECONDS = 3;

/** Full-screen stand-in for rewarded and interstitial ads in the web development build. */
export const DevAdOverlay = () => {
    const { t } = useTranslation();
    const kind = useDevAdStore((state) => state.kind);
    const finish = useDevAdStore((state) => state.finish);
    const [left, setLeft] = useState(REWARD_SECONDS);

    useEffect(() => {
        if (!kind) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- restarts the countdown when a new ad opens
        setLeft(kind === "rewarded" ? REWARD_SECONDS : 1);
        const timer = setInterval(() => setLeft((value) => Math.max(0, value - 1)), 1000);
        return () => clearInterval(timer);
    }, [kind]);

    if (!kind) return null;
    return (
        <Animated.View
            entering={FadeIn.duration(150)}
            style={[StyleSheet.absoluteFill, { backgroundColor: "#000000" }]}
        >
            <View className="flex-1 items-center justify-center gap-5 px-8">
                <View className="rounded-full bg-sun px-3 py-1">
                    <Typography variant="caption" tone="ink">
                        {t("ads.test")}
                    </Typography>
                </View>
                <VideoIcon size={56} color={palette.textSoft} />
                <Typography variant="subtitle" align="center">
                    {kind === "rewarded" ? "Rewarded video" : "Interstitial"}
                </Typography>
                <Typography variant="body" tone="soft" align="center">
                    {t("ads.testBody")}
                </Typography>
                {kind === "rewarded" ? (
                    <Button
                        title={left > 0 ? `${t("ads.reward")} (${left})` : t("ads.reward")}
                        variant="success"
                        size="md"
                        disabled={left > 0}
                        onPress={() => finish(true)}
                        className="w-full max-w-[320px]"
                    />
                ) : null}
                <Button
                    title={t("ads.close")}
                    variant="secondary"
                    size="md"
                    disabled={kind === "interstitial" && left > 0}
                    onPress={() => finish(false)}
                    className="w-full max-w-[320px]"
                />
            </View>
        </Animated.View>
    );
};
