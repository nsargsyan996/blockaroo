import { memo, useCallback } from "react";
import { GestureResponderEvent, Pressable, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { playSound } from "@service/sound";
import { cn } from "@util";

import { Typography } from "../typography";
import { BUTTON_DEPTH, buttonEdgeVariants, buttonFaceVariants } from "./button.style";
import { ButtonProps } from "./button.type";

/** Big, squishy button: the face sinks onto its edge when pressed. Sized for small fingers. */
export const Button = memo(function Button(props: ButtonProps) {
    const { title, icon, variant, size, className, onPress, disabled, ...rest } = props;
    const press = useSharedValue(0);

    const faceStyle = useAnimatedStyle(() => ({ transform: [{ translateY: press.value * BUTTON_DEPTH }] }));

    const handlePress = useCallback(
        (event: GestureResponderEvent) => {
            playSound("tap");
            onPress?.(event);
        },
        [onPress]
    );

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={title}
            disabled={disabled}
            onPressIn={() => (press.value = withSpring(1, { duration: 120 }))}
            onPressOut={() => (press.value = withSpring(0, { duration: 220 }))}
            onPress={handlePress}
            className={cn(disabled && "opacity-50", className)}
            style={{ paddingBottom: BUTTON_DEPTH }}
            {...rest}
        >
            <View
                className={cn(buttonEdgeVariants({ variant }), "absolute inset-x-0 bottom-0")}
                style={{ top: BUTTON_DEPTH }}
            />
            {/* NativeWind styles plain Views; the Reanimated wrapper only moves the face. */}
            <Animated.View style={faceStyle}>
                <View className={buttonFaceVariants({ variant, size })}>
                    {icon}
                    <Typography
                        variant={size === "md" ? "subtitle" : "title"}
                        tone={variant === "secondary" ? "white" : "ink"}
                    >
                        {title}
                    </Typography>
                </View>
            </Animated.View>
        </Pressable>
    );
});
