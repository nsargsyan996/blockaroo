import { memo } from "react";

import WordmarkArt from "@assets/brand/wordmark.svg";

const RATIO = 250 / 790;

export const Wordmark = memo(function Wordmark({ width }: { width: number }) {
    return <WordmarkArt width={width} height={width * RATIO} accessibilityLabel="Blockaroo" />;
});
