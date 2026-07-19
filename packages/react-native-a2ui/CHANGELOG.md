# react-native-a2ui

## 0.1.0

### Minor Changes

- 48eff9c: Add streaming transports — `jsonlTransport` and `sseTransport` — and the `Transport` interface they implement, exported from the package root. A transport reads a server→client byte or text stream and feeds decoded A2UI message batches into any `ProtocolEngine`: `transport.start(engine)` returns a handle with a `done` promise (resolves when the stream ends or is closed) and `close()` (aborts cleanly — no further engine calls). Errors are reported through an `onError` option.

  `jsonlTransport` parses newline-delimited JSON, buffering partial lines so an object split across chunk boundaries reassembles; a malformed line is reported and skipped and the stream continues. `sseTransport` parses Server-Sent-Events framing (`data:` lines assembled per event, blank-line separated, comments and non-`data` fields ignored). Both accept a wire value that is either a single A2UI message or a JSON array batch, and run on platform globals (`ReadableStream`/`TextDecoder`/`AbortController`) without importing `@a2ui/web_core` (ADR-0005).

- cd3c46e: Add the basic catalog's content components — `Text`, `Image`, and `Icon` — to `basicCatalog`. `Text` renders a string with markdown-lite inline formatting (`**bold**` and `*italic*`) and picks a base style from the `variant` hint (`h1`–`h5`, `caption`, `body`); `Image` shows a remote `url` with the schema's `fit` mode and `variant` size and uses `description` as its accessibility label; `Icon` renders a named icon as an accessible placeholder (real glyph rendering will come from a dedicated icon adapter).

  All three resolve bound `{ path }` values reactively and tolerate missing or `null` values without throwing. `useValue` now also accepts a `null` pointer, so unbound (literal) values don't subscribe to the data model.

- bfebdb1: Add `a2aTransport` — the A2A envelope transport, exported from the package root alongside `jsonlTransport`/`sseTransport`. It carries the A2UI protocol inside A2A (Agent-to-Agent) message envelopes, so a renderer can talk to an A2A agent without any of the protocol handling changing.

  Inbound, it reads A2A messages and unwraps each `application/json+a2ui` DataPart — whose `data` is a batch of A2UI messages — into `engine.processMessages`. Parts that are not A2UI (text parts, other DataParts) are surfaced verbatim through an `onPart` option rather than dropped. Outbound (when an `endpoint` is provided), it wraps each client action/error back into an A2A message, injects the client's `a2uiClientCapabilities` (from `engine.getClientCapabilities()`) into the message metadata, and POSTs it with the `X-A2A-Extensions: https://a2ui.org/a2a-extension/a2ui/v0.9` activation header. The MIME type and extension URI are also exported as `A2UI_DATA_PART_MIME` and `A2UI_A2A_EXTENSION_URI`.

  The envelope is transparent: every official example stream replayed through it builds trees identical to a direct replay.

- 4300fbd: Export `createA2uiEngine()` from the package root — the public way to construct the A2UI `ProtocolEngine` to pass to `<A2UIProvider engine>`. It returns the neutral `ProtocolEngine` interface, keeping the web_core-backed implementation internal (ADR-0005): consumers wire up the renderer without importing `@a2ui/web_core` directly.
- 5bb8150: Add the basic catalog's container and media components — `Tabs`, `Modal`, `Video`, and `AudioPlayer` — to `basicCatalog`, completing the basic catalog. All are built from React Native primitives only (Expo Go safe, no native modules or extra UI dependencies).

  `Tabs` renders a JS tab bar of pressable headers (bound `DynamicString` titles) and mounts only the active tab's child subtree, switching on header press. `Modal` renders its `trigger` component and, on press, opens an overlay showing the `content` component; a backdrop press closes it. Note: while a component serves as a modal trigger it opens the modal on tap and its own action does not fire.

  `Video` and `AudioPlayer` are placeholder stubs: a themed card showing the media kind and its source (the `url`, or the `AudioPlayer` `description` when present) with an accessibility label, reacting to bound `url`/`description` changes. They are not real players — a native media player will ship as a separate catalog adapter package.

- 503a5e1: Add the renderer and its public API. `<A2UIProvider engine registry>` supplies a `ProtocolEngine` and a component registry to the tree, and `<Surface surfaceId>` renders one live surface: it shows nothing until the surface and its root node have streamed in, then paints progressively. Each node is looked up in the registry (an unknown `type` renders nothing and calls `onUnknownComponent`) and wrapped in an error boundary, so a component that throws is contained without taking down the surface. Bound values use the `useValue(pointer)` hook, which re-renders only the node whose data changed.

  This release also exports the theme layer (`A2UIThemeProvider`, `useTheme`, `resolveTheme`, `Theme`, `LIGHT_THEME`, `DARK_THEME`), the registry contract (`ComponentRegistry`, `CatalogComponent`, `CatalogComponentProps`), and the protocol-neutral engine types (`ProtocolEngine`, `SurfaceHandle`, `ComponentNode`, `ClientMessage`). Catalog components are placeholders for now; the styled basic catalog lands next.

