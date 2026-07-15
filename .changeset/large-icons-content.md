---
"react-native-a2ui": minor
---

Add the basic catalog's content components — `Text`, `Image`, and `Icon` — to `basicCatalog`. `Text` renders a string with markdown-lite inline formatting (`**bold**` and `*italic*`) and picks a base style from the `variant` hint (`h1`–`h5`, `caption`, `body`); `Image` shows a remote `url` with the schema's `fit` mode and `variant` size and uses `description` as its accessibility label; `Icon` renders a named icon as an accessible placeholder (real glyph rendering will come from a dedicated icon adapter).

All three resolve bound `{ path }` values reactively and tolerate missing or `null` values without throwing. `useValue` now also accepts a `null` pointer, so unbound (literal) values don't subscribe to the data model.
