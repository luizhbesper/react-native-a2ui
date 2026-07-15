# ADR-0002 — Default catalog: plain StyleSheet + design tokens

- Status: **Accepted** · Date: 2026-07-15

## Context

The default catalog must run unchanged in Expo Go, bare react-native-cli, and react-native-web, and be themeable. Candidates: plain StyleSheet + tokens, `@expo/ui` (stable SDK 56, now in Expo Go, but true SwiftUI/Compose — per-platform look, needs expo-modules in bare apps, web experimental), NativeWind (v4→v5/Tailwind-4 churn, Babel/Metro config imposed on consumers), Unistyles 3 (breaks Expo Go), Tamagui/Paper (heavy, opinionated). Google's own pattern is design tokens + renderer-owned look (CSS variables on web, Material on Flutter/Compose).

## Decision

Default catalog styled with plain `StyleSheet` driven by a token object (`colors` incl. `primary`, `spacing`, `radii`, `typography`) with automatic dark mode. Token names mirror the official CSS variables (`--a2ui-color-primary` → `colors.primary`); `createSurface.theme.primaryColor` is honored. Design systems integrate via BYOC and adapter catalogs: `@expo/ui` first (M4), NativeWind/reusables later.

## Consequences

- (+) Zero styling dependencies — the only option with no compatibility asterisk anywhere; mirrors Google's theming docs 1:1.
- (+) No build-config burden on consumers.
- (−) Default look is functional, not fashionable — adapters and BYOC are the answer, and the demo app must still look good (invest in the token defaults).
