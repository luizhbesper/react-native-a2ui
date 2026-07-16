import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { generateSystemPrompt, type PromptComponent } from './promptgen';

/**
 * A registered catalog = a representative slice of the basic catalog (supplied as JSON
 * Schema, the shape it is vendored in) plus one custom component defined with a Zod schema
 * and a description. promptgen treats both uniformly, so a subset exercises the same path
 * as the full 18-component catalog. Full-catalog wiring is a later (M2-T4+) concern.
 */
const basicSubset: PromptComponent[] = [
  {
    name: 'Text',
    description: 'Displays text with optional inline Markdown.',
    schema: {
      properties: { text: { type: 'string' }, variant: { type: 'string' } },
      required: ['text'],
    },
  },
  {
    name: 'Column',
    description: 'Vertical stack of child components referenced by id.',
    schema: {
      properties: { children: { type: 'array', items: { type: 'string' } } },
      required: ['children'],
    },
  },
];

const starRating: PromptComponent = {
  name: 'StarRating',
  description: 'A star-rating input the user can tap to set a score.',
  schema: z.object({
    label: z.string().optional().describe('Caption shown above the stars'),
    max: z.number().int().describe('Number of stars to show'),
    value: z.number().describe('Current rating between 0 and max'),
  }),
};

const catalog = [...basicSubset, starRating];

describe('generateSystemPrompt', () => {
  it('includes each registered component schema behind its type discriminant', () => {
    const prompt = generateSystemPrompt(catalog);
    for (const c of catalog) {
      expect(prompt).toContain(c.name);
    }
    // The custom Zod schema is rendered, not just its name.
    expect(prompt).toContain('Current rating between 0 and max');
    // Every component schema is wrapped with a { component: { const: <name> } } discriminant.
    expect(prompt).toContain('"const": "StarRating"');
  });

  it('includes few-shot examples of A2UI output', () => {
    const prompt = generateSystemPrompt(catalog);
    expect(prompt).toContain('Examples');
    expect(prompt).toContain('createSurface');
    expect(prompt).toContain('updateComponents');
  });

  it('matches the approved prompt snapshot', () => {
    // Reviewed baseline — update deliberately (see testing rule on the one allowed snapshot).
    expect(generateSystemPrompt(catalog)).toMatchSnapshot();
  });
});
