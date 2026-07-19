---
"react-native-a2ui": minor
---

Add the basic catalog's layout components — `Row`, `Column`, `Card`, `Divider`, and `List` — plus the `basicCatalog` registry to hand to `<A2UIProvider>`. `Row`/`Column` arrange children with the schema's `justify`/`align` options, `Card` frames a single child, and `Divider` draws a horizontal or vertical rule, all styled from theme tokens. `List` renders through `FlatList` and supports template lists (`children: { componentId, path }`): it expands one instance of the template per item in the bound data list, each scoped to its own data path so relative bindings resolve per-item, and it reacts to writes.

Bound values now read their current value immediately on mount instead of showing `undefined` until the next write (via a new `SurfaceHandle.getValue`), and relative data pointers resolve against the surrounding list-item scope.
