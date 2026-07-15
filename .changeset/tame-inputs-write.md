---
"react-native-a2ui": minor
---

Add the basic catalog's first input components — `Button`, `TextField`, and `CheckBox` — to `basicCatalog`. `Button` renders its child component, styles itself by `variant` (`primary`, `default`, `borderless`) with pressed-state colors from the theme, and on press dispatches its server `{ event }` action with the button's own id as the source and the action context forwarded as-is (bound `{ path }` context is resolved at fire time); a client-side `{ functionCall }` action is not dispatched yet.

`TextField` and `CheckBox` are two-way bound: when their `value` is a `{ path }` binding, typing (`TextField`) or toggling (`CheckBox`) writes back to that path and the field updates reactively. `TextField` maps its `variant` to the matching keyboard/secure/multiline input behavior and renders `label` as a visible caption and accessibility label; `CheckBox` is an accessible checkbox built from primitives (no extra UI dependency). All three tolerate missing or `null` bound values without throwing.
