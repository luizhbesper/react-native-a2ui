# ADR-0001 — Reuse `@a2ui/web_core` as the protocol engine

- Status: **Accepted** (spike gate in M0-T1) · Date: 2026-07-15

## Context

The A2UI protocol requires message processing, Zod validation, a reactive data model with JSON Pointer semantics, dynamic-value resolution, and catalog/function registries (~3k lines). Google publishes `@a2ui/web_core` (npm, 0.10.4) — the framework-agnostic core its official React/Lit/Angular renderers are thin layers over. Verified 2026-07-15: its dependencies are pure JS (`@preact/signals-core`, `zod`, `zod-to-json-schema`, `date-fns`) — no DOM.

## Decision

Depend on `@a2ui/web_core` behind our own thin `ProtocolEngine` interface (ADR-0005). Only `src/engine/a2ui/` imports it. M0 opens with a Hermes/Metro spike; if runtime incompatibility appears, fallback is a vendored fork behind the same interface.

## Consequences

- (+) ~3k lines and ~2 weeks saved; protocol conformance and spec updates by construction; strongest listing argument ("the RN layer over the core Google maintains").
- (+) Signals give fine-grained reactivity for free.
- (−) Version coupling: npm 0.10.x drifts from spec 0.9.x — pin minor, watch release notes.
- (−) Upstream bugs are our bugs; mitigated by the interface (swap/fork without touching the renderer).
