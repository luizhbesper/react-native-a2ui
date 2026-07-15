---
"react-native-a2ui": minor
---

Add the basic catalog's container and media components — `Tabs`, `Modal`, `Video`, and `AudioPlayer` — to `basicCatalog`, completing the basic catalog. All are built from React Native primitives only (Expo Go safe, no native modules or extra UI dependencies).

`Tabs` renders a JS tab bar of pressable headers (bound `DynamicString` titles) and mounts only the active tab's child subtree, switching on header press. `Modal` renders its `trigger` component and, on press, opens an overlay showing the `content` component; a backdrop press closes it. Note: while a component serves as a modal trigger it opens the modal on tap and its own action does not fire.

`Video` and `AudioPlayer` are placeholder stubs: a themed card showing the media kind and its source (the `url`, or the `AudioPlayer` `description` when present) with an accessibility label, reacting to bound `url`/`description` changes. They are not real players — a native media player will ship as a separate catalog adapter package.
