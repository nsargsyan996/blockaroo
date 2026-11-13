// Writes the flat wordmark (wordmark-base.svg) from Rubik ExtraBold, the app's display font: one shade + one face path
// per letter, with every O drawn as a little block (rounded square, square hole, white glint). candy-wordmark.mjs then
// turns it into the candy version the app uses.
// Run: node scripts/brand/wordmark-base.mjs && node scripts/brand/candy-wordmark.mjs && node scripts/brand/arcade-brand.mjs
// && pnpm brand:build
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const BRAND = join(ROOT, "src", "assets", "brand");
const FONT = join(ROOT, "node_modules", "@expo-google-fonts", "rubik", "800ExtraBold", "Rubik_800ExtraBold.ttf");

export const WORD = "HOPPY BLOCKS";
const CAP_TOP = 40;
const CAP = 150; // cap height in wordmark units
const BASELINE = CAP_TOP + CAP;
const GAP = 26; // between letters
const SPACE = 64; // between words
const PAD = 43; // left and right margin, room for the candy outline
const HEIGHT = 230;
const SHADE = "#8F86D8";
// Block O colors, in order: aqua, then ruby.
const BLOCK_OS = [
    { face: "#38C7F0", shade: "#1A93BD" },
    { face: "#FF5F6D", shade: "#C93A4B" },
];

/** Just enough of a TrueType reader for simple glyph outlines: cmap format 4, loca and glyf. */
const readFont = (buf) => {
    const tables = {};
    for (let i = 0; i < buf.readUInt16BE(4); i++) {
        const at = 12 + i * 16;
        tables[buf.toString("latin1", at, at + 4)] = buf.readUInt32BE(at + 8);
    }
    const unitsPerEm = buf.readUInt16BE(tables.head + 18);
    const longLoca = buf.readInt16BE(tables.head + 50) === 1;
    const capHeight = buf.readInt16BE(tables["OS/2"] + 88);

    const glyphIndex = (char) => {
        const code = char.charCodeAt(0);
        const cmap = tables.cmap;
        for (let i = 0; i < buf.readUInt16BE(cmap + 2); i++) {
            const sub = cmap + buf.readUInt32BE(cmap + 4 + i * 8 + 4);
            if (buf.readUInt16BE(sub) !== 4) continue;
            const segs = buf.readUInt16BE(sub + 6) / 2;
            const ends = sub + 14;
            const starts = ends + segs * 2 + 2;
            const deltas = starts + segs * 2;
            const offsets = deltas + segs * 2;
            for (let s = 0; s < segs; s++) {
                if (code > buf.readUInt16BE(ends + s * 2) || code < buf.readUInt16BE(starts + s * 2)) continue;
                const rangeOffset = buf.readUInt16BE(offsets + s * 2);
                if (rangeOffset === 0) return (code + buf.readInt16BE(deltas + s * 2)) & 0xffff;
                const at = offsets + s * 2 + rangeOffset + (code - buf.readUInt16BE(starts + s * 2)) * 2;
                return (buf.readUInt16BE(at) + buf.readInt16BE(deltas + s * 2)) & 0xffff;
            }
        }
        throw new Error(`No glyph for ${char}`);
    };

    /** Contours of on/off-curve points in font units (y up). */
    const contours = (char) => {
        const g = glyphIndex(char);
        const loca = (n) =>
            longLoca ? buf.readUInt32BE(tables.loca + n * 4) : buf.readUInt16BE(tables.loca + n * 2) * 2;
        let p = tables.glyf + loca(g);
        const count = buf.readInt16BE(p);
        if (count < 0) throw new Error(`${char} is a composite glyph`);
        p += 10;
        const ends = [];
        for (let i = 0; i < count; i++, p += 2) ends.push(buf.readUInt16BE(p));
        p += 2 + buf.readUInt16BE(p);
        const total = ends.at(-1) + 1;
        const flags = [];
        while (flags.length < total) {
            const flag = buf[p++];
            flags.push(flag);
            if (flag & 8) for (let r = buf[p++]; r > 0; r--) flags.push(flag);
        }
        const coords = (shortBit, sameBit) => {
            let v = 0;
            return flags.map((flag) => {
                if (flag & shortBit) v += flag & sameBit ? buf[p++] : -buf[p++];
                else if (!(flag & sameBit)) {
                    v += buf.readInt16BE(p);
                    p += 2;
                }
                return v;
            });
        };
        const xs = coords(2, 16);
        const ys = coords(4, 32);
        const points = flags.map((flag, i) => ({ x: xs[i], y: ys[i], on: (flag & 1) === 1 }));
        return ends.map((end, i) => points.slice(i === 0 ? 0 : ends[i - 1] + 1, end + 1));
    };

    return { unitsPerEm, capHeight, contours };
};

