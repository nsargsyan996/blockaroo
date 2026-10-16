// Blockaroo brand palette: a calm night sky with jewel-bright blocks. Tailwind (tailwind.config.js) mirrors the UI
// tokens, and runtime styles (gradients, SVG fills, blocks) read them from here.

export const palette = {
    night: "#140F38",
    nightMid: "#22195A",
    nightDeep: "#0D0A28",
    board: "#0F0B2E",
    boardCell: "#1D1750",
    boardCellEdge: "#29226A",
    glass: "rgba(255,255,255,0.08)",
    glassBorder: "rgba(255,255,255,0.14)",
    text: "#FFFFFF",
    textSoft: "#B6B0E0",
    ink: "#140F38",
    sun: "#FFC83D",
    sunShade: "#D9991A",
    leaf: "#3ED68A",
    leafShade: "#21A765",
    berry: "#FF5C8A",
    card: "#221A5A",
    /** The home screen's arcade stage: royal blue, a faint tile grid and a bright spot behind the title. */
    arcade: { top: "#2B5BE0", mid: "#1438B8", deep: "#0A1F7A", grid: "rgba(140, 180, 255, 0.14)", spot: "#7FC4FF" },
} as const;

export interface TBlockColor {
    base: string;
    light: string;
    shade: string;
    glow: string;
}

// Index 0 is the empty cell, so the board can store a color as a small number (1-7).
export const BLOCK_COLORS: TBlockColor[] = [
    { base: "transparent", light: "transparent", shade: "transparent", glow: "transparent" },
    { base: "#FF5F6D", light: "#FF9AA2", shade: "#C93A4B", glow: "rgba(255,95,109,0.55)" }, // ruby
    { base: "#FF9A3C", light: "#FFC27F", shade: "#C96E1C", glow: "rgba(255,154,60,0.55)" }, // amber
    { base: "#FFD23F", light: "#FFE68A", shade: "#C9A017", glow: "rgba(255,210,63,0.55)" }, // topaz
    { base: "#3ED68A", light: "#86EDB8", shade: "#1FA463", glow: "rgba(62,214,138,0.55)" }, // emerald
    { base: "#38C7F0", light: "#8BE1F8", shade: "#1A93BD", glow: "rgba(56,199,240,0.55)" }, // aqua
    { base: "#8F6BFF", light: "#BBA5FF", shade: "#6343D6", glow: "rgba(143,107,255,0.55)" }, // amethyst
    { base: "#FF6FC1", light: "#FFA6D8", shade: "#CC4796", glow: "rgba(255,111,193,0.55)" }, // rose
];

export const BLOCK_COLOR_COUNT = BLOCK_COLORS.length - 1;
