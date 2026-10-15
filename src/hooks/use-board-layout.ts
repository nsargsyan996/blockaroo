import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GAME_CONFIG } from "@config";
import { BOARD_SIZE } from "@engine";

export interface TBoardLayout {
    boardSize: number;
    /** Distance between cell origins on the board. */
    pitch: number;
    cellSize: number;
    gap: number;
    padding: number;
    trayPitch: number;
    trayHeight: number;
}

/** Sizes the board to the screen: as wide as fits, leaving room for the score bar above and the tray below. */
export const useBoardLayout = (): TBoardLayout => {
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    return useMemo(() => {
        const { maxBoardSize, boardPadding, cellGap, trayScale } = GAME_CONFIG;
        const availableHeight = height - insets.top - insets.bottom;
        // HUD (~96) + spacing (~48) + tray (~3 tray rows + padding) leaves the rest for the board.
        const byWidth = width - 24;
        const byHeight = (availableHeight - 150) / (1 + (3 * trayScale + 0.6) / BOARD_SIZE);
        const boardSize = Math.floor(Math.max(240, Math.min(maxBoardSize, byWidth, byHeight)));
        const pitch = (boardSize - boardPadding * 2) / BOARD_SIZE;
        const trayPitch = pitch * trayScale;
        return {
            boardSize,
            pitch,
            cellSize: pitch - cellGap,
            gap: cellGap,
            padding: boardPadding,
            trayPitch,
            trayHeight: Math.ceil(trayPitch * 5 + 16),
        };
    }, [width, height, insets.top, insets.bottom]);
};
