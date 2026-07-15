---
"react-native-a2ui": minor
---

Add the renderer and its public API. `<A2UIProvider engine registry>` supplies a `ProtocolEngine` and a component registry to the tree, and `<Surface surfaceId>` renders one live surface: it shows nothing until the surface and its root node have streamed in, then paints progressively. Each node is looked up in the registry (an unknown `type` renders nothing and calls `onUnknownComponent`) and wrapped in an error boundary, so a component that throws is contained without taking down the surface. Bound values use the `useValue(pointer)` hook, which re-renders only the node whose data changed.

This release also exports the theme layer (`A2UIThemeProvider`, `useTheme`, `resolveTheme`, `Theme`, `LIGHT_THEME`, `DARK_THEME`), the registry contract (`ComponentRegistry`, `CatalogComponent`, `CatalogComponentProps`), and the protocol-neutral engine types (`ProtocolEngine`, `SurfaceHandle`, `ComponentNode`, `ClientMessage`). Catalog components are placeholders for now; the styled basic catalog lands next.
