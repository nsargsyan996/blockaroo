import { TextProps } from "react-native";

import type { VariantProps } from "class-variance-authority";

import { typographyVariants } from "./typography.style";

export interface TypographyProps extends TextProps, VariantProps<typeof typographyVariants> {
    className?: string;
}
