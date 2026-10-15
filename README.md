# Blockaroo

A block puzzle game for all ages (and safe for kids), starring Roo the kangaroo. You drag pieces onto an 8×8 board. Fill
a whole row or column and it clears. Clear lines back to back to build a streak.

- **Classic**: endless. The game ends when none of your three pieces fit. Chase your best score.
- **Adventure**: 60 levels. Most hide gems (diamonds, stars, hearts) inside the starting blocks; clear their lines to
  collect them. Every fifth level is a score challenge. Finish under par for 3 stars; each win unlocks the next level.

Built with the same stack as `frontend-platform/apps/cex-mobile`: Expo 54, React Native 0.81, expo-router, NativeWind,
Reanimated 4, Gesture Handler, Zustand, react-i18next, Jest, ESLint 9 and Prettier.

## Run it

```sh
pnpm install
pnpm start            # Expo Go works: ads are skipped there, everything else runs
pnpm ios              # dev build on the iOS simulator (needed to see test ads)
pnpm android          # dev build on an Android emulator or device
pnpm web              # quick check in the browser: labelled test ads stand in for real ones, no haptics
```

## Quality

```sh
pnpm typecheck
pnpm lint
pnpm test             # engine, stores, ads pacing, components
pnpm test:coverage
pnpm format
```

Husky runs lint-staged on commit, and commitlint enforces Conventional Commits (`feat(game): ...`).

## How it is organised

```
src/
├── app/          # expo-router routes (thin: they render a builder page)
├── builder/      # screens: home-page, play-page
├── component/    # UI kit: button, typography, block, piece, mascot, wordmark, icons
├── container/    # game pieces with behavior: board, tray + drag, HUD, praise, game-over card
├── engine/       # pure TypeScript game rules, no React (board, shapes, dealer, scoring, game)
├── store/        # Zustand stores persisted to AsyncStorage (game + settings)
├── service/      # ads (native / web), sound, haptics
├── hooks/        # board layout, count-up, rewarded readiness
├── config/       # ads policy and feel tuning
├── i18n/         # en, hy, ru
├── theme/        # brand palette (Tailwind reads the same values)
├── util/         # cn, score formatting, praise words, drop snapping
└── assets/       # brand SVGs (Roo, wordmark, icon) and sound effects
```

One alias, `@*` → `src/*`, as in cex-mobile. Components follow the `x.tsx` / `x.style.ts` (cva) / `x.type.ts` /
`__tests__` layout.

### The engine

`src/engine` has no React or Expo imports, so all the rules are unit tested and easy to tune:

- **Dealer** (`dealer.ts`): deals three pieces that can all be placed in some order, so a game never ends on an
  impossible set. Early on it favors small pieces and sometimes slips in a piece that clears a line. Difficulty ramps
  slowly up to `DIFFICULTY_MAX_SCORE`.
- **Scoring** (`scoring.ts`): 1 point per block placed. A clear scores 80 / 240 / 480 / 800 for 1 / 2 / 3 / 4 lines,
  multiplied by the streak. A streak survives up to 2 placements without a clear. Clearing the whole board adds +500.
- **Revive** (`game.ts`): one per game. It clears the 3 most crowded rows (never gem blocks) and deals friendly pieces.
- **Levels** (`levels.ts`): generated from the level number, so they are the same on every device with no data file.
  Board fill, gem count, gem kinds and piece size ramp up with the level. `pnpm bench:levels` lets a simple bot play
  every level and prints win rates, which is the quickest way to check a tuning change.
- **Seeded RNG**: a saved game resumes with the same upcoming pieces.

Tuning lives in `src/engine/constants.ts` (rules) and `src/config/game.config.ts` (feel: drag lift, snap tolerance, tray
size).

### Easy-to-play touches

- A dragged piece floats 1.4 cells above the finger, so a small hand never hides where it will land.
- Drops that are slightly off snap to the nearest valid spot.
- Pieces that can't fit anywhere are dimmed in the tray.
- Big touch targets, clear type (Rubik), and praise words alongside the score.
- Sound follows the iPhone silent switch. Sound and vibration toggles are on the home screen.
- Idle animation turns off when the device asks for reduced motion.

## Ads (AdMob)

`src/service/ads/ads.native.ts` uses `react-native-google-mobile-ads`. Every request is tagged
`tagForChildDirectedTreatment`, `tagForUnderAgeOfConsent`, G-rated and non-personalized. The Android `AD_ID` permission
is removed, and iOS never shows the tracking prompt.

- **Rewarded video**: only when the player taps "Watch a video to keep going" on the game-over card.
- **Interstitial**: between games only, never in the first 2 games, then at most every 3rd game and at least 4 minutes
  apart (`src/config/ads.config.ts`).
- Development and preview builds always use Google's test ad units. Production reads real IDs from EAS environment
  variables (see `.env.example`):

```sh
eas env:create --environment production --name ADMOB_ANDROID_APP_ID --value ca-app-pub-...~...
eas env:create --environment production --name EXPO_PUBLIC_ADMOB_REWARDED_ANDROID --value ca-app-pub-.../...
# ...and the iOS, interstitial and banner (EXPO_PUBLIC_ADMOB_BANNER_*) equivalents
```

In the AdMob console, also mark the app as child-directed and set the max ad content rating to G.

## Ship it

```sh
npx eas-cli@latest login
npx eas-cli@latest init            # links the project and writes the EAS project ID
pnpm build:dev                     # development client for devices
pnpm build:prod                    # store builds (Android .aab + iOS .ipa)
npx eas-cli@latest submit -p android --profile production
npx eas-cli@latest submit -p ios --profile production
```

Bundle IDs are `com.blockaroo.game` (plus `.dev` and `.preview` variants, so all three install side by side). Change
them in `app.config.ts` before the first store upload.

### Store checklist for a kids' game

- **Google Play**: set the target audience to children in "Target audience and content". That puts the app under the
  Families policy, which needs Families-certified ad SDKs (AdMob qualifies when configured as above), a privacy policy
  and a matching Data safety form.
- **App Store**: Apple's Kids Category restricts third-party advertising and analytics. Either list the game in Games ›
  Puzzle with a 4+ rating, or remove ads from the iOS build if you want the Kids Category. Check the current App Review
  Guidelines (1.3 and 5.1.4) before submitting.
- **Both**: a privacy policy URL, COPPA (US) and GDPR-K (EU) compliance, and a trademark search for the name "Blockaroo"
  in your target markets before you buy the domain or store listings.

## Brand

- Night-sky look with jewel blocks, so it reads as a casual game for everyone rather than a toddler app. The wordmark
  uses block-shaped O's.
- Assets in `src/assets/brand` (Roo happy / oops, wordmark, icon) are original vector art. After editing an SVG, run
  `pnpm brand:build` to regenerate the app icon, adaptive icon, splash and favicon PNGs.
- The palette is in `src/theme/palette.ts`, mirrored in `tailwind.config.js`.
- Sound effects in `src/assets/sounds` are original synthesized tones.
