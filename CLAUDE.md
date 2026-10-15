# Blockaroo - Claude Code Configuration

All-ages block puzzle game, safe for kids (8×8 board, three pieces per turn, line clears, streaks; Classic and
Adventure). Expo 54 / React Native 0.81, pnpm. Conventions follow `frontend-platform/apps/cex-mobile`.

## Commands

```sh
pnpm start | ios | android | web
pnpm typecheck && pnpm lint && pnpm test   # run all three before calling work done
pnpm brand:build                           # regenerate icon/splash PNGs from src/assets/brand/*.svg
```

## Rules

- Game rules live in `src/engine` and stay pure TypeScript (no React, Expo or `@theme` imports). Every rule change needs
  a test in `src/engine/__tests__`.
- Screens are `src/builder/*-page`; `src/app` routes only render them.
- Single alias `@*` → `src/*`. Import from a folder's barrel (`@component`, `@container`, `@engine`, ...); use relative
  paths inside the same folder.
- NativeWind `className` works on React Native views, not on Reanimated `Animated.View`. Put classes on an inner `View`
  and keep only animated styles on the `Animated.View`.
- Two modes share one engine: `classic` (endless) and `adventure` (levels from `engine/levels.ts`, goals = gems or
  score). After changing level generation or the dealer, run `pnpm bench:levels` to check win rates.
- Ads: `service/ads/ads.native.ts` (AdMob) and `ads.web.ts` (test-ad stand-ins in dev, nothing in production). All
  requests stay child-directed, G-rated and non-personalized. Banners sit outside the board; full-screen ads only
  between games, never mid-game. Rewarded video is opt-in only.
- `ios/` and `android/` are generated; configure native behavior in `app.config.ts`.
- Code style: 4 spaces, double quotes, semicolons, 120 columns, `Type[]` over `Array<Type>`.
- Commits: Conventional Commits, scopes `game`, `engine`, `ui`, `ads`, `brand`, `i18n`, `config`.
