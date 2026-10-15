import { memo, ReactNode } from "react";
import { Pressable, PressableProps } from "react-native";

import { playSound } from "@service/sound";
import { cn } from "@util";

export interface IconButtonProps extends Omit<PressableProps, "children"> {
    label: string;
    children: ReactNode;
    className?: string;
}

/** Round glass button for the corner controls (home, sound, vibration). 48pt plus hit slop. */
export const IconButton = memo(function IconButton({ label, children, className, onPress, ...rest }: IconButtonProps) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            hitSlop={8}
            onPress={(event) => {
                playSound("tap");
                onPress?.(event);
            }}
            className={cn(
                "h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 active:scale-95",
                className
            )}
            {...rest}
        >
            {children}
        </Pressable>
    );
});
