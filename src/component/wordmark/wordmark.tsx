import { memo } from "react";

import WordmarkArt from "@assets/brand/wordmark.svg";

// Matches the viewBox of src/assets/brand/wordmark.svg.
const RATIO = 230 / 1478;

export const Wordmark = memo(function Wordmark({ width }: { width: number }) {
    return <WordmarkArt width={width} height={width * RATIO} accessibilityLabel="Blockaroo" />;
});
