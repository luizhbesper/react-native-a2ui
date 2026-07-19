/**
 * A2UI system-prompt generation.
 *
 * Turns a registered component catalog into a system prompt an LLM can answer with, so a
 * model emits valid A2UI server-to-client messages instead of prose. Each component's
 * properties are rendered as JSON Schema behind a `component` discriminant, followed by
 * few-shot examples of real A2UI output.
 *
 * ## Parity with web_core's schema generation (documented deltas)
 *
 * The reference A2UI stack exposes catalog schemas through `A2uiSchemaManager`; the pinned
 * `@a2ui/web_core@0.10.4` ships the equivalent as `MessageProcessor.generateInlineCatalog`
 * (`src/v0_9/processing/message-processor.js`). This package intentionally does NOT depend on
 * web_core (ADR-0005 keeps web_core inside the renderer's engine adapter). We reproduce that
 * schema-generation approach and note where prompt text diverges from the machine-readable
 * capabilities object web_core builds:
 *
 * - SAME: a Zod component schema is converted with `zodToJsonSchema(schema,
 *   { target: 'jsonSchema2019-09' })` — the exact call and target web_core uses.
 * - SAME: each component is wrapped with a `component: { const: <name> }` discriminant and
 *   `component` is added to `required`, matching web_core's envelope for the `component` field.
 * - DELTA: web_core wraps every component in `allOf: [{ $ref: 'common_types.json#/$defs/
 *   ComponentCommon' }, …]`. A prompt can't dereference that `$ref`, so we drop the `allOf`
 *   wrapper and emit a self-contained `{ type: 'object', properties, required }` plus a prose
 *   description instead. Common properties (`id`, `weight`, `accessibility`) are described in
 *   the prompt preamble rather than referenced.
 * - DELTA: web_core's output is a nested capabilities object for the A2A handshake; ours is
 *   readable prompt text (headings, fenced JSON, few-shot examples) meant for a model to read.
 * - Not reproduced: web_core's `REF:`-tag processing (`processRefs`) and function/theme schema
 *   sections — no catalog in scope needs them yet.
 */

import type { ZodTypeAny } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

type JsonSchemaObject = Record<string, unknown>;

/** A component the LLM may emit: its type name, a usage description, and its property schema. */
export interface PromptComponent {
  /** Component type as it appears in A2UI JSON (e.g. 'Button'). */
  name: string;
  /** One line on when/how to use it. */
  description?: string;
  /** Zod schema or JSON Schema of the component's properties (never includes `id`/`component`). */
  schema: ZodTypeAny | JsonSchemaObject;
}

/** A few-shot example: a user request paired with the A2UI messages an agent should emit. */
export interface FewShotExample {
  request: string;
  messages: unknown[];
}

function isZodSchema(schema: ZodTypeAny | JsonSchemaObject): schema is ZodTypeAny {
  return typeof (schema as { safeParse?: unknown }).safeParse === 'function';
}

/** Render one component as a JSON Schema object behind its `component` discriminant. */
function componentSchema(c: PromptComponent): JsonSchemaObject {
  const js: JsonSchemaObject = isZodSchema(c.schema)
    ? (zodToJsonSchema(c.schema, { target: 'jsonSchema2019-09' }) as JsonSchemaObject)
    : c.schema;
  const props = (js.properties ?? {}) as JsonSchemaObject;
  const required = (js.required ?? []) as string[];
  return {
    type: 'object',
    properties: { component: { const: c.name }, ...props },
    required: ['component', ...required],
  };
}

const PREAMBLE = `You are an agent that renders user interfaces using the A2UI protocol (version "v0.9").
Reply with a stream of A2UI server-to-client messages as JSON — never prose. Each message has "version": "v0.9" and exactly one operation:
- "createSurface": open a surface with a "surfaceId" and the "catalogId" of the catalog below.
- "updateComponents": add or replace components. Every component has a unique "id", a "component" type from the catalog, and that type's properties. The component with id "root" is the tree root; containers reference their children by id. ("id" and "component" are always required and are omitted from the property schemas below.)
- "updateDataModel": set values in the surface data model. Bind any property to the data model with {"path": "/pointer"} instead of a literal; user edits and action contexts read and write through those paths.
Emit only the component types defined below, with only their listed properties. Never invent component types or properties.`;

/** Two-space-indented JSON, the readable form used throughout the prompt. */
const json = (value: unknown): string => JSON.stringify(value, null, 2);

/** The default few-shot examples, modeled on the vendored basic-catalog example streams. */
export const DEFAULT_EXAMPLES: FewShotExample[] = [
  {
    request: 'Show a welcome heading that says Hello.',
    messages: [
      { version: 'v0.9', createSurface: { surfaceId: 'demo', catalogId: 'basic' } },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'demo',
          components: [{ id: 'root', component: 'Text', text: 'Hello', variant: 'h1' }],
        },
      },
    ],
  },
  {
    request: "Ask for the user's name with a submit button.",
    messages: [
      {
        version: 'v0.9',
        createSurface: { surfaceId: 'form', catalogId: 'basic', sendDataModel: true },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'form',
          components: [
            { id: 'root', component: 'Column', children: ['name_field', 'submit'] },
            { id: 'name_field', component: 'TextField', label: 'Name', value: { path: '/name' } },
            {
              id: 'submit',
              component: 'Button',
              child: 'submit_label',
              action: { event: { name: 'submitted', context: { name: { path: '/name' } } } },
            },
            { id: 'submit_label', component: 'Text', text: 'Submit' },
          ],
        },
      },
    ],
  },
];

/**
 * Build a system prompt from a registered catalog: the protocol preamble, one JSON Schema
 * block per component, and few-shot examples of A2UI output.
 */
export function generateSystemPrompt(
  components: PromptComponent[],
  examples: FewShotExample[] = DEFAULT_EXAMPLES,
): string {
  const componentBlocks = components
    .map((c) => {
      const heading = `### ${c.name}`;
      const desc = c.description ? `${c.description}\n` : '';
      return `${heading}\n${desc}\`\`\`json\n${json(componentSchema(c))}\n\`\`\``;
    })
    .join('\n\n');

  const exampleBlocks = examples
    .map((e) => `User: "${e.request}"\n\`\`\`json\n${json(e.messages)}\n\`\`\``)
    .join('\n\n');

  return `${PREAMBLE}\n\n## Components\n\n${componentBlocks}\n\n## Examples\n\n${exampleBlocks}\n`;
}
