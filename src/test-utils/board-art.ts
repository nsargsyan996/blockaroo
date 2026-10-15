import { BOARD_SIZE, TBoard } from "@engine";

/** Builds a board from 8 strings: "#" is a filled cell, "." is empty. Keeps engine tests readable. */
export const boardFromArt = (art: string[]): TBoard => {
    if (art.length !== BOARD_SIZE) throw new Error("Board art needs 8 rows");
    return art.flatMap((line) => [...line].map((char) => (char === "#" ? 1 : 0)));
};

export const boardToArt = (board: TBoard): string[] =>
    Array.from({ length: BOARD_SIZE }, (_, row) =>
        board
            .slice(row * BOARD_SIZE, (row + 1) * BOARD_SIZE)
            .map((cell) => (cell ? "#" : "."))
            .join("")
    );
