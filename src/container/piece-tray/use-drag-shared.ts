import { useMemo } from "react";
import { useSharedValue } from "react-native-reanimated";

import { TDragShared } from "./drag.type";

export const useDragShared = (): TDragShared => {
    const x = useSharedValue(0);
    const y = useSharedValue(0);
    const slot = useSharedValue(-1);
    const grow = useSharedValue(0);
    const boardX = useSharedValue(0);
    const boardY = useSharedValue(0);
    const rootX = useSharedValue(0);
    const rootY = useSharedValue(0);
    const lastKey = useSharedValue(-1);
    return useMemo(
        () => ({ x, y, slot, grow, boardX, boardY, rootX, rootY, lastKey }),
        [x, y, slot, grow, boardX, boardY, rootX, rootY, lastKey]
    );
};
