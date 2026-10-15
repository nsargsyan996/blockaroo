import { memo } from "react";
import Svg, { Path, Rect } from "react-native-svg";

import { palette } from "@theme";

export interface IconProps {
    size?: number;
    color?: string;
}

const stroke = (color: string) =>
    ({ stroke: color, strokeWidth: 2.6, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" }) as const;

export const HomeIcon = memo(function HomeIcon({ size = 26, color = palette.text }: IconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M3.5 11 12 4l8.5 7" {...stroke(color)} />
            <Path d="M6 9.5V20h4.5v-5h3v5H18V9.5" {...stroke(color)} />
        </Svg>
    );
});

export const SoundIcon = memo(function SoundIcon({
    size = 26,
    color = palette.text,
    off,
}: IconProps & { off?: boolean }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" {...stroke(color)} fill={color} />
            {off ? (
                <Path d="m16 9.5 5 5m0-5-5 5" {...stroke(color)} />
            ) : (
                <>
                    <Path d="M15.5 9a4 4 0 0 1 0 6" {...stroke(color)} />
                    <Path d="M18.2 6.5a7.5 7.5 0 0 1 0 11" {...stroke(color)} />
                </>
            )}
        </Svg>
    );
});

export const VibrationIcon = memo(function VibrationIcon({
    size = 26,
    color = palette.text,
    off,
}: IconProps & { off?: boolean }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Rect x="8" y="3.5" width="8" height="17" rx="2" {...stroke(color)} />
            {off ? (
                <Path d="M3 3l18 18" {...stroke(color)} />
            ) : (
                <>
                    <Path d="M4.5 9v6M2 10.5v3M19.5 9v6M22 10.5v3" {...stroke(color)} />
                </>
            )}
        </Svg>
    );
});

export const CrownIcon = memo(function CrownIcon({ size = 22, color = palette.sun }: IconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path
                d="M3.5 8.5 8 12l4-6.5 4 6.5 4.5-3.5-1.8 9.5H5.3z"
                fill={color}
                stroke={palette.sunShade}
                strokeWidth={1.5}
                strokeLinejoin="round"
            />
        </Svg>
    );
});

export const PlayIcon = memo(function PlayIcon({ size = 26, color = palette.text }: IconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M7 4.5v15l12-7.5z" fill={color} stroke={color} strokeWidth={2} strokeLinejoin="round" />
        </Svg>
    );
});

export const VideoIcon = memo(function VideoIcon({ size = 26, color = palette.text }: IconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Rect x="2.5" y="6" width="13" height="12" rx="2.5" {...stroke(color)} />
            <Path d="m15.5 10.5 6-3.5v10l-6-3.5z" {...stroke(color)} fill={color} />
        </Svg>
    );
});
