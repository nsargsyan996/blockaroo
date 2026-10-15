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
    /** Landscape puts the score, goals, tray and banner in a column beside the board. */
    landscape: boolean;
    /** Size of one of the three tray slots, which always sit side by side. */
    slotWidth: number;
    slotHeight: number;
    /** Width of the side column in landscape (0 in portrait). */
    sideWidth: number;
}

/** Sizes the board to the screen and decides where the HUD and tray go. */
export const useBoardLayout = (): TBoardLayout => {
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    return useMemo(() => {
        const { maxBoardSize, boardPadding, cellGap, trayScale } = GAME_CONFIG;
        const availableHeight = height - insets.top - insets.bottom;
        const availableWidth = width - insets.left - insets.right;
        const landscape = availableWidth > availableHeight * 1.15;

        if (landscape) {
            // Board as tall as the screen allows; the side column gets the rest of the width (at least 240).
            const boardSize = Math.floor(
                Math.max(220, Math.min(maxBoardSize, availableHeight - 24, availableWidth - 24 - 16 - 240))
            );
            const pitch = (boardSize - boardPadding * 2) / BOARD_SIZE;
            const sideWidth = Math.min(420, availableWidth - boardSize - 24 - 16);
            // The three slots sit side by side in the side column, under the HUD (~100) and above the banner (~70).
            const slotWidth = sideWidth / 3;
            const roomHeight = availableHeight - 24 - 170;
            // The tallest piece is 5 cells, so a slot holds 5 tray cells plus a little air.
            const trayPitch = Math.max(10, Math.min(pitch * trayScale, (slotWidth - 12) / 5, (roomHeight - 16) / 5));
            const slotHeight = Math.ceil(trayPitch * 5 + 16);
            return {
                boardSize,
                pitch,
                cellSize: pitch - cellGap,
                gap: cellGap,
                padding: boardPadding,
                trayPitch,
                landscape,
                slotWidth,
                slotHeight,
                sideWidth,
            };
        }

        // Portrait: HUD + goals (~130), banner (~60) and the tray (~3 tray rows + padding) leave the rest for the board.
        const byWidth = width - 24;
        const byHeight = (availableHeight - 220) / (1 + (3 * trayScale + 0.6) / BOARD_SIZE);
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
            landscape,
            slotWidth: boardSize / 3,
            slotHeight: Math.ceil(trayPitch * 5 + 16),
            sideWidth: 0,
        };
    }, [width, height, insets.top, insets.bottom, insets.left, insets.right]);
};
