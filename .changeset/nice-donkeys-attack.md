---
"react-native-a2ui": minor
---

Add `a2aTransport` — the A2A envelope transport, exported from the package root alongside `jsonlTransport`/`sseTransport`. It carries the A2UI protocol inside A2A (Agent-to-Agent) message envelopes, so a renderer can talk to an A2A agent without any of the protocol handling changing.

Inbound, it reads A2A messages and unwraps each `application/json+a2ui` DataPart — whose `data` is a batch of A2UI messages — into `engine.processMessages`. Parts that are not A2UI (text parts, other DataParts) are surfaced verbatim through an `onPart` option rather than dropped. Outbound (when an `endpoint` is provided), it wraps each client action/error back into an A2A message, injects the client's `a2uiClientCapabilities` (from `engine.getClientCapabilities()`) into the message metadata, and POSTs it with the `X-A2A-Extensions: https://a2ui.org/a2a-extension/a2ui/v0.9` activation header. The MIME type and extension URI are also exported as `A2UI_DATA_PART_MIME` and `A2UI_A2A_EXTENSION_URI`.

The envelope is transparent: every official example stream replayed through it builds trees identical to a direct replay.
