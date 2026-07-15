// Basic-catalog layout components. Props are transcribed from the vendored schema
// (conformance/fixtures/v0_9/catalogs/basic/catalog.json); each component notes its
// `#/components/<Name>` path. Plain RN primitives + theme tokens only (ADR-0002).

import { FlatList, type FlexAlignType, View } from 'react-native';
import type { ComponentNode } from '../engine/types';
import {
  DataScopeContextProvider,
  resolvePointer,
  useDataScope,
  useValue,
} from '../renderer/hooks';
import { NodeRenderer } from '../renderer/NodeRenderer';
import type { CatalogComponentProps } from '../renderer/registry';
import { useTheme } from '../theme/ThemeContext';

// Cross-axis alignment (`align` enum on Row/Column/List).
const ALIGN: Record<string, FlexAlignType> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
};

// Main-axis distribution (`justify` enum on Row/Column). RN's justifyContent has no
// 'stretch', so the schema's 'stretch' falls back to the default packing.
const JUSTIFY: Record<
  string,
  'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'
> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  spaceBetween: 'space-between',
  spaceAround: 'space-around',
  spaceEvenly: 'space-evenly',
  stretch: 'flex-start',
};

function pick<T>(map: Record<string, T>, value: unknown, fallback: T): T {
  if (typeof value !== 'string') return fallback;
  const hit = map[value];
  return hit === undefined ? fallback : hit;
}

/** A ChildList template: instantiate `componentId` once per item in the list at `path`. */
type Template = { componentId: string; path: string };

function asTemplate(children: unknown): Template | undefined {
  if (typeof children === 'object' && children !== null && !Array.isArray(children)) {
    const c = children as Record<string, unknown>;
    if (typeof c.componentId === 'string' && typeof c.path === 'string') {
      return { componentId: c.componentId, path: c.path };
    }
  }
  return undefined;
}

/** Absolute base paths, one per template item, reactive to the bound list's length. */
function useTemplateBasePaths(path: string): string[] {
  const listPath = resolvePointer(useDataScope(), path);
  const value = useValue(path);
  if (!Array.isArray(value)) return [];
  return value.map((_, i) => resolvePointer(listPath, String(i)));
}

/** Renders one template instance under its item-scoped data path. */
function ScopedNode({ nodeId, basePath }: { nodeId: string; basePath: string }) {
  return (
    <DataScopeContextProvider value={basePath}>
      <NodeRenderer nodeId={nodeId} />
    </DataScopeContextProvider>
  );
}

function TemplateChildren({ template }: { template: Template }) {
  const bases = useTemplateBasePaths(template.path);
  return (
    <>
      {bases.map((base) => (
        <ScopedNode key={base} nodeId={template.componentId} basePath={base} />
      ))}
    </>
  );
}

/** Renders a ChildList: a static array of component ids, or a data-driven template. */
function Children({ spec }: { spec: unknown }) {
  const template = asTemplate(spec);
  if (template) return <TemplateChildren template={template} />;
  if (Array.isArray(spec)) {
    return (
      <>
        {spec.map((id) => (
          <NodeRenderer key={String(id)} nodeId={String(id)} />
        ))}
      </>
    );
  }
  return null;
}

// Row/Column — schema #/components/Row, #/components/Column. Props: children (ChildList),
// justify (default 'start'), align (default 'stretch'); they differ only in main axis.
// ponytail: per-child `weight` (flex-grow) is not applied yet — children size to content;
// add when a fixture visibly needs proportional growth (revisit around M1-T5+).
function Stack({ node, direction }: { node: ComponentNode; direction: 'row' | 'column' }) {
  const p = node.properties;
  return (
    <View
      style={{
        flexDirection: direction,
        justifyContent: pick(JUSTIFY, p.justify, 'flex-start'),
        alignItems: pick(ALIGN, p.align, 'stretch'),
      }}
    >
      <Children spec={p.children} />
    </View>
  );
}

export function Row({ node }: CatalogComponentProps) {
  return <Stack node={node} direction="row" />;
}

export function Column({ node }: CatalogComponentProps) {
  return <Stack node={node} direction="column" />;
}

// Card — schema #/components/Card. Prop: child (a single ComponentId).
export function Card({ node }: CatalogComponentProps) {
  const theme = useTheme();
  const child = node.properties.child;
  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderWidth: theme.borderWidths.base,
        borderRadius: theme.radii.base,
        padding: theme.spacing.m,
      }}
    >
      {typeof child === 'string' ? <NodeRenderer nodeId={child} /> : null}
    </View>
  );
}

// Divider — schema #/components/Divider. Prop: axis (default 'horizontal').
export function Divider({ node }: CatalogComponentProps) {
  const theme = useTheme();
  const vertical = node.properties.axis === 'vertical';
  return (
    <View
      style={{
        alignSelf: 'stretch',
        backgroundColor: theme.colors.border,
        ...(vertical ? { width: theme.borderWidths.base } : { height: theme.borderWidths.base }),
      }}
    />
  );
}

function TemplateList({
  template,
  horizontal,
  alignItems,
}: {
  template: Template;
  horizontal: boolean;
  alignItems: FlexAlignType;
}) {
  const bases = useTemplateBasePaths(template.path);
  return (
    <FlatList
      data={bases}
      horizontal={horizontal}
      keyExtractor={(base) => base}
      renderItem={({ item }) => <ScopedNode nodeId={template.componentId} basePath={item} />}
      contentContainerStyle={{ alignItems }}
    />
  );
}

// List — schema #/components/List. Props: children (ChildList), direction (default
// 'vertical'), align (default 'stretch'). Renders through FlatList so long/streamed
// template lists virtualize.
export function List({ node }: CatalogComponentProps) {
  const p = node.properties;
  const horizontal = p.direction === 'horizontal';
  const alignItems = pick(ALIGN, p.align, 'stretch');
  const template = asTemplate(p.children);
  if (template) {
    return <TemplateList template={template} horizontal={horizontal} alignItems={alignItems} />;
  }
  const ids = Array.isArray(p.children) ? p.children.map(String) : [];
  return (
    <FlatList
      data={ids}
      horizontal={horizontal}
      keyExtractor={(id) => id}
      renderItem={({ item }) => <NodeRenderer nodeId={item} />}
      contentContainerStyle={{ alignItems }}
    />
  );
}
