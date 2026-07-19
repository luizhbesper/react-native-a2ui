---
"react-native-a2ui": minor
---

Add streaming transports — `jsonlTransport` and `sseTransport` — and the `Transport` interface they implement, exported from the package root. A transport reads a server→client byte or text stream and feeds decoded A2UI message batches into any `ProtocolEngine`: `transport.start(engine)` returns a handle with a `done` promise (resolves when the stream ends or is closed) and `close()` (aborts cleanly — no further engine calls). Errors are reported through an `onError` option.

`jsonlTransport` parses newline-delimited JSON, buffering partial lines so an object split across chunk boundaries reassembles; a malformed line is reported and skipped and the stream continues. `sseTransport` parses Server-Sent-Events framing (`data:` lines assembled per event, blank-line separated, comments and non-`data` fields ignored). Both accept a wire value that is either a single A2UI message or a JSON array batch, and run on platform globals (`ReadableStream`/`TextDecoder`/`AbortController`) without importing `@a2ui/web_core` (ADR-0005).
