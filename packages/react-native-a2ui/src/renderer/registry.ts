import type { ComponentType } from 'react';
import type { ComponentNode } from '../engine/types';

/** Props every catalog component receives: the node to render (id, type, raw properties). */
export interface CatalogComponentProps {
  node: ComponentNode;
}

/** A component that renders one node `type`. Catalog packages supply these. */
export type CatalogComponent = ComponentType<CatalogComponentProps>;

/**
 * Maps a node's `type` to its renderer. This is the allow-list: a type with no entry
 * renders nothing (nothing from the wire is ever evaluated). Catalogs live in their own
 * packages (ADR-0002) and hand their registry to `<A2UIProvider>`.
 */
export type ComponentRegistry = Record<string, CatalogComponent>;
