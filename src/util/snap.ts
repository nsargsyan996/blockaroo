import { canPlace, TBoard, TShape } from "@engine";

/**
 * Turns the fractional grid position of a dragged piece into a landing spot. The nearest valid spot within
 * `tolerance` cells wins, so a drop that is a little off still lands where the player meant.
 */
export const resolveDropTarget = (
    board: TBoard,
    shape: TShape,
    fx: number,
    fy: number,
    tolerance: number
): { row: number; col: number } | null => {
    const baseRow = Math.round(fy);
    const baseCol = Math.round(fx);
    let best: { row: number; col: number; distance: number } | null = null;
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            const row = baseRow + dr;
            const col = baseCol + dc;
            const distance = Math.hypot(row - fy, col - fx);
            if (distance > tolerance || !canPlace(board, shape, row, col)) continue;
            if (!best || distance < best.distance) best = { row, col, distance };
        }
    }
    return best ? { row: best.row, col: best.col } : null;
};
