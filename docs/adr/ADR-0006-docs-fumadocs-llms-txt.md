# ADR-0006 — Docs: Fumadocs on Vercel with llms.txt

- Status: **Accepted** · Date: 2026-07-15

## Context

Docs must have excellent SEO, be free to host, and be AI-readable (our consumers are agent developers; the repo itself is AI-first). Candidates: Fumadocs (Next.js, built-in llms.txt/llms-full.txt/per-page markdown, auto sitemap/OG), Starlight (lighter, plugin for llms.txt), Docusaurus (mature, heavier), Mintlify (hosted, paid tiers).

## Decision

Fumadocs (`website/`), deployed to Vercel, with `llms.txt` and `llms-full.txt` enabled. Site goes live at M3; scaffold exists from bootstrap so docs pages can accrete during M1-M2.

## Consequences

- (+) Own-the-code docs in the same React/TS stack as the project; SSG SEO; AI-readability out of the box.
- (−) A Next.js app in the workspace (heaviest dev dependency in the repo) — isolated in `website/`, excluded from library CI paths.
