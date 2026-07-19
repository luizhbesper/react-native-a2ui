---
"react-native-a2ui": minor
---

Add the basic catalog's remaining input components — `Slider`, `ChoicePicker`, and `DateTimeInput` — to `basicCatalog`. All three are JS-only fallbacks built from React Native primitives (Expo Go safe, no native modules or extra UI dependencies).

`Slider` renders a themed track and thumb with `−`/`+` step buttons and an adjustable accessibility role; its value is two-way bound (`DynamicNumber`) and clamped to `[min, max]`, stepping by a tenth of the range. `ChoicePicker` renders its `options` as selectable rows (`checkbox` display) or chips (`chips` display), reflecting and writing back the selected values (`DynamicStringList`): `mutuallyExclusive` selects a single option, `multipleSelection` toggles membership. `DateTimeInput` is a two-way bound text field for the ISO 8601 `value` with a format-hint placeholder derived from `enableDate`/`enableTime`. All three tolerate missing optional props and `null` bound values without throwing.
