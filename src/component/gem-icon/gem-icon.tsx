import { memo } from "react";
import Svg, { Path } from "react-native-svg";

export interface GemIconProps {
    /** 1 = diamond, 2 = star, 3 = heart. */
    gem: number;
    size: number;
}

const GEMS: Record<number, { fill: string; shine: string; d: string; facets?: string }> = {
    1: {
        fill: "#E9F7FF",
        shine: "#9FD8FF",
        d: "M6 9.5 9.5 4h13L26 9.5 16 28z",
        facets: "M6 9.5h20M12.5 4 11 9.5 16 28 21 9.5 19.5 4",
    },
    2: {
        fill: "#FFF4C2",
        shine: "#FFD23F",
        d: "M16 3.5l3.7 7.6 8.3 1.2-6 5.8 1.4 8.3L16 22.5l-7.4 3.9 1.4-8.3-6-5.8 8.3-1.2z",
    },
    3: {
        fill: "#FFE1EA",
        shine: "#FF8FB0",
        d: "M16 27.5S4 20.2 4 11.8C4 8.2 6.8 5.5 10.2 5.5c2.4 0 4.5 1.3 5.8 3.4 1.3-2.1 3.4-3.4 5.8-3.4 3.4 0 6.2 2.7 6.2 6.3 0 8.4-12 15.7-12 15.7z",
    },
};

/** The gem drawn on top of a block in adventure levels. */
export const GemIcon = memo(function GemIcon({ gem, size }: GemIconProps) {
    const art = GEMS[gem];
    if (!art) return null;
    return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
            <Path d={art.d} fill={art.fill} stroke="rgba(20,15,56,0.55)" strokeWidth={1.8} strokeLinejoin="round" />
            {art.facets ? (
                <Path d={art.facets} fill="none" stroke={art.shine} strokeWidth={1.4} strokeLinejoin="round" />
            ) : null}
        </Svg>
    );
});