const n = (v) => Math.round(v * 100) / 100;

/** SVG path for quadratic contours, mapped through to(x, y). */
const toPath = (contours, to) =>
    contours
        .map((pts) => {
            // Start on an on-curve point; between two off-curve points the on-curve point is implied at the midpoint.
            const start = pts.findIndex((pt) => pt.on);
            const ring = [...pts.slice(start), ...pts.slice(0, start)];
            const [sx, sy] = to(ring[0].x, ring[0].y);
            let d = `M${n(sx)} ${n(sy)}`;
            for (let i = 1; i <= ring.length; i++) {
                const pt = ring[i % ring.length];
                if (pt.on) {
                    const [x, y] = to(pt.x, pt.y);
                    d += `L${n(x)} ${n(y)}`;
                    continue;
                }
                const next = ring[(i + 1) % ring.length];
                const end = next.on ? next : { x: (pt.x + next.x) / 2, y: (pt.y + next.y) / 2 };
                const [cx, cy] = to(pt.x, pt.y);
                const [ex, ey] = to(end.x, end.y);
                d += `Q${n(cx)} ${n(cy)} ${n(ex)} ${n(ey)}`;
                if (next.on) i++;
            }
            return `${d}Z`;
        })
        .join("");

const font = readFont(readFileSync(FONT));
const scale = CAP / font.capHeight;
const out = [];
let x = PAD;
let blockO = 0;
for (const char of WORD) {
    if (char === " ") {
        x += SPACE - GAP;
        continue;
    }
    if (char === "O") {
        const tone = BLOCK_OS[blockO++ % BLOCK_OS.length];
        const r = 39;
        const side = CAP;
        const hole = 54;
        const hx = x + (side - hole) / 2;
        const hy = CAP_TOP + (side - hole) / 2;
        const d =
            `M${x + r} ${CAP_TOP} h${side - 2 * r} a${r} ${r} 0 0 1 ${r} ${r} v${side - 2 * r} a${r} ${r} 0 0 1 ${-r} ${r} ` +
            `h${-(side - 2 * r)} a${r} ${r} 0 0 1 ${-r} ${-r} v${-(side - 2 * r)} a${r} ${r} 0 0 1 ${r} ${-r} Z ` +
            `M${hx} ${hy} h${hole} v${hole} h${-hole} Z`;
        out.push(`<path fill-rule="evenodd" d="${d}" fill="${tone.shade}" transform="translate(0 8)"/>`);
        out.push(`<path fill-rule="evenodd" d="${d}" fill="${tone.face}"/>`);
        out.push(
            `<rect x="${x + 21}" y="${CAP_TOP + 12}" width="42" height="15" rx="7.5" fill="#FFFFFF" opacity="0.6"/>`
        );
        x += side + GAP;
        continue;
    }
    const contours = font.contours(char);
    const minX = Math.min(...contours.flat().map((pt) => pt.x));
    const maxX = Math.max(...contours.flat().map((pt) => pt.x));
    const left = x;
    const d = toPath(contours, (fx, fy) => [left + (fx - minX) * scale, BASELINE - fy * scale]);
    out.push(`<path d="${d}" fill="${SHADE}" transform="translate(0 8)"/>`);
    out.push(`<path d="${d}" fill="#FFFFFF"/>`);
    x += (maxX - minX) * scale + GAP;
}
const width = Math.ceil(x - GAP + PAD);
writeFileSync(
    join(BRAND, "wordmark-base.svg"),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${HEIGHT}">\n${out.join("\n")}\n</svg>\n`
);
console.log(`wordmark-base.svg: "${WORD}", ${width}×${HEIGHT}`);
