// The A2UI system prompt for the live chat, derived from the vendored basic catalog schema.
// This is the "consumer story" the llm package (M2-T3/T4) defers: turn the real catalog.json
// into the `PromptComponent[]` that `generateSystemPrompt` needs, so the model is told the exact
// component vocabulary the renderer can paint. Test data path, same as fixtures.ts — Metro bundles
// it because metro.config.js watches the repo root.
import { generateSystemPrompt, type PromptComponent } from '@react-native-a2ui/llm';
import catalog from '../../packages/react-native-a2ui/conformance/fixtures/v0_9/catalogs/basic/catalog.json';

// Each catalog component is `{ type, allOf: [<common refs...>, { properties, required }] }`; the
// component-specific block is the one `allOf` entry that carries `properties`.
type CatalogJson = {
  catalogId: string;
  components: Record<
    string,
    { allOf?: { properties?: Record<string, unknown>; required?: string[] }[] }
  >;
};

const cat = catalog as unknown as CatalogJson;

/** The catalog id the engine matches on; the model must echo it in every createSurface. */
export const CATALOG_ID = cat.catalogId;

/** All 18 basic components as prompt schemas, derived (never hand-written) from the vendored catalog. */
export const PROMPT_COMPONENTS: PromptComponent[] = Object.entries(cat.components).map(
  ([name, def]) => {
    const inline = def.allOf?.find((e) => e.properties) ?? {};
    // `component` is the discriminant; generateSystemPrompt re-adds it, so drop it here.
    const { component: _c, ...properties } = inline.properties ?? {};
    const required = (inline.required ?? []).filter((k) => k !== 'component');
    return { name, schema: { type: 'object', properties, required } };
  },
);

// One booking-flavored few-shot with the real CATALOG_ID (the default examples use "basic", which
// the engine rejects). Reinforced by an explicit catalogId line so createSurface always matches.
const BOOKING_EXAMPLE = {
  request: 'Book me a table.',
  messages: [
    {
      version: 'v0.9',
      createSurface: { surfaceId: 'booking', catalogId: CATALOG_ID, sendDataModel: true },
    },
    {
      version: 'v0.9',
      updateComponents: {
        surfaceId: 'booking',
        components: [
          {
            id: 'root',
            component: 'Column',
            children: ['title', 'when', 'size', 'name', 'submit'],
          },
          { id: 'title', component: 'Text', text: 'Reserve a table', variant: 'h2' },
          {
            id: 'when',
            component: 'DateTimeInput',
            label: 'Date & time',
            value: { path: '/when' },
            enableDate: true,
            enableTime: true,
          },
          {
            id: 'size',
            component: 'TextField',
            label: 'Party size',
            value: { path: '/partySize' },
            variant: 'number',
          },
          { id: 'name', component: 'TextField', label: 'Name', value: { path: '/name' } },
          {
            id: 'submit',
            component: 'Button',
            child: 'submit_label',
            action: {
              event: {
                name: 'reserve',
                context: {
                  when: { path: '/when' },
                  partySize: { path: '/partySize' },
                  name: { path: '/name' },
                },
              },
            },
          },
          { id: 'submit_label', component: 'Text', text: 'Reserve' },
        ],
      },
    },
  ],
};

/** The full system prompt: protocol + all component schemas + one booking few-shot + catalogId rule. */
export const SYSTEM_PROMPT = `${generateSystemPrompt(PROMPT_COMPONENTS, [
  BOOKING_EXAMPLE,
])}\nAlways use catalogId "${CATALOG_ID}" in every createSurface.`;
