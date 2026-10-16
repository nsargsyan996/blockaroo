import { memo } from "react";
import Svg, { Path } from "react-native-svg";

import { palette } from "@theme";

export interface StarIconProps {
    size?: number;
    filled?: boolean;
    /** Empty stars on a light surface use a dark ghost instead of a white one. */
    onLight?: boolean;
}

export const StarIcon = memo(function StarIcon({ size = 20, filled = true, onLight = false }: StarIconProps) {
    const ghost = onLight ? "rgba(20,15,56,0.12)" : "rgba(255,255,255,0.12)";
    const ghostEdge = onLight ? "rgba(20,15,56,0.3)" : "rgba(255,255,255,0.2)";
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path
                d="M12 2.8l2.8 5.7 6.3.9-4.6 4.4 1.1 6.2L12 17l-5.6 3 1.1-6.2L2.9 9.4l6.3-.9z"
                fill={filled ? palette.sun : ghost}
                stroke={filled ? palette.sunShade : ghostEdge}
                strokeWidth={1.4}
                strokeLinejoin="round"
            />
        </Svg>
    );
});
