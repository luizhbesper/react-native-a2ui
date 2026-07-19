# Conformance fixtures — provenance

Vendored upstream A2UI content. **Do not hand-edit** — edit only when re-vendoring,
and update this README in the same commit (CLAUDE.md architecture constraints).

## Source

| | |
|---|---|
| Package | `@a2ui/web_core@0.10.4` (the pinned engine) |
| Vendored from | `node_modules/@a2ui/web_core/src/v0_9/schemas/` |
| Upstream repo | https://github.com/a2ui-project/a2ui (`renderers/web_core/src/v0_9/schemas/`) |
| Homepage | https://a2ui.org/ |
| Vendored on | 2026-07-15 |

We vendor from the **pinned package**, not a live upstream checkout, so the fixtures
can never drift from the schemas the engine actually implements. The npm pin
(`0.10.4`) is the provenance. The `0.10.4` tarball ships no `gitHead`; if an exact
commit is ever needed, run `npm view @a2ui/web_core@0.10.4 gitHead` while online.

These files mirror the upstream canonical locations:

- **JSON schemas** — `specification/v0_9/json/` → `v0_9/*.json`, `v0_9/catalogs/*/catalog.json`
- **Example streams** — catalog `examples/` folders → `v0_9/catalogs/*/examples/*.json`

## Contents (`v0_9/`)

- Message + capability schemas: `server_to_client.json`, `client_to_server.json`,
  `common_types.json`, `client_capabilities.json`, `server_capabilities.json`,
  the `*_list*.json` wrappers, `client_data_model.json`, `sample.json`.
- Catalogs: `catalogs/basic/` and `catalogs/minimal/` (each `catalog.json` + `examples/`).
- **63 JSON files total, 50 of them example streams** (43 basic + 7 minimal).
  These counts are asserted by `../fixtures.test.ts`.

## Re-vendoring

1. Bump `@a2ui/web_core` in `package.json` and `pnpm install`.
2. `cp -R ../../node_modules/@a2ui/web_core/src/v0_9/schemas/. conformance/fixtures/v0_9/`
   (run from the package dir; delete stale files first if the upstream set shrank).
3. Update this README (version, date, counts) and the count guard in
   `conformance/fixtures.test.ts` in the same commit.
