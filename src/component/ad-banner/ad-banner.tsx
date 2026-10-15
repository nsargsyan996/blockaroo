import { memo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Typography } from "../typography";

/** Web: a labelled placeholder in development (shows where the banner sits), nothing in production. */
export const AdBanner = memo(function AdBanner() {
    const { t } = useTranslation();
    if (!__DEV__) return null;
    return (
        <View
            className="h-[56px] w-full max-w-[468px] items-center justify-center self-center rounded-xl border border-dashed border-white/25 bg-white/5"
            accessibilityLabel="Advertisement"
        >
            <Typography variant="caption" tone="soft">
                {t("ads.test")} · 320×50
            </Typography>
        </View>
    );
});
