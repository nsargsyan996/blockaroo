import { memo } from "react";
import { Image } from "react-native";

// The 3D "Hoppy Blocks" lettering is a rendered image (art kit v7); react-native-svg can't draw its depth and gloss.
import WORDMARK from "@assets/brand/wordmark.png";

// Matches src/assets/brand/wordmark.png (1457 x 268).
const RATIO = 268 / 1457;

export const Wordmark = memo(function Wordmark({ width }: { width: number }) {
    const safe = Math.max(1, width);
    return (
        <Image
            source={WORDMARK}
            style={{ width: safe, height: safe * RATIO }}
            resizeMode="contain"
            accessibilityRole="image"
            accessibilityLabel="Hoppy Blocks"
        />
    );
});
