// Writes the app icon, Android adaptive icon foreground and splash artwork in the arcade style: a tilted 2x2 cluster
// of glossy beveled jewel blocks (the Classic card's art, grown up) on the royal blue stage, and the candy wordmark
// under it on the splash. Run: node scripts/brand/arcade-brand.mjs && pnpm brand:build
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BRAND = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "src", "assets", "brand");
const INK = "#0A1C5E";
const BLUE = { top: "#2B5BE0", mid: "#1438B8", deep: "#0A1F7A", grid: "rgba(140,180,255,0.14)", spot: "#7FC4FF" };
// aqua, emerald, amethyst, ruby: the same four as the Classic card's cluster.
const JEWELS = [
    { base: "#38C7F0", light: "#8BE1F8", shade: "#1A93BD" },
    { base: "#3ED68A", light: "#86EDB8", shade: "#1FA463" },
    { base: "#8F6BFF", light: "#BBA5FF", shade: "#6343D6" },
    { base: "#FF5F6D", light: "#FF9AA2", shade: "#C93A4B" },
];

/** One beveled block with a navy outline and extrusion, at (x, y) with side s. */
const block = (x, y, s, tone) => {
    const r = s * 0.14;
    const b = s * 0.16;
    const o = s * 0.05; // outline
    const depth = s * 0.09;
    const inner = `M${x + b} ${y + b}h${s - 2 * b}v${s - 2 * b}h${-(s - 2 * b)}z`;
    return [
        `<rect x="${x - o}" y="${y - o + depth}" width="${s + 2 * o}" height="${s + 2 * o}" rx="${r + o}" fill="${INK}"/>`,
        `<rect x="${x - o}" y="${y - o}" width="${s + 2 * o}" height="${s + 2 * o}" rx="${r + o}" fill="${INK}"/>`,
        `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${r}" fill="${tone.light}"/>`,
        // Bottom-right bevel with true 45° miters at the top-right and bottom-left corners.
        `<path d="M${x + s} ${y}L${x + s} ${y + s}L${x} ${y + s}L${x + b} ${y + s - b}L${x + s - b} ${y + s - b}L${x + s - b} ${y + b}z" fill="${tone.shade}"/>`,
        `<path d="${inner}" fill="${tone.base}"/>`,
        `<ellipse cx="${x + b * 1.9}" cy="${y + b * 1.7}" rx="${s * 0.09}" ry="${s * 0.055}" fill="#FFFFFF" opacity="0.8"/>`,
    ].join("\n");
};

/** The 2x2 cluster centred at (cx, cy), tilted a little, blocks of side s with a gap. */
const cluster = (cx, cy, s, tilt = -8) => {
    const gap = s * 0.08;
    const half = s + gap / 2;
    const cells = [
        [-half, -half, JEWELS[0]],
        [gap / 2, -half, JEWELS[1]],
        [-half, gap / 2, JEWELS[2]],
        [gap / 2, gap / 2, JEWELS[3]],
    ];
    return `<g transform="translate(${cx} ${cy}) rotate(${tilt})">\n${cells.map(([x, y, t]) => block(x, y, s, t)).join("\n")}\n</g>`;
};

const stage = (w, h) => {
    const lines = [];
    for (let x = 0; x <= w; x += w / 8)
        lines.push(`<rect x="${x - 1.5}" y="0" width="3" height="${h}" fill="${BLUE.grid}"/>`);
    for (let y = 0; y <= h; y += w / 8)
        lines.push(`<rect x="0" y="${y - 1.5}" width="${w}" height="3" fill="${BLUE.grid}"/>`);
    return `<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${BLUE.top}"/><stop offset="0.5" stop-color="${BLUE.mid}"/><stop offset="1" stop-color="${BLUE.deep}"/></linearGradient>
<radialGradient id="spot" cx="0.5" cy="0.42" r="0.5"><stop offset="0" stop-color="${BLUE.spot}" stop-opacity="0.5"/><stop offset="1" stop-color="${BLUE.spot}" stop-opacity="0"/></radialGradient>
</defs>
<rect width="${w}" height="${h}" fill="url(#sky)"/>
${lines.join("\n")}
<rect width="${w}" height="${h}" fill="url(#spot)"/>`;
};

const svg = (w, h, body) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">\n${body}\n</svg>\n`;

// App icon: stage + cluster. The OS rounds the corners.
writeFileSync(join(BRAND, "icon.svg"), svg(1024, 1024, `${stage(1024, 1024)}\n${cluster(512, 500, 290)}`));

// Android adaptive foreground: cluster only, inside the 66% safe zone; the launcher adds the blue behind it.
writeFileSync(join(BRAND, "adaptive-icon.svg"), svg(1024, 1024, cluster(512, 512, 236)));

// Splash: cluster over the candy wordmark, transparent, on the splash background color from app.config.ts.
const wordmark = readFileSync(join(BRAND, "wordmark.svg"), "utf8").replace(
    /^<svg[^>]*>/,
    `<svg x="0" y="760" width="1200" height="187" viewBox="0 0 1478 230">`
);
writeFileSync(join(BRAND, "splash.svg"), svg(1200, 1010, `${cluster(600, 380, 250)}\n${wordmark}`));
console.log("icon.svg, adaptive-icon.svg, splash.svg");
