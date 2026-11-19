// Renders the brand SVGs in src/assets/brand into the PNGs Expo needs (icon, adaptive icon, splash, favicon).
// Run after editing an SVG: `pnpm brand:build`.
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const brand = (name) => readFileSync(join("src/assets/brand", name), "utf8");

const render = (svg, width, out) => {
    const png = new Resvg(svg, { fitTo: { mode: "width", value: width }, background: "rgba(0,0,0,0)" })
        .render()
        .asPng();
    writeFileSync(join("assets/images", out), png);
    console.log(`assets/images/${out} (${width}px)`);
};

// Android clips the splash icon to a circle ⅔ of the image wide, so its splash shrinks the art into that circle.
const insetSplash = (svg, scale) => {
    const size = 1200 * scale;
    const offset = (1200 - size) / 2;
    const inner = svg.replace(
        'width="1200" height="1200"',
        `x="${offset}" y="${offset}" width="${size}" height="${size}"`
    );
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">${inner}</svg>`;
};

render(brand("icon.svg"), 1024, "icon.png");
render(brand("adaptive-icon.svg"), 1024, "adaptive-icon.png");
render(brand("splash.svg"), 1200, "splash-icon.png");
render(insetSplash(brand("splash.svg"), 0.56), 1200, "splash-icon-android.png");
render(brand("icon.svg"), 196, "favicon.png");
