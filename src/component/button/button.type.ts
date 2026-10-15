import { ReactNode } from "react";
import { PressableProps } from "react-native";

import type { VariantProps } from "class-variance-authority";

import { buttonFaceVariants } from "./button.style";

export interface ButtonProps
    extends Omit<PressableProps, "children" | "style">,
        VariantProps<typeof buttonFaceVariants> {
    title: string;
    icon?: ReactNode;
    className?: string;
}
