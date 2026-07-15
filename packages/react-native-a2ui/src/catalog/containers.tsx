// Basic-catalog container + media components. Props are transcribed from the vendored schema
// (conformance/fixtures/v0_9/catalogs/basic/catalog.json); each component notes its
// `#/components/<Name>` path. Plain RN primitives + theme tokens only (ADR-0002).
//
// Video/AudioPlayer are STUBS: a themed placeholder card showing the media kind + source, not
// a real player. A native player (expo-av / a media module) would break ADR-0002's "no UI or
// native deps in the main package"; the real player ships as a future catalog adapter package.

import { useState } from 'react';
import { Pressable, Text as RNText, StyleSheet, View } from 'react-native';
import { NodeRenderer } from '../renderer/NodeRenderer';
import type { CatalogComponentProps } from '../renderer/registry';
import { useTheme } from '../theme/ThemeContext';
import { useDynamicString } from './binding';

/** One tab header. Its own component so each title's DynamicString hook is stable (no hooks-in-loop). */
function TabHeader({
  title,
  active,
  onPress,
}: {
  title: unknown;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const label = useDynamicString(title);
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        paddingVertical: theme.spacing.s,
        paddingHorizontal: theme.spacing.m,
        borderBottomWidth: theme.borderWidths.base * 2,
        borderBottomColor: active ? theme.colors.primary : 'transparent',
      }}
    >
      <RNText
        style={{
          color: active ? theme.colors.primary : theme.colors.onBackground,
          fontSize: theme.fontSizes.m,
        }}
      >
        {label}
      </RNText>
    </Pressable>
  );
}

type TabItem = { title: unknown; child: unknown };

// Tabs — schema #/components/Tabs. Prop: tabs (array of { title: DynamicString, child:
// ComponentId }, minItems 1, required). JS tab bar: Pressable headers pick the active index;
// only the active tab's child subtree is mounted.
export function Tabs({ node }: CatalogComponentProps) {
  const theme = useTheme();
  const [active, setActive] = useState(0);
  const items = Array.isArray(node.properties.tabs) ? (node.properties.tabs as TabItem[]) : [];
  if (items.length === 0) return null;
  // Clamp in case the streamed tabs array shrinks below the selected index (wire trust boundary).
  const current = Math.min(active, items.length - 1);
  const child = items[current]?.child;
  return (
    <View>
      <View style={{ flexDirection: 'row', gap: theme.spacing.s }}>
        {items.map((tab, i) => (
          <TabHeader
            key={typeof tab.child === 'string' ? tab.child : String(i)}
            title={tab.title}
            active={i === current}
            onPress={() => setActive(i)}
          />
        ))}
      </View>
      {typeof child === 'string' ? <NodeRenderer nodeId={child} /> : null}
    </View>
  );
}

// Modal — schema #/components/Modal. Props: trigger (ComponentId, required — the component
// that opens the modal when interacted with), content (ComponentId, required — shown inside
// the modal). Client-managed open state with a conditional overlay (not RN core Modal, whose
// iOS `isRendered` latch never clears under Jest so it can't be closed in tests); a backdrop
// press closes it.
// ponytail: the trigger is rendered non-interactive (pointerEvents="none") inside the opener
// Pressable so a tap reliably opens the modal even when the trigger is itself a Button — that
// suppresses the trigger's own declared action while it serves as the opener. The overlay is
// surface-local, not a native portal (no OS back-button handling); a real adapter can swap in
// RN core Modal or a portal library.
export function Modal({ node }: CatalogComponentProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const p = node.properties;
  const trigger = typeof p.trigger === 'string' ? p.trigger : null;
  const content = typeof p.content === 'string' ? p.content : null;
  return (
    <View>
      {trigger ? (
        <Pressable accessibilityRole="button" onPress={() => setOpen(true)}>
          <View pointerEvents="none">
            <NodeRenderer nodeId={trigger} />
          </View>
        </Pressable>
      ) : null}
      {open && content ? (
        <View
          style={[
            StyleSheet.absoluteFill,
            { alignItems: 'center', justifyContent: 'center', padding: theme.spacing.l },
          ]}
        >
          <Pressable
            accessibilityLabel="Close"
            onPress={() => setOpen(false)}
            // No scrim token in the theme set; a translucent black backdrop is the default.
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
          />
          <View
            style={{
              maxWidth: '100%',
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderWidth: theme.borderWidths.base,
              borderRadius: theme.radii.base,
              padding: theme.spacing.m,
            }}
          >
            <NodeRenderer nodeId={content} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

/** Themed placeholder card for a media stub: a kind badge + the source, one a11y label. */
function MediaPlaceholder({ kind, source }: { kind: string; source: string }) {
  const theme = useTheme();
  return (
    <View
      accessibilityLabel={source ? `${kind}: ${source}` : kind}
      style={{
        gap: theme.spacing.xs,
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderWidth: theme.borderWidths.base,
        borderRadius: theme.radii.base,
        padding: theme.spacing.m,
      }}
    >
      <RNText
        style={{
          color: theme.colors.onSurface,
          fontSize: theme.fontSizes.s,
          fontWeight: 'bold',
        }}
      >
        {kind}
      </RNText>
      {source ? (
        <RNText style={{ color: theme.colors.onSurface, fontSize: theme.fontSizes.s }}>
          {source}
        </RNText>
      ) : null}
    </View>
  );
}

// Video — schema #/components/Video. Prop: url (DynamicString, required). Stub: a placeholder
// card showing the source url, not a real player (see file header / ADR-0002).
export function Video({ node }: CatalogComponentProps) {
  const url = useDynamicString(node.properties.url);
  return <MediaPlaceholder kind="Video" source={url} />;
}

// AudioPlayer — schema #/components/AudioPlayer. Props: url (DynamicString, required),
// description (DynamicString, optional). Stub: a placeholder card showing the description (or
// the url when none), not a real player (see file header / ADR-0002).
export function AudioPlayer({ node }: CatalogComponentProps) {
  const p = node.properties;
  const url = useDynamicString(p.url);
  const description = useDynamicString(p.description);
  return <MediaPlaceholder kind="Audio" source={description || url} />;
}
