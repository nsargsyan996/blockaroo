import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { DevAdOverlay } from "@container";
import { Rubik_500Medium, Rubik_600SemiBold, Rubik_800ExtraBold, useFonts } from "@expo-google-fonts/rubik";
import i18n, { deviceLanguage } from "@i18n";
import { ads, initSounds } from "@service";
import { useSettingsStore } from "@store";
import { palette } from "@theme";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";

import "./global.css";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
    const [fontsLoaded] = useFonts({ Rubik_500Medium, Rubik_600SemiBold, Rubik_800ExtraBold });
    const language = useSettingsStore((state) => state.language);

    useEffect(() => {
        i18n.changeLanguage(language ?? deviceLanguage()).catch(() => undefined);
    }, [language]);

    useEffect(() => {
        initSounds();
        ads.init();
    }, []);

    useEffect(() => {
        if (fontsLoaded) SplashScreen.hideAsync().catch(() => undefined);
    }, [fontsLoaded]);

    if (!fontsLoaded) return null;

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <StatusBar style="light" />
            <Stack
                screenOptions={{
                    headerShown: false,
                    animation: "fade",
                    contentStyle: { backgroundColor: palette.arcade.mid },
                    gestureEnabled: false,
                }}
            />
            <DevAdOverlay />
        </GestureHandlerRootView>
    );
}
