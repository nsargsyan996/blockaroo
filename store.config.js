// App Store listing for `eas metadata:push`. The texts come from store/listing.md, so that file stays the one place to
// edit them. Screenshots, App Privacy and the review contact are set in App Store Connect.
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const LISTING = readFileSync(join(__dirname, "store/listing.md"), "utf8");
const PRIVACY_URL = "https://nsargsyan996.github.io/blockaroo/privacy/";
const SUPPORT_URL = "https://nsargsyan996.github.io/blockaroo/";

/** The ```text block under `### <field>` inside `## <section>` of listing.md. */
const field = (section, name) => {
    const body = LISTING.split(/^## /m).find((part) => part.startsWith(section));
    const match = body?.match(new RegExp(`^### ${name}[^\\n]*\\n+\`\`\`text\\n([\\s\\S]*?)\\n\`\`\``, "m"));
    if (!match) throw new Error(`store/listing.md: no "${name}" under "${section}"`);
    return match[1].trim();
};

const info = (section) => ({
    title: field(section, "App Store name"),
    subtitle: field(section, "App Store subtitle"),
    promoText: field(section, "App Store promotional text"),
    description: field(section, "Full description"),
    keywords: field(section, "App Store keywords").split(","),
    marketingUrl: SUPPORT_URL,
    supportUrl: SUPPORT_URL,
    privacyPolicyUrl: PRIVACY_URL,
});

module.exports = {
    configVersion: 0,
    apple: {
        // Must match `version` in app.config.ts, or App Store Connect won't offer the build for this version.
        version: "1.0.1",
        copyright: "2026 Narek Sargsyan",
        categories: [["GAMES", "GAMES_PUZZLE", "GAMES_FAMILY"]],
        info: {
            "en-US": info("English"),
            ru: info("Russian"),
        },
        // Age rating: 4+. Everything "none"; the only "yes" is that the app shows ads.
        advisory: {
            alcoholTobaccoOrDrugUseOrReferences: "NONE",
            contests: "NONE",
            gamblingSimulated: "NONE",
            gunsOrOtherWeapons: "NONE",
            horrorOrFearThemes: "NONE",
            matureOrSuggestiveThemes: "NONE",
            medicalOrTreatmentInformation: "NONE",
            profanityOrCrudeHumor: "NONE",
            sexualContentGraphicAndNudity: "NONE",
            sexualContentOrNudity: "NONE",
            violenceCartoonOrFantasy: "NONE",
            violenceRealistic: "NONE",
            violenceRealisticProlongedGraphicOrSadistic: "NONE",
            gambling: false,
            lootBox: false,
            unrestrictedWebAccess: false,
            userGeneratedContent: false,
            messagingAndChat: false,
            parentalControls: false,
            ageAssurance: false,
            healthOrWellnessTopics: false,
            advertising: true,
            kidsAgeBand: null,
            ageRatingOverride: "NONE",
            koreaAgeRatingOverride: "NONE",
        },
        release: {
            automaticRelease: false,
        },
    },
};
