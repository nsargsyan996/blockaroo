// Blockaroo brand palette. Tailwind (tailwind.config.js) and runtime styles (gradients, SVG fills) both read it,
// so a color is changed in one place.

export const palette = {
    sky: "#6FD3FF",
    skyDeep: "#3BA9F5",
    skyNight: "#2B7FD9",
    board: "#2A4597",
    boardCell: "#3A5BB8",
    boardCellShade: "#33519F",
    ink: "#1F2A5A",
    inkSoft: "#4A5790",
    cloud: "#FFFFFF",
    cream: "#FFF6DC",
    sun: "#FFC93C",
    sunShade: "#E8A417",
    leaf: "#4CD97B",
    leafShade: "#2FB25C",
    berry: "#FF5C8A",
    roo: "#F5A35C",
    rooShade: "#D97F3A",
    rooBelly: "#FFE3BF",
} as const;

export interface TBlockColor {
    base: string;
    light: string;
    shade: string;
}

// Index 0 is the empty cell, so the board can store a color as a small number (1-7).
export const BLOCK_COLORS: TBlockColor[] = [
    { base: "transparent", light: "transparent", shade: "transparent" },
    { base: "#FF6B6B", light: "#FF9C9C", shade: "#D94848" }, // strawberry
    { base: "#FF9F43", light: "#FFC17F", shade: "#D97B22" }, // tangerine
    { base: "#FFD23F", light: "#FFE484", shade: "#E0AE17" }, // banana
    { base: "#4CD97B", light: "#86EBA8", shade: "#2CB45B" }, // kiwi
    { base: "#3CCFE0", light: "#84E5F0", shade: "#1FA8B8" }, // splash
    { base: "#9B6BFF", light: "#BE9FFF", shade: "#7646E0" }, // grape
    { base: "#FF7AC6", light: "#FFA9DA", shade: "#DB55A2" }, // bubblegum
];

export const BLOCK_COLOR_COUNT = BLOCK_COLORS.length - 1;
