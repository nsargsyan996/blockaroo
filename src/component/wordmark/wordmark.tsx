import { memo } from "react";

import WordmarkArt from "@assets/brand/wordmark.svg";

// Matches the viewBox of src/assets/brand/wordmark.svg.
const RATIO = 230 / 1478;

export const Wordmark = memo(function Wordmark({ width }: { width: number }) {
    const safe = Math.max(1, width);
    return <WordmarkArt width={safe} height={safe * RATIO} accessibilityLabel="Blockaroo" />;
});
