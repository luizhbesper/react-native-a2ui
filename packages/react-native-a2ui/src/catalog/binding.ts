// Shared catalog helpers for resolving `Dynamic*` props (common_types.json #/$defs).
// A Dynamic value is a literal, a `{ path }` DataBinding (subscribed reactively), or a
// `{ call, args }` FunctionCall. Function calls need engine-side evaluation with no
// interface yet, so they resolve to a neutral empty value (deferred to a later task).

import { useValue } from '../renderer/hooks';

/** The JSON-pointer of a `{ path }` DataBinding, or null for a literal / function call. */
export function bindingPath(value: unknown): string | null {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const path = (value as Record<string, unknown>).path;
    if (typeof path === 'string') return path;
  }
  return null;
}

/** Resolves a DynamicString to a string, subscribing when it is a `{ path }` binding. */
export function useDynamicString(value: unknown): string {
  const path = bindingPath(value);
  const bound = useValue(path);
  const resolved = path === null ? value : bound;
  if (typeof resolved === 'string') return resolved;
  if (typeof resolved === 'number' || typeof resolved === 'boolean') return String(resolved);
  return '';
}

/** Resolves a DynamicBoolean to a boolean, subscribing when it is a `{ path }` binding. */
export function useDynamicBoolean(value: unknown): boolean {
  const path = bindingPath(value);
  const bound = useValue(path);
  const resolved = path === null ? value : bound;
  return resolved === true;
}
