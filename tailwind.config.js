const { join } = require("path");

/** Brand tokens mirror src/theme/palette.ts; runtime code imports the same values from there. */
module.exports = {
    content: [join(__dirname, "src/**/*!(*.test).{ts,tsx}")],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                sky: { DEFAULT: "#6FD3FF", deep: "#3BA9F5", night: "#2B7FD9" },
                board: { DEFAULT: "#2A4597", cell: "#3A5BB8" },
                ink: { DEFAULT: "#1F2A5A", soft: "#4A5790" },
                cream: "#FFF6DC",
                sun: { DEFAULT: "#FFC93C", shade: "#E8A417" },
                leaf: { DEFAULT: "#4CD97B", shade: "#2FB25C" },
                berry: "#FF5C8A",
            },
            fontFamily: {
                display: ["Baloo2_800ExtraBold"],
                body: ["Baloo2_600SemiBold"],
            },
            borderRadius: {
                "4xl": "2rem",
            },
        },
    },
    plugins: [],
};
