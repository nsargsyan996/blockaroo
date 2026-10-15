const { join } = require("path");

/** Brand tokens mirror src/theme/palette.ts; runtime code imports the same values from there. */
module.exports = {
    content: [join(__dirname, "src/**/*!(*.test).{ts,tsx}")],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                night: { DEFAULT: "#140F38", mid: "#22195A", deep: "#0D0A28" },
                card: "#221A5A",
                soft: "#B6B0E0",
                ink: "#140F38",
                sun: { DEFAULT: "#FFC83D", shade: "#D9991A" },
                leaf: { DEFAULT: "#3ED68A", shade: "#21A765" },
                berry: "#FF5C8A",
                amethyst: { DEFAULT: "#8F6BFF", shade: "#6343D6" },
            },
            fontFamily: {
                display: ["Rubik_800ExtraBold"],
                body: ["Rubik_600SemiBold"],
                medium: ["Rubik_500Medium"],
            },
            borderRadius: {
                "4xl": "2rem",
            },
        },
    },
    plugins: [],
};
