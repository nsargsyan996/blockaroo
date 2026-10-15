import { TOffset, TShape, TShapeTier } from "./engine.type";

// Pieces never rotate, so every orientation is its own shape. "#" is a block, "." is a gap.
const SHAPE_ART: { id: string; tier: TShapeTier; art: string[] }[] = [
    // Tier 1: small pieces that fit almost anywhere.
    { id: "dot", tier: 1, art: ["#"] },
    { id: "bar2-h", tier: 1, art: ["##"] },
    { id: "bar2-v", tier: 1, art: ["#", "#"] },
    { id: "bar3-h", tier: 1, art: ["###"] },
    { id: "bar3-v", tier: 1, art: ["#", "#", "#"] },
    { id: "corner-tl", tier: 1, art: ["##", "#."] },
    { id: "corner-tr", tier: 1, art: ["##", ".#"] },
    { id: "corner-bl", tier: 1, art: ["#.", "##"] },
    { id: "corner-br", tier: 1, art: [".#", "##"] },

    // Tier 2: four-block pieces.
    { id: "square2", tier: 2, art: ["##", "##"] },
    { id: "bar4-h", tier: 2, art: ["####"] },
    { id: "bar4-v", tier: 2, art: ["#", "#", "#", "#"] },
    { id: "t-up", tier: 2, art: [".#.", "###"] },
    { id: "t-down", tier: 2, art: ["###", ".#."] },
    { id: "t-left", tier: 2, art: [".#", "##", ".#"] },
    { id: "t-right", tier: 2, art: ["#.", "##", "#."] },
    { id: "s-h", tier: 2, art: [".##", "##."] },
    { id: "s-v", tier: 2, art: ["#.", "##", ".#"] },
    { id: "z-h", tier: 2, art: ["##.", ".##"] },
    { id: "z-v", tier: 2, art: [".#", "##", "#."] },
    { id: "l-0", tier: 2, art: ["#.", "#.", "##"] },
    { id: "l-90", tier: 2, art: ["###", "#.."] },
    { id: "l-180", tier: 2, art: ["##", ".#", ".#"] },
    { id: "l-270", tier: 2, art: ["..#", "###"] },
    { id: "j-0", tier: 2, art: [".#", ".#", "##"] },
    { id: "j-90", tier: 2, art: ["#..", "###"] },
    { id: "j-180", tier: 2, art: ["##", "#.", "#."] },
    { id: "j-270", tier: 2, art: ["###", "..#"] },

    // Tier 3: big pieces that need planning.
    { id: "bar5-h", tier: 3, art: ["#####"] },
    { id: "bar5-v", tier: 3, art: ["#", "#", "#", "#", "#"] },
    { id: "rect-2x3", tier: 3, art: ["###", "###"] },
    { id: "rect-3x2", tier: 3, art: ["##", "##", "##"] },
    { id: "square3", tier: 3, art: ["###", "###", "###"] },
    { id: "big-corner-tl", tier: 3, art: ["###", "#..", "#.."] },
    { id: "big-corner-tr", tier: 3, art: ["###", "..#", "..#"] },
    { id: "big-corner-bl", tier: 3, art: ["#..", "#..", "###"] },
    { id: "big-corner-br", tier: 3, art: ["..#", "..#", "###"] },
];

const parseShape = ({ id, tier, art }: (typeof SHAPE_ART)[number]): TShape => {
    const cells: TOffset[] = [];
    art.forEach((line, row) => {
        [...line].forEach((char, col) => {
            if (char === "#") cells.push([row, col]);
        });
    });
    return {
        id,
        tier,
        cells,
        rows: art.length,
        cols: Math.max(...art.map((line) => line.length)),
        size: cells.length,
    };
};

export const SHAPES: TShape[] = SHAPE_ART.map(parseShape);

const SHAPES_BY_ID = new Map(SHAPES.map((shape) => [shape.id, shape]));

export const getShape = (id: string): TShape => {
    const shape = SHAPES_BY_ID.get(id);
    if (!shape) throw new Error(`Unknown shape "${id}"`);
    return shape;
};
