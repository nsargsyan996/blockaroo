import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { Baloo2_600SemiBold, Baloo2_800ExtraBold, useFonts } from "@expo-google-fonts/baloo-2";
import { ads, initSounds } from "@service";
import { palette } from "@theme";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";

import "../i18n";
import "./global.css";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
    const [fontsLoaded] = useFonts({ Baloo2_600SemiBold, Baloo2_800ExtraBold });

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
            <StatusBar style="dark" />
            <Stack
                screenOptions={{
                    headerShown: false,
                    animation: "fade",
                    contentStyle: { backgroundColor: palette.sky },
                    gestureEnabled: false,
                }}
            />
        </GestureHandlerRootView>
    );
}