- a335272: Add streaming extraction, provider clients, and a one-call `streamA2UI` helper to `@react-native-a2ui/llm` — everything needed to drive live A2UI UI from a real model.

  - `extract(chunks)` tolerantly pulls A2UI JSON messages out of a model's token stream: it handles fenced ` ```json ` blocks, objects split across streamed chunks, and surrounding prose, and skips any garbage between messages. Each candidate is parsed with `JSON.parse` — nothing from the wire is ever evaluated.
  - `anthropicClient`, `openaiClient`, and `geminiClient` are thin clients built on raw `fetch` (no provider SDKs), so they work in React Native and Expo Go with minimal dependencies. Each takes an API key (from your env or a dev-only screen — never commit it) and streams the model's text tokens. The Anthropic client follows the current Messages API streaming shape and defaults to the latest Claude model.
  - `streamA2UI({ client, prompt, engine, catalog?, system? })` wires a client through extraction into any `ProtocolEngine`, feeding messages to the surface as they arrive. Pass a `catalog` to have it build the system prompt for you via `generateSystemPrompt`.

  `react-native-a2ui` now also exposes its protocol-neutral engine types at the `react-native-a2ui/engine-types` subpath, so tooling and integrations can depend on the `ProtocolEngine` interface without pulling in the renderer.

- 5f8cc99: Add the basic catalog's remaining input components — `Slider`, `ChoicePicker`, and `DateTimeInput` — to `basicCatalog`. All three are JS-only fallbacks built from React Native primitives (Expo Go safe, no native modules or extra UI dependencies).

  `Slider` renders a themed track and thumb with `−`/`+` step buttons and an adjustable accessibility role; its value is two-way bound (`DynamicNumber`) and clamped to `[min, max]`, stepping by a tenth of the range. `ChoicePicker` renders its `options` as selectable rows (`checkbox` display) or chips (`chips` display), reflecting and writing back the selected values (`DynamicStringList`): `mutuallyExclusive` selects a single option, `multipleSelection` toggles membership. `DateTimeInput` is a two-way bound text field for the ISO 8601 `value` with a format-hint placeholder derived from `enableDate`/`enableTime`. All three tolerate missing optional props and `null` bound values without throwing.

- 9726ee2: Add the basic catalog's layout components — `Row`, `Column`, `Card`, `Divider`, and `List` — plus the `basicCatalog` registry to hand to `<A2UIProvider>`. `Row`/`Column` arrange children with the schema's `justify`/`align` options, `Card` frames a single child, and `Divider` draws a horizontal or vertical rule, all styled from theme tokens. `List` renders through `FlatList` and supports template lists (`children: { componentId, path }`): it expands one instance of the template per item in the bound data list, each scoped to its own data path so relative bindings resolve per-item, and it reacts to writes.

  Bound values now read their current value immediately on mount instead of showing `undefined` until the next write (via a new `SurfaceHandle.getValue`), and relative data pointers resolve against the surrounding list-item scope.

- 9a54bd1: Add the basic catalog's first input components — `Button`, `TextField`, and `CheckBox` — to `basicCatalog`. `Button` renders its child component, styles itself by `variant` (`primary`, `default`, `borderless`) with pressed-state colors from the theme, and on press dispatches its server `{ event }` action with the button's own id as the source and the action context forwarded as-is (bound `{ path }` context is resolved at fire time); a client-side `{ functionCall }` action is not dispatched yet.

  `TextField` and `CheckBox` are two-way bound: when their `value` is a `{ path }` binding, typing (`TextField`) or toggling (`CheckBox`) writes back to that path and the field updates reactively. `TextField` maps its `variant` to the matching keyboard/secure/multiline input behavior and renders `label` as a visible caption and accessibility label; `CheckBox` is an accessible checkbox built from primitives (no extra UI dependency). All three tolerate missing or `null` bound values without throwing.

### Patch Changes

- 9436dfb: Fix `Modal` so an interactive trigger keeps its own action. Tapping an interactive trigger (e.g. a `Button` whose `action` is `openModalEvent`) now both dispatches the trigger's own declared action and opens the modal, on a single tap — previously the trigger opened the modal but its action never fired. A non-interactive trigger (such as a `Text`) still opens the modal on tap as before.

  This is powered by a new generic renderer capability: a container can contribute an extra press to interactive descendants used as its trigger, so they compose the container's gesture with their own without the container swallowing the touch.
