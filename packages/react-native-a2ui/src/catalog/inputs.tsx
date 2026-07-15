// Basic-catalog input components. Props are transcribed from the vendored schema
// (conformance/fixtures/v0_9/catalogs/basic/catalog.json); each component notes its
// `#/components/<Name>` path. Plain RN primitives + theme tokens only (ADR-0002).

import { Pressable, Text as RNText, TextInput, View, type ViewStyle } from 'react-native';
import { useSurface } from '../renderer/hooks';
import { NodeRenderer } from '../renderer/NodeRenderer';
import type { CatalogComponentProps } from '../renderer/registry';
import { useTheme } from '../theme/ThemeContext';
import type { Theme } from '../theme/tokens';
import { bindingPath, useDynamicBoolean, useDynamicString } from './binding';

/** The `{ event: { name, context } }` half of an Action (common_types.json #/$defs/Action). */
function eventAction(action: unknown): { name: string; context?: Record<string, unknown> } | null {
  if (typeof action !== 'object' || action === null) return null;
  const event = (action as Record<string, unknown>).event;
  if (typeof event !== 'object' || event === null) return null;
  const e = event as Record<string, unknown>;
  if (typeof e.name !== 'string') return null;
  const context =
    typeof e.context === 'object' && e.context !== null
      ? (e.context as Record<string, unknown>)
      : undefined;
  return { name: e.name, context };
}

// variant → button surface. Source: schema #/components/Button (variant enum, default
// 'default'). Pressed state uses the theme's *Hover tokens (M1-T1 shipped them).
function buttonStyle(theme: Theme, variant: unknown, pressed: boolean): ViewStyle {
  const base: ViewStyle = {
    paddingVertical: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
    borderRadius: theme.radii.base,
    alignItems: 'center',
    justifyContent: 'center',
  };
  if (variant === 'borderless') return { ...base, backgroundColor: 'transparent' };
  if (variant === 'primary') {
    return { ...base, backgroundColor: pressed ? theme.colors.primaryHover : theme.colors.primary };
  }
  return {
    ...base,
    backgroundColor: pressed ? theme.colors.secondaryHover : theme.colors.secondary,
    borderWidth: theme.borderWidths.base,
    borderColor: theme.colors.border,
  };
}

// Button — schema #/components/Button. Props: child (ComponentId, required), variant (enum,
// default 'default'), action (Action, required). A server `{ event }` action dispatches
// through the surface (the engine resolves `{ path }` context refs at fire time, M0-T5); a
// `{ functionCall }` action is a client-side function with no engine interface yet — deferred.
export function Button({ node }: CatalogComponentProps) {
  const theme = useTheme();
  const surface = useSurface();
  const p = node.properties;
  const action = eventAction(p.action);
  const onPress = action
    ? () => surface.dispatchAction(action.name, node.id, action.context)
    : undefined;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => buttonStyle(theme, p.variant, pressed)}
    >
      {typeof p.child === 'string' ? <NodeRenderer nodeId={p.child} /> : null}
    </Pressable>
  );
}

// variant → TextInput behaviour. Source: schema #/components/TextField (variant enum,
// default 'shortText'). `value` stays a DynamicString even for the 'number' variant, so the
// write-back is the raw string; the server coerces.
// ponytail: validationRegexp / checks (client-side validity) are not surfaced yet — no error
// UI in T5's scope; wire when a validation-display task lands.
export function TextField({ node }: CatalogComponentProps) {
  const theme = useTheme();
  const surface = useSurface();
  const p = node.properties;
  const path = bindingPath(p.value);
  const value = useDynamicString(p.value);
  const label = useDynamicString(p.label);
  const variant = p.variant;
  const onChangeText = path === null ? undefined : (text: string) => surface.setValue(path, text);
  return (
    <View>
      {label !== '' ? (
        <RNText
          style={{
            color: theme.colors.onBackground,
            fontSize: theme.fontSizes.s,
            marginBottom: theme.spacing.xs,
          }}
        >
          {label}
        </RNText>
      ) : null}
      <TextInput
        accessibilityLabel={label || undefined}
        value={path === null ? undefined : value}
        defaultValue={path === null ? value : undefined}
        onChangeText={onChangeText}
        multiline={variant === 'longText'}
        secureTextEntry={variant === 'obscured'}
        keyboardType={variant === 'number' ? 'numeric' : 'default'}
        style={{
          color: theme.colors.onInput,
          backgroundColor: theme.colors.input,
          borderColor: theme.colors.border,
          borderWidth: theme.borderWidths.base,
          borderRadius: theme.radii.base,
          padding: theme.spacing.s,
        }}
      />
    </View>
  );
}

// CheckBox — schema #/components/CheckBox. Props: label (DynamicString, required), value
// (DynamicBoolean, required). No RN checkbox primitive exists and ADR-0002 forbids a UI dep,
// so it's built from primitives: a checkbox-role Pressable that writes the negated value back.
export function CheckBox({ node }: CatalogComponentProps) {
  const theme = useTheme();
  const surface = useSurface();
  const p = node.properties;
  const path = bindingPath(p.value);
  const checked = useDynamicBoolean(p.value);
  const label = useDynamicString(p.label);
  const onPress = path === null ? undefined : () => surface.setValue(path, !checked);
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label || undefined}
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s }}
    >
      <View
        style={{
          width: theme.fontSizes.m,
          height: theme.fontSizes.m,
          borderWidth: theme.borderWidths.base,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.base,
          backgroundColor: checked ? theme.colors.primary : theme.colors.input,
        }}
      />
      {label !== '' ? (
        <RNText style={{ color: theme.colors.onBackground, fontSize: theme.fontSizes.m }}>
          {label}
        </RNText>
      ) : null}
    </Pressable>
  );
}
