# ADR-0003 — Package naming: `react-native-a2ui` + `@react-native-a2ui/*`

- Status: **Accepted** · Date: 2026-07-15

## Context

The RN community searches `react-native-<thing>`; unscoped names rank better in npm/GitHub search. Verified 2026-07-15: both `react-native-a2ui` AND `a2ui-react-native` are unpublished (the abandoned community renderer never released). `@a2ui/*` is Google's scope.

## Decision

Main installable package: **`react-native-a2ui`** (unscoped). Satellites under **`@react-native-a2ui/*`** (`llm`, `expo-ui`, …). GitHub repo: `luizhbesper/react-native-a2ui`. Publish an initial version early (M3 at the latest) to hold the name.

## Consequences

- (+) Exact-match for "a2ui react native" searches; conventional RN naming.
- (−) Unscoped name is squattable until first publish — publish early.
