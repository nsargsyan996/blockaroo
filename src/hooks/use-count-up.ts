import { useEffect, useRef, useState } from "react";

/** Animates a number toward its target so score jumps feel like a payout. */
export const useCountUp = (target: number, durationMs = 450) => {
    const [value, setValue] = useState(target);
    const from = useRef(target);

    useEffect(() => {
        const start = from.current;
        if (start === target) return;
        const startedAt = Date.now();
        let frame = 0;
        const tick = () => {
            const progress = Math.min(1, (Date.now() - startedAt) / durationMs);
            const eased = 1 - Math.pow(1 - progress, 3);
            const next = Math.round(start + (target - start) * eased);
            from.current = next;
            setValue(next);
            if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [target, durationMs]);

    return value;
};
