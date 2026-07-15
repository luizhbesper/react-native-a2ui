# react-native-a2ui

**React Native renderer for [Google's A2UI protocol](https://a2ui.org) — your AI agent composes real native mobile UI, streaming, on the open A2UI standard.**

[![CI](https://github.com/luizhbesper/react-native-a2ui/actions/workflows/ci.yml/badge.svg)](https://github.com/luizhbesper/react-native-a2ui/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/react-native-a2ui)](https://www.npmjs.com/package/react-native-a2ui)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![A2UI](https://img.shields.io/badge/A2UI-v0.9.1-4285F4)](https://a2ui.org)

> 🚧 **Under active development.** Follow the [roadmap](./docs/ROADMAP.md) and [live status](./docs/STATUS.md). First npm release lands at M3.

<!-- GIF placeholder: launch demo — a real agent streaming native UI on device (recorded in M2-T5) -->

## What is this?

[A2UI](https://github.com/google/A2UI) is Google's open protocol for **generative UI**: agents send declarative component trees instead of text, and a renderer turns them into real UI — with streaming, data binding, and two-way interaction. Official renderers exist for React, Angular, Lit, and Flutter.

**`react-native-a2ui` is the missing React Native renderer**, built on `@a2ui/web_core` — the same official engine that powers Google's web renderers. Protocol conformance comes by construction, verified by a conformance suite that replays the official spec examples.

- 📱 **Native mobile UI** — agents build screens from an 18-component catalog (forms, lists, tabs, modals…), rendered as real React Native views
- ⚡ **Streaming-first** — progressive rendering as messages arrive, batch-aware updates, no flicker
- 🔌 **Works everywhere** — Expo (including Expo Go), bare React Native CLI, zero native dependencies
- 🎨 **Design tokens** — themeable defaults mirroring the official renderers; bring your own design system via custom catalogs (BYOC)
- 🤖 **Any agent backend** — JSONL/SSE streams, A2A protocol envelope, or direct LLM calls (Claude, Gemini, OpenAI-compatible)
- 🧩 **Modular by design** — protocol engine behind a small interface; the renderer never touches wire formats

## Quick start (coming at M3)

```bash
npx expo install react-native-a2ui        # Expo
npm install react-native-a2ui             # bare React Native
```

```tsx
import { A2UIProvider, Surface } from 'react-native-a2ui';

export function AgentScreen() {
  return (
    <A2UIProvider transport={{ type: 'jsonl', url: 'https://your-agent.dev/stream' }}>
      <Surface surfaceId="main" />
    </A2UIProvider>
  );
}
```

## Documentation

Docs site (M3): quickstart, theming, custom catalogs, transports, LLM helper, API reference — with `llms.txt` for AI agents. Until then:

- [SPEC](./docs/SPEC.md) — architecture and scope
- [ARCHITECTURE](./docs/ARCHITECTURE.md) — module map and dependency rules
- [ROADMAP](./docs/ROADMAP.md) — M0 → M4 and beyond
- [ADRs](./docs/adr/) — why things are the way they are

## Ecosystem

| Renderer | Platform | Status |
|---|---|---|
| `@a2ui/react`, `@a2ui/lit`, `@a2ui/angular` | Web | Official (Google) |
| Flutter GenUI SDK | Mobile/desktop | Official (Google) |
| **react-native-a2ui** | **iOS + Android via React Native** | **This project** |

## Contributing

This is an AI-first repository: implementation happens in Claude Code sessions driven by [milestone specs](./docs/specs/). Humans and agents welcome — see [CONTRIBUTING](./CONTRIBUTING.md).

## License

[MIT](./LICENSE) © Luiz Esper

---

*Keywords: react native a2ui, a2ui renderer, generative ui react native, agent ui, google a2ui, a2a protocol, gemini ui, llm ui components, server driven ui, expo generative ui*
