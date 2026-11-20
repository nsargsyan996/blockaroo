// Hoppy Blocks brand palette: a deep night-blue stage with glossy jewel blocks. Tailwind (tailwind.config.js) mirrors
// the UI tokens, and runtime styles (gradients, SVG fills, blocks) read them from here.

export const palette = {
    /** The stage behind every screen: deep night blue, a very faint tile grid, an indigo glow and a violet glow. */
    arcade: {
        top: "#151C52",
        mid: "#0D1238",
        deep: "#070A22",
        grid: "rgba(150, 165, 255, 0.06)",
        spot: "#4A5CFF",
        violet: "#9B4DFF",
    },
    board: "#121A4F",
    boardFrame: "#5B6CF0",
    boardCell: "#0B1140",
    boardCellEdge: "#1C2670",
    glass: "rgba(255,255,255,0.08)",
    glassBorder: "rgba(255,255,255,0.14)",
    text: "#FFFFFF",
    textSoft: "#B9CBFF",
    ink: "#140F38",
    sun: "#FFC83D",
    sunShade: "#D9991A",
    leaf: "#3ED68A",
    leafShade: "#21A765",
    berry: "#FF5C8A",
    card: "#151D5C",
} as const;

export interface TBlockColor {
    base: string;
    light: string;
    shade: string;
    glow: string;
    /** Top of the face gradient (the face runs top -> base -> bottom). */
    top: string;
    /** Bottom of the face gradient: base deepened toward the shade. */
    bottom: string;
}

// Deep jewel tones (art kit v7): saturated, darker than candy pastels, so the board reads premium on the night stage.
// Index 0 is the empty cell, so the board can store a color as a small number (1-7).
export const BLOCK_COLORS: TBlockColor[] = [
    {
        base: "transparent",
        light: "transparent",
        shade: "transparent",
        glow: "transparent",
        top: "transparent",
        bottom: "transparent",
    },
    {
        base: "#E8304F",
        light: "#FF7A8C",
        shade: "#A0122E",
        glow: "rgba(232,48,79,0.55)",
        top: "#FF5A70",
        bottom: "#C82240",
    }, // ruby
    {
        base: "#F2711D",
        light: "#FFA868",
        shade: "#A9450B",
        glow: "rgba(242,113,29,0.55)",
        top: "#FF9147",
        bottom: "#D25B14",
    }, // amber
    {
        base: "#F5B70A",
        light: "#FFDB6B",
        shade: "#A87A00",
        glow: "rgba(245,183,10,0.55)",
        top: "#FFCC3A",
        bottom: "#D99E05",
    }, // topaz
    {
        base: "#14B86E",
        light: "#5BE6A8",
        shade: "#077A47",
        glow: "rgba(20,184,110,0.55)",
        top: "#3FD68E",
        bottom: "#0E9A5B",
    }, // emerald
    {
        base: "#1C9FE3",
        light: "#6CD2FF",
        shade: "#0A5F9A",
        glow: "rgba(28,159,227,0.55)",
        top: "#45BBF5",
        bottom: "#1382C2",
    }, // aqua
    {
        base: "#6D44E6",
        light: "#A88CFF",
        shade: "#3E21A3",
        glow: "rgba(109,68,230,0.55)",
        top: "#8A68F5",
        bottom: "#5533C7",
    }, // amethyst
    {
        base: "#E23C98",
        light: "#FF86C8",
        shade: "#9B1563",
        glow: "rgba(226,60,152,0.55)",
        top: "#F563B2",
        bottom: "#C22A80",
    }, // rose
];

export const BLOCK_COLOR_COUNT = BLOCK_COLORS.length - 1;
