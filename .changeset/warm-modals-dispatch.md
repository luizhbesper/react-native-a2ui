---
"react-native-a2ui": patch
---

Fix `Modal` so an interactive trigger keeps its own action. Tapping an interactive trigger (e.g. a `Button` whose `action` is `openModalEvent`) now both dispatches the trigger's own declared action and opens the modal, on a single tap — previously the trigger opened the modal but its action never fired. A non-interactive trigger (such as a `Text`) still opens the modal on tap as before.

This is powered by a new generic renderer capability: a container can contribute an extra press to interactive descendants used as its trigger, so they compose the container's gesture with their own without the container swallowing the touch.
