---
"react-native-a2ui": minor
---

Export `createA2uiEngine()` from the package root — the public way to construct the A2UI `ProtocolEngine` to pass to `<A2UIProvider engine>`. It returns the neutral `ProtocolEngine` interface, keeping the web_core-backed implementation internal (ADR-0005): consumers wire up the renderer without importing `@a2ui/web_core` directly.
