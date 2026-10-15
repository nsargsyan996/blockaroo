import { memo } from "react";
import Svg, { Path } from "react-native-svg";

import { palette } from "@theme";

export const StarIcon = memo(function StarIcon({ size = 20, filled = true }: { size?: number; filled?: boolean }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path
                d="M12 2.8l2.8 5.7 6.3.9-4.6 4.4 1.1 6.2L12 17l-5.6 3 1.1-6.2L2.9 9.4l6.3-.9z"
                fill={filled ? palette.sun : "rgba(255,255,255,0.12)"}
                stroke={filled ? palette.sunShade : "rgba(255,255,255,0.2)"}
                strokeWidth={1.4}
                strokeLinejoin="round"
            />
        </Svg>
    );
});
