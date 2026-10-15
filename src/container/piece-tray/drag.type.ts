import { SharedValue } from "react-native-reanimated";

/** Drag state shared between the tray (gesture), the drag layer (drawing) and the board (measured origin). */
export interface TDragShared {
    /** Finger position in window coordinates. */
    x: SharedValue<number>;
    y: SharedValue<number>;
    /** Tray slot being dragged, or -1. */
    slot: SharedValue<number>;
    /** 0 = drawn at tray size, 1 = drawn at board size. */
    grow: SharedValue<number>;
    /** Top-left of the board grid in window coordinates. */
    boardX: SharedValue<number>;
    boardY: SharedValue<number>;
    /** Top-left of the play screen in window coordinates, used to place the drag layer. */
    rootX: SharedValue<number>;
    rootY: SharedValue<number>;
    /** Last rounded grid cell reported to JS, to avoid calling back on every frame. */
    lastKey: SharedValue<number>;
}
