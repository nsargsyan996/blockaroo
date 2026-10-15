import { memo } from "react";
import { Text } from "react-native";

import { cn } from "@util";

import { typographyVariants } from "./typography.style";
import { TypographyProps } from "./typography.type";

export const Typography = memo(function Typography(props: TypographyProps) {
    const { variant, tone, align, className, children, ...rest } = props;
    return (
        <Text
            className={cn(typographyVariants({ variant, tone, align }), className)}
            allowFontScaling={false}
            {...rest}
        >
            {children}
        </Text>
    );
});
