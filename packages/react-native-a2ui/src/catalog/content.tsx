// Basic-catalog content components. Props are transcribed from the vendored schema
// (conformance/fixtures/v0_9/catalogs/basic/catalog.json); each component notes its
// `#/components/<Name>` path. Plain RN primitives + theme tokens only (ADR-0002).

import type { ReactNode } from 'react';
import {
  type ImageResizeMode,
  type ImageStyle,
  Image as RNImage,
  Text as RNText,
  type TextStyle,
} from 'react-native';
import { useValue } from '../renderer/hooks';
import type { CatalogComponentProps } from '../renderer/registry';
import { useTheme } from '../theme/ThemeContext';
import type { Theme } from '../theme/tokens';

// A DynamicString (common_types.json #/$defs/DynamicString) is a literal string, a
// `{ path }` DataBinding, or a `{ call, args }` FunctionCall. We resolve literals and
// bindings; function calls need engine-side evaluation with no interface yet, so they
// resolve to '' (deferred to a later task).
function bindingPath(value: unknown): string | null {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const path = (value as Record<string, unknown>).path;
    if (typeof path === 'string') return path;
  }
  return null;
}

/** Resolves a DynamicString property to a string, subscribing when it is a `{ path }` binding. */
function useDynamicString(value: unknown): string {
  const path = bindingPath(value);
  const bound = useValue(path);
  const resolved = path === null ? value : bound;
  if (typeof resolved === 'string') return resolved;
  if (typeof resolved === 'number' || typeof resolved === 'boolean') return String(resolved);
  return '';
}

// Markdown-lite: inline **bold**/__bold__ and *italic*/_italic_ only. The Text schema names
// "simple Markdown ... without HTML, images, or links"; heading size comes from `variant`, so
// block syntax (#, -, links) is intentionally not parsed. ponytail: not a full markdown
// engine — extend here only when a fixture needs another schema-allowed inline feature.
const INLINE = /(\*\*|__)(.+?)\1|(\*|_)(.+?)\3/g;

function renderInline(text: string): ReactNode {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  INLINE.lastIndex = 0;
  let match: RegExpExecArray | null = INLINE.exec(text);
  while (match !== null) {
    if (match.index > last) out.push(text.slice(last, match.index));
    if (match[2] !== undefined) {
      out.push(
        <RNText key={key} style={{ fontWeight: 'bold' }}>
          {match[2]}
        </RNText>,
      );
    } else {
      out.push(
        <RNText key={key} style={{ fontStyle: 'italic' }}>
          {match[4]}
        </RNText>,
      );
    }
    key += 1;
    last = INLINE.lastIndex;
    match = INLINE.exec(text);
  }
  if (last < text.length) out.push(text.slice(last));
  return out.length === 1 ? out[0] : out;
}

// variant → base text style. Source: schema #/components/Text (variant enum, default 'body').
function textVariantStyle(theme: Theme, variant: unknown): TextStyle {
  const heading = (fontSize: number): TextStyle => ({
    fontSize,
    fontWeight: 'bold',
    lineHeight: fontSize * theme.lineHeights.headings,
    color: theme.colors.onBackground,
  });
  switch (variant) {
    case 'h1':
      return heading(theme.fontSizes.xxl);
    case 'h2':
      return heading(theme.fontSizes.xl);
    case 'h3':
      return heading(theme.fontSizes.l);
    case 'h4':
      return heading(theme.fontSizes.m);
    case 'h5':
      return heading(theme.fontSizes.s);
    case 'caption':
      return {
        fontSize: theme.fontSizes.xs,
        lineHeight: theme.fontSizes.xs * theme.lineHeights.body,
        color: theme.colors.onBackground,
      };
    default:
      return {
        fontSize: theme.fontSizes.m,
        lineHeight: theme.fontSizes.m * theme.lineHeights.body,
        color: theme.colors.onBackground,
      };
  }
}

// Text — schema #/components/Text. Props: text (DynamicString, required), variant (enum,
// default 'body'). `text` supports markdown-lite (bold/italic); newlines render natively.
export function Text({ node }: CatalogComponentProps) {
  const theme = useTheme();
  const text = useDynamicString(node.properties.text);
  return (
    <RNText style={textVariantStyle(theme, node.properties.variant)}>{renderInline(text)}</RNText>
  );
}

// fit → RN resizeMode. Source: schema #/components/Image (fit enum, default 'fill').
// CSS object-fit 'fill' stretches → RN 'stretch'; 'none'/'scaleDown' have no exact RN mode.
const FIT: Record<string, ImageResizeMode> = {
  contain: 'contain',
  cover: 'cover',
  fill: 'stretch',
  none: 'center',
  scaleDown: 'contain',
};

// variant → placeholder box size (dp). Not carried by the schema or theme tokens; sensible
// defaults ordered icon < avatar < features < header.
// ponytail: fixed sizes; wire real responsive/intrinsic sizing when a fixture needs it.
const IMAGE_SIZE: Record<string, ImageStyle> = {
  icon: { width: 24, height: 24 },
  avatar: { width: 40, height: 40 },
  smallFeature: { width: 96, height: 96 },
  mediumFeature: { width: 160, height: 160 },
  largeFeature: { width: 240, height: 240 },
  header: { width: '100%', height: 200 },
};

// Image — schema #/components/Image. Props: url (DynamicString, required), description
// (DynamicString, accessibility), fit (enum, default 'fill'), variant (enum, default
// 'mediumFeature'). Renders nothing when the url resolves to empty (missing/null binding).
export function Image({ node }: CatalogComponentProps) {
  const p = node.properties;
  const uri = useDynamicString(p.url);
  const description = useDynamicString(p.description);
  if (uri === '') return null;
  const fit = typeof p.fit === 'string' ? p.fit : 'fill';
  const variant = typeof p.variant === 'string' ? p.variant : 'mediumFeature';
  return (
    <RNImage
      source={{ uri }}
      resizeMode={FIT[fit] ?? 'stretch'}
      accessible={description !== ''}
      accessibilityLabel={description || undefined}
      style={IMAGE_SIZE[variant] ?? IMAGE_SIZE.mediumFeature}
    />
  );
}

// Icon — schema #/components/Icon. `name` is an enum string, a `{ svgPath }`, or a
// DataBinding. ponytail: dependency-free placeholder — renders the resolved name as an
// accessible glyph slot. Real Material glyphs / svgPath rendering need an icon-font or SVG
// adapter, kept out of the main package per ADR-0002; wire that when a catalog adapter lands.
export function Icon({ node }: CatalogComponentProps) {
  const theme = useTheme();
  const name = useDynamicString(node.properties.name);
  return (
    <RNText
      accessibilityRole="image"
      accessibilityLabel={name || undefined}
      style={{ fontSize: theme.fontSizes.m, color: theme.colors.onBackground }}
    >
      {name}
    </RNText>
  );
}
