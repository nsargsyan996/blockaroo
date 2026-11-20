import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";

import { Piece, pieceSize, RotateIcon } from "@component";
import { GAME_CONFIG } from "@config";
import { canFitAnywhere, canFitWithTurns, getShape, isRotationSymmetric, TBoard, TPiece, TTray } from "@engine";
import { TBoardLayout } from "@hooks";
import { palette } from "@theme";

import { TDragShared } from "./drag.type";

export interface PieceTrayProps {
    tray: TTray;
    board: TBoard;
    layout: TBoardLayout;
    drag: TDragShared;
    /** Slot the current hint points at, or -1. */
    hintSlot: number;
    /** Quarter turns left in this game. */
    turnsLeft: number;
    disabled: boolean;
    onPickUp: (slot: number) => void;
    /** Fractional grid position of the piece's top-left cell. */
    onHover: (fx: number, fy: number) => void;
    onRelease: (slot: number) => void;
    /** A tap on a piece that can be turned. */
    onTurn: (slot: number) => void;
}

interface TraySlotProps extends Omit<PieceTrayProps, "tray" | "hintSlot"> {
    piece: TPiece | null;
    slot: number;
    hinted: boolean;
}

/** Scale a new piece starts from when it pops into the tray. */
const ENTER_FROM = 0.6;

/** A touch that moves less than this (points) and lifts within TAP_MS is a tap, which turns the piece. */
const TAP_SLOP = 10;
const TAP_MS = 280;

