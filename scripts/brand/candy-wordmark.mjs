// Turns the flat wordmark (wordmark-base.svg: one shade + one face path per letter) into the candy version the app
// uses: each letter gets its own jewel color, a dark outline, a stacked extrusion and a glossy upper half.
// Run: node scripts/brand/candy-wordmark.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BRAND = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "src", "assets", "brand");
const INK = "#0A1C5E";
const DEPTH = 12;
// B L O C K A R O O: the three block O's keep their own colors.
const COLORS = ["#FF9A3C", "#3ED68A", null, "#FF6FC1", "#FFD23F", "#8F6BFF", "#38C7F0", null, null];

const src = readFileSync(join(BRAND, "wordmark-base.svg"), "utf8");
const elements = src.match(/<(path|rect)[^>]*\/>/g);
const out = [];
let letter = 0;
for (const el of elements) {
    if (el.startsWith("<rect") || el.includes('transform="translate(0 8)"')) {
        // Old flat shades go; the small white glints on the block O's stay.
        if (el.startsWith("<rect")) out.push(el);
        continue;
    }
    const d = el.match(/ d="([^"]+)"/)[1];
    const evenodd = el.includes("evenodd") ? ' fill-rule="evenodd" clip-rule="evenodd"' : "";
    const fill = COLORS[letter] ?? el.match(/fill="([^"]+)"/)[1];
    const id = `l${letter}`;
    out.push(`<clipPath id="${id}"><path${evenodd} d="${d}"/></clipPath>`);
    out.push(
        `<path d="${d}" fill="none" stroke="${INK}" stroke-width="22" stroke-linejoin="round" transform="translate(0 ${DEPTH})"/>`
    );
    for (let k = DEPTH; k > 0; k -= 2)
        out.push(`<path${evenodd} d="${d}" fill="${INK}" transform="translate(0 ${k})"/>`);
    out.push(`<path d="${d}" fill="none" stroke="${INK}" stroke-width="22" stroke-linejoin="round"/>`);
    out.push(`<path${evenodd} d="${d}" fill="${fill}"/>`);
    out.push(`<rect x="0" y="0" width="1478" height="108" fill="#FFFFFF" opacity="0.3" clip-path="url(#${id})"/>`);
    letter++;
}
writeFileSync(
    join(BRAND, "wordmark.svg"),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1478 230">\n${out.join("\n")}\n</svg>\n`
);
console.log(`wordmark.svg: ${letter} letters`);
