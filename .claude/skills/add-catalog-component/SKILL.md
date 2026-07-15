---
name: add-catalog-component
description: Add or extend a basic-catalog component (Text, Button, TextField, ...) following the schema-first TDD procedure. Use when implementing M1 catalog tasks or adding any new catalog component.
---

# add-catalog-component

Procedure for one catalog component. Never hand-guess props — the vendored schema is the source of truth.

## Steps

1. **Schema first.** Find the component in the vendored catalog schema (`packages/react-native-a2ui/conformance/fixtures/v0_9/`). Derive the TS prop types from it; add a comment with the schema path above the type.
2. **Failing tests first** (`src/catalog/<Component>.test.tsx`, Jest + RNTL):
   - renders from schema-shaped props (happy path);
   - bound (`Dynamic*`) props update when the data model changes;
   - if input: user interaction writes back to the bound path (`fireEvent`);
   - if actionable: dispatches action with correct `sourceComponentId` and context;
   - edge cases: missing optional props, `null` bound value.
3. **Implement** in `src/catalog/<Component>.tsx`: plain `StyleSheet`, all visual values from theme tokens (`useTheme()`), no new dependencies (ADR-0002). Tolerate null/missing data without throwing.
4. **Register** in the basic catalog registry + export from the package root.
5. **Verify:** `pnpm --filter react-native-a2ui test` and `pnpm lint` green. Add the component to the example app gallery fixture if one exists.
6. **Close out:** changeset (`feat(catalog): add <Component>`), update `docs/STATUS.md`.
