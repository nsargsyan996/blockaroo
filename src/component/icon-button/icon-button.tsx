import { memo, ReactNode } from "react";
import { Pressable, PressableProps } from "react-native";

import { playSound } from "@service/sound";
import { cn } from "@util";

export interface IconButtonProps extends Omit<PressableProps, "children"> {
    label: string;
    children: ReactNode;
    className?: string;
}

/** Round white button for the corner controls (home, sound, vibration). 56pt touch target. */
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
                "h-14 w-14 items-center justify-center rounded-full border-[3px] border-ink bg-white active:scale-95",
                className
            )}
            {...rest}
        >
            {children}
        </Pressable>
    );
});
