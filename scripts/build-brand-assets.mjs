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

render(brand("icon.svg"), 1024, "icon.png");
render(brand("adaptive-icon.svg"), 1024, "adaptive-icon.png");
render(brand("roo-happy.svg"), 1024, "splash-icon.png");
render(brand("icon.svg"), 196, "favicon.png");
