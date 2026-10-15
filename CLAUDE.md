# Blockaroo - Claude Code Configuration

Kids' block puzzle game (8×8 board, three pieces per turn, line clears, streaks). Expo 54 / React Native 0.81, pnpm.
Conventions follow `frontend-platform/apps/cex-mobile`.

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
- Ads: `service/ads/ads.native.ts` (native) and `ads.web.ts` (no-op). All requests must stay child-directed, G-rated and
  non-personalized. Never show an ad during a game.
- `ios/` and `android/` are generated; configure native behavior in `app.config.ts`.
- Code style: 4 spaces, double quotes, semicolons, 120 columns, `Type[]` over `Array<Type>`.
- Commits: Conventional Commits, scopes `game`, `engine`, `ui`, `ads`, `brand`, `i18n`, `config`.
