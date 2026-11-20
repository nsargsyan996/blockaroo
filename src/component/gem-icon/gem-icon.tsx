import { memo, useId } from "react";
import Svg, { ClipPath, Defs, Ellipse, G, Path } from "react-native-svg";

export interface GemIconProps {
    /** 1 = diamond, 2 = star, 3 = heart. */
    gem: number;
    size: number;
}

/** Outline shared by every gem: a thick navy rim so the jewel reads on any block colour. */
const RIM = "#0A1C5E";
const RIM_WIDTH = 7;

const DIAMOND = "M28 18 L72 18 L92 40 L50 88 L8 40 Z";
const STAR =
    "M50.0 10.0 L61.8 37.8 L91.8 40.4 L69.0 60.2 L75.9 89.6 L50.0 74.0 L24.1 89.6 L31.0 60.2 L8.2 40.4 L38.2 37.8Z";
const STAR_LIT =
    "M50 54 L50.0 10.0 L61.8 37.8Z M50 54 L61.8 37.8 L91.8 40.4Z M50 54 L91.8 40.4 L69.0 60.2Z M50 54 L8.2 40.4 L38.2 37.8Z M50 54 L38.2 37.8 L50.0 10.0Z";
const STAR_SHADE =
    "M50 54 L69.0 60.2 L75.9 89.6Z M50 54 L75.9 89.6 L50.0 74.0Z M50 54 L50.0 74.0 L24.1 89.6Z M50 54 L24.1 89.6 L31.0 60.2Z M50 54 L31.0 60.2 L8.2 40.4Z";
const HEART =
    "M50 88 C22 70 7 54 7 35 C7 20 18 10 31 10 C40 10 46 15 50 23 C54 15 60 10 69 10 C82 10 93 20 93 35 C93 54 78 70 50 88 Z";

const Diamond = () => (
    <>
        <Path d={DIAMOND} fill="#3FB8FF" />
        <Path d="M28 18 L72 18 L62 40 L38 40Z" fill="#BFF0FF" />
        <Path d="M28 18 L38 40 L8 40Z" fill="#8FE0FF" />
        <Path d="M72 18 L92 40 L62 40Z" fill="#4FC4FF" />
        <Path d="M8 40 L38 40 L50 88Z" fill="#6FD2FF" />
        <Path d="M38 40 L62 40 L50 88Z" fill="#3FA8F5" />
        <Path d="M62 40 L92 40 L50 88Z" fill="#1E7FE0" />
        <Path d={DIAMOND} fill="none" stroke={RIM} strokeWidth={RIM_WIDTH} strokeLinejoin="round" />
        <Path d="M33 22 L46 22 L40 34Z" fill="#FFFFFF" />
    </>
);

const Star = () => (
    <>
        <Path d={STAR} fill="#FFC21A" />
        <Path d={STAR_LIT} fill="#FFE680" />
        <Path d={STAR_SHADE} fill="#F29A0E" />
        <Path d={STAR} fill="none" stroke={RIM} strokeWidth={RIM_WIDTH} strokeLinejoin="round" />
        <Ellipse cx={40} cy={38} rx={6} ry={3.5} transform="rotate(-35 40 38)" fill="#FFFFFF" />
    </>
);

const Heart = ({ clipId }: { clipId: string }) => (
    <>
        <Defs>
            <ClipPath id={clipId}>
                <Path d={HEART} />
            </ClipPath>
        </Defs>
        <Path d={HEART} fill="#FF3D6E" />
        <G clipPath={`url(#${clipId})`}>
            <Path d="M0 0 L50 24 L50 52 L0 46Z" fill="#FF8FB0" />
            <Path d="M0 46 L50 52 L50 100Z" fill="#F0285E" />
            <Path d="M100 46 L50 52 L50 100Z" fill="#C8164C" />
        </G>
        <Path d={HEART} fill="none" stroke={RIM} strokeWidth={RIM_WIDTH} strokeLinejoin="round" />
        <Ellipse cx={28} cy={27} rx={9} ry={5} transform="rotate(-32 28 27)" fill="#FFFFFF" />
    </>
);

/** The gem drawn on top of a block in adventure levels: a bold, faceted candy jewel with a navy rim. */
export const GemIcon = memo(function GemIcon({ gem, size }: GemIconProps) {
    // Each heart needs its own clip id; useId gives one, minus the characters SVG ids can't hold.
    const clipId = `gem${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
    if (gem < 1 || gem > 3) return null;
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
            {gem === 1 ? <Diamond /> : gem === 2 ? <Star /> : <Heart clipId={clipId} />}
        </Svg>
    );
});
