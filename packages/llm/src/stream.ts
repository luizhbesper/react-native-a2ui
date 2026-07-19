import type { ProtocolEngine } from 'react-native-a2ui/engine-types';
import type { LLMClient } from './clients/types';
import { extract } from './extract';
import { type FewShotExample, generateSystemPrompt, type PromptComponent } from './promptgen';

/** Inputs for {@link streamA2UI}. */
export interface StreamA2UIOptions {
  /** The provider client to stream from (anthropic/gemini/openai, or any {@link LLMClient}). */
  client: LLMClient;
  /** The user's request (e.g. "book me a table"). */
  prompt: string;
  /** The engine that renders the streamed A2UI messages. */
  engine: ProtocolEngine;
  /** Catalog to build the system prompt from via `generateSystemPrompt`; ignored if `system` is set. */
  catalog?: PromptComponent[];
  /** Few-shot examples for `generateSystemPrompt` when `catalog` is used. */
  examples?: FewShotExample[];
  /** An explicit system prompt; overrides `catalog`. */
  system?: string;
}

/**
 * One-call helper: prompt a model, extract the A2UI messages from its token stream, and feed
 * them to the engine as they arrive. Resolves when the stream ends.
 */
export async function streamA2UI(options: StreamA2UIOptions): Promise<void> {
  const { client, prompt, engine, catalog, examples, system } = options;
  const systemPrompt = system ?? (catalog ? generateSystemPrompt(catalog, examples) : undefined);

  for await (const value of extract(client({ system: systemPrompt, prompt }))) {
    // A JSON array is a batch of messages; a bare object is a one-message batch.
    engine.processMessages(Array.isArray(value) ? value : [value]);
  }
}
