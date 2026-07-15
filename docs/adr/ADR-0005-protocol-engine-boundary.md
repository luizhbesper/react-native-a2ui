# ADR-0005 — `ProtocolEngine` boundary for multi-protocol modularity

- Status: **Accepted** · Date: 2026-07-15

## Context

Explicit requirement: adding a future protocol besides A2UI (or surviving an A2UI v1.0 wire break, or swapping web_core for a fork) must be simple. The naive answer — separate packages per protocol from day one — adds structure with no second consumer (YAGNI).

## Decision

The renderer, catalog, and transports depend exclusively on a small `ProtocolEngine` interface (`src/engine/types.ts`: surfaces, tree access, fine-grained value subscription, two-way writes, action dispatch). `A2uiEngine` (`src/engine/a2ui/`, backed by web_core) is implementation #1 and the ONLY module allowed to import web_core. Interface shape is finalized in M0 against real APIs; adapter budget ~300 lines — growth beyond that signals reimplementation, not adaptation. Package extraction happens when the second implementation exists, not before.

## Consequences

- (+) New protocol = new folder under `src/engine/`; renderer/catalog untouched. v1.0 break = adapter change only.
- (+) Renderer stays unit-testable with a fake engine.
- (−) One indirection layer; kept honest by the 300-line budget and dependency rules in ARCHITECTURE.md.