const TraySlot = memo(function TraySlot(props: TraySlotProps) {
    const { piece, slot, board, layout, drag, hinted, turnsLeft, disabled, onPickUp, onHover, onRelease, onTurn } =
        props;
    const { t } = useTranslation();
    const { trayPitch, pitch, gap, slotWidth, slotHeight } = layout;
    const enter = useSharedValue(ENTER_FROM);
    const nudge = useSharedValue(0);
    const spin = useSharedValue(0);
    const shake = useSharedValue(0);
    const touch = useSharedValue({ x: 0, y: 0, at: 0 });

    // New pieces pop into the tray one after another. They start most of the way there and settle fast, so the next
    // piece can be grabbed without waiting for the animation.
    useEffect(() => {
        if (!piece) return;
        enter.value = ENTER_FROM;
        enter.value = withDelay(slot * 30, withSpring(1, { damping: 14, stiffness: 320 }));
    }, [piece, slot, enter]);

    // The piece a hint points at keeps bobbing until it is played.
    useEffect(() => {
        nudge.value = hinted
            ? withRepeat(withSequence(withTiming(1, { duration: 380 }), withTiming(0, { duration: 380 })), -1)
            : withTiming(0, { duration: 120 });
    }, [hinted, nudge]);

    // A turned piece keeps its uid, so this slot stays mounted: start the new shape a quarter turn back and spin it
    // into place, which reads as the piece turning clockwise.
    const shapeId = piece?.shapeId;
    const previousShape = useRef(shapeId);
    useEffect(() => {
        if (shapeId && previousShape.current && shapeId !== previousShape.current) {
            spin.value = -90;
            spin.value = withSpring(0, { damping: 13, stiffness: 260 });
        }
        previousShape.current = shapeId;
    }, [shapeId, spin]);

    const fitsNow = useMemo(() => (piece ? canFitAnywhere(board, getShape(piece.shapeId)) : false), [board, piece]);
    // Fits only once turned: half dimmed with a turn badge, so the player knows a tap will help.
    const fitsTurned = useMemo(
        () => !!piece && !fitsNow && canFitWithTurns(board, piece.shapeId, turnsLeft),
        [board, piece, fitsNow, turnsLeft]
    );
    const canTurn = !!piece && turnsLeft > 0 && !isRotationSymmetric(piece.shapeId);

    const onTap = useCallback(
        (tapped: number) => {
            onRelease(tapped);
            if (canTurn) onTurn(tapped);
            else
                shake.value = withSequence(
                    withTiming(1, { duration: 45 }),
                    withTiming(-1, { duration: 70 }),
                    withTiming(1, { duration: 70 }),
                    withTiming(0, { duration: 45 })
                );
        },
        [canTurn, onRelease, onTurn, shake]
    );

    const gesture = useMemo(() => {
        const shape = piece ? getShape(piece.shapeId) : null;
        const width = shape ? shape.cols * pitch : 0;
        const height = shape ? shape.rows * pitch : 0;
        const lift = GAME_CONFIG.dragLiftCells * pitch;
        return Gesture.Pan()
            .enabled(!!piece && !disabled)
            .minDistance(0)
            .shouldCancelWhenOutside(false)
            .onBegin((event) => {
                touch.value = { x: event.absoluteX, y: event.absoluteY, at: Date.now() };
                drag.x.value = event.absoluteX;
                drag.y.value = event.absoluteY;
                drag.slot.value = slot;
                drag.lastKey.value = -1;
                drag.grow.value = withTiming(1, { duration: 120 });
                runOnJS(onPickUp)(slot);
            })
            .onUpdate((event) => {
                drag.x.value = event.absoluteX;
                drag.y.value = event.absoluteY;
                const fx = (event.absoluteX - width / 2 - drag.boardX.value) / pitch;
                const fy = (event.absoluteY - lift - height - drag.boardY.value) / pitch;
                const key = (Math.round(fy) + 20) * 100 + (Math.round(fx) + 20);
                if (key !== drag.lastKey.value) {
                    drag.lastKey.value = key;
                    runOnJS(onHover)(fx, fy);
                }
            })
            .onFinalize((event) => {
                const start = touch.value;
                const tap =
                    Math.hypot(event.absoluteX - start.x, event.absoluteY - start.y) < TAP_SLOP &&
                    Date.now() - start.at < TAP_MS;
                // A tap leaves the piece in the tray (no drop to wait for) and turns it.
                if (!tap) drag.dropped.value = drag.dropped.value | (1 << slot);
                drag.slot.value = -1;
                drag.grow.value = 0;
                runOnJS(tap ? onTap : onRelease)(slot);
            });
    }, [piece, pitch, disabled, drag, slot, touch, onPickUp, onHover, onRelease, onTap]);

    // Hiding the tray copy while it is dragged happens on the UI thread, in step with the drag layer showing it.
    const style = useAnimatedStyle(() => ({
        opacity:
            drag.slot.value === slot || (drag.dropped.value >> slot) & 1 ? 0 : fitsNow ? 1 : fitsTurned ? 0.6 : 0.35,
        transform: [
            { translateX: shake.value * 5 },
            { rotate: `${spin.value}deg` },
            { scale: enter.value * (1 + 0.14 * nudge.value) },
        ],
    }));

    const size = piece ? pieceSize(piece.shapeId, trayPitch) : { width: 0, height: 0 };
    return (
        <GestureDetector gesture={gesture}>
            <View
                style={{ width: slotWidth, height: slotHeight }}
                className="items-center justify-center"
                // No "button" role here: on web, gesture handler does not capture the pointer for button views, so a
                // drag would stop as soon as the pointer left the piece.
                accessibilityLabel={piece ? `Piece ${slot + 1}` : undefined}
                accessibilityHint={canTurn ? t("game.turnPiece") : undefined}
            >
                {piece ? (
                    <Animated.View style={[style, { width: size.width, height: size.height }]}>
                        <Piece
                            shapeId={piece.shapeId}
                            color={piece.color}
                            pitch={trayPitch}
                            gap={gap * 0.6}
                            gem={piece.gem}
                        />
                    </Animated.View>
                ) : null}
                {fitsTurned ? (
                    <View
                        pointerEvents="none"
                        className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-white/90"
                    >
                        <RotateIcon size={14} color={palette.ink} />
                    </View>
                ) : null}
            </View>
        </GestureDetector>
    );
});

/**
 * The three pieces to place, side by side: under the board in portrait, in the side column in landscape. Each slot
 * is a big touch target; a piece that cannot fit anywhere is dimmed.
 */
export const PieceTray = memo(function PieceTray({ tray, hintSlot, ...rest }: PieceTrayProps) {
    return (
        <View className="flex-row">
            {tray.map((piece, slot) => (
                <TraySlot
                    key={piece?.uid ?? `empty-${slot}`}
                    piece={piece}
                    slot={slot}
                    hinted={hintSlot === slot}
                    {...rest}
                />
            ))}
        </View>
    );
});
