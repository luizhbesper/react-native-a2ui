// Basic-catalog input components. Props are transcribed from the vendored schema
// (conformance/fixtures/v0_9/catalogs/basic/catalog.json); each component notes its
// `#/components/<Name>` path. Plain RN primitives + theme tokens only (ADR-0002).

import { Pressable, Text as RNText, TextInput, View, type ViewStyle } from 'react-native';
import { useComposedPress, useSurface } from '../renderer/hooks';
import { NodeRenderer } from '../renderer/NodeRenderer';
import type { CatalogComponentProps } from '../renderer/registry';
import { useTheme } from '../theme/ThemeContext';
import type { Theme } from '../theme/tokens';
import {
  bindingPath,
  useDynamicBoolean,
  useDynamicNumber,
  useDynamicString,
  useDynamicStringList,
} from './binding';

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
  // Composes with an ancestor container's press (e.g. a Modal opening) when this Button is its
  // trigger, so the action fires AND the modal opens on one tap; a no-op outside such a container.
  const onPress = useComposedPress(
    action ? () => surface.dispatchAction(action.name, node.id, action.context) : undefined,
  );
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

/** A field caption shared by the input-B components (Slider/ChoicePicker/DateTimeInput). */
function FieldLabel({ text }: { text: string }) {
  const theme = useTheme();
  if (text === '') return null;
  return (
    <RNText
      style={{
        color: theme.colors.onBackground,
        fontSize: theme.fontSizes.s,
        marginBottom: theme.spacing.xs,
      }}
    >
      {text}
    </RNText>
  );
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

// Slider — schema #/components/Slider. Props: label (DynamicString, optional), min (number,
// default 0), max (number, required), value (DynamicNumber, required). Expo-Go-safe JS
// fallback: a themed track/thumb with −/+ step buttons plus an adjustable a11y role — no
// native slider module (ADR-0002). ponytail: stepper fallback, no touch-drag gesture; add a
// PanResponder drag when a fixture needs continuous dragging. The step is a design default
// (schema carries no step): a tenth of the range.
export function Slider({ node }: CatalogComponentProps) {
  const theme = useTheme();
  const surface = useSurface();
  const p = node.properties;
  const min = typeof p.min === 'number' ? p.min : 0;
  const max = typeof p.max === 'number' ? p.max : min;
  const step = max > min ? (max - min) / 10 : 0;
  const label = useDynamicString(p.label);
  const path = bindingPath(p.value);
  const now = clamp(useDynamicNumber(p.value) ?? min, min, max);
  const write =
    path === null ? undefined : (v: number) => surface.setValue(path, clamp(v, min, max));
  const stepBy = write === undefined ? undefined : (dir: 1 | -1) => write(now + dir * step);
  const percent = max > min ? ((now - min) / (max - min)) * 100 : 0;
  const btn = {
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
  } as const;
  return (
    <View
      accessibilityRole="adjustable"
      accessibilityLabel={label || undefined}
      accessibilityValue={{ min, max, now }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'increment') stepBy?.(1);
        else if (e.nativeEvent.actionName === 'decrement') stepBy?.(-1);
      }}
    >
      <FieldLabel text={label} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label}`.trim()}
          onPress={stepBy && (() => stepBy(-1))}
          style={btn}
        >
          <RNText style={{ color: theme.colors.onBackground, fontSize: theme.fontSizes.l }}>
            −
          </RNText>
        </Pressable>
        <View
          style={{
            flex: 1,
            height: theme.borderWidths.base * 4,
            borderRadius: theme.radii.base,
            backgroundColor: theme.colors.input,
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              position: 'absolute',
              left: `${percent}%`,
              width: theme.fontSizes.m,
              height: theme.fontSizes.m,
              marginLeft: -theme.fontSizes.m / 2,
              borderRadius: theme.fontSizes.m / 2,
              backgroundColor: theme.colors.primary,
            }}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label}`.trim()}
          onPress={stepBy && (() => stepBy(1))}
          style={btn}
        >
          <RNText style={{ color: theme.colors.onBackground, fontSize: theme.fontSizes.l }}>
            +
          </RNText>
        </Pressable>
      </View>
    </View>
  );
}

/** One selectable option row/chip. Its own component so each label's DynamicString hook is stable. */
function ChoiceOption({
  option,
  selected,
  role,
  chips,
  onToggle,
}: {
  option: { label: unknown; value: string };
  selected: boolean;
  role: 'radio' | 'checkbox';
  chips: boolean;
  onToggle?: () => void;
}) {
  const theme = useTheme();
  const label = useDynamicString(option.label);
  if (chips) {
    return (
      <Pressable
        accessibilityRole={role}
        accessibilityState={{ checked: selected }}
        accessibilityLabel={label}
        onPress={onToggle}
        style={{
          paddingVertical: theme.spacing.xs,
          paddingHorizontal: theme.spacing.m,
          borderRadius: theme.radii.base,
          borderWidth: theme.borderWidths.base,
          borderColor: theme.colors.border,
          backgroundColor: selected ? theme.colors.primary : theme.colors.input,
        }}
      >
        <RNText
          style={{
            color: selected ? theme.colors.onPrimary : theme.colors.onInput,
            fontSize: theme.fontSizes.m,
          }}
        >
          {label}
        </RNText>
      </Pressable>
    );
  }
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      onPress={onToggle}
      style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s }}
    >
      <View
        style={{
          width: theme.fontSizes.m,
          height: theme.fontSizes.m,
          borderWidth: theme.borderWidths.base,
          borderColor: theme.colors.border,
          borderRadius: role === 'radio' ? theme.fontSizes.m / 2 : theme.radii.base,
          backgroundColor: selected ? theme.colors.primary : theme.colors.input,
        }}
      />
      <RNText style={{ color: theme.colors.onBackground, fontSize: theme.fontSizes.m }}>
        {label}
      </RNText>
    </Pressable>
  );
}

// ChoicePicker — schema #/components/ChoicePicker. Props: label (DynamicString, optional),
// variant (multipleSelection | mutuallyExclusive, default mutuallyExclusive), options (array
// of { label: DynamicString, value: string }, required), value (DynamicStringList of the
// selected values, required), displayStyle (checkbox | chips, default checkbox), filterable
// (boolean, default false). ponytail: `filterable` (search box over options) is not surfaced —
// no fixture uses it; add it with a validation/search task if one appears.
export function ChoicePicker({ node }: CatalogComponentProps) {
  const theme = useTheme();
  const surface = useSurface();
  const p = node.properties;
  const multiple = p.variant === 'multipleSelection';
  const chips = p.displayStyle === 'chips';
  const label = useDynamicString(p.label);
  const options = Array.isArray(p.options)
    ? (p.options as { label: unknown; value: string }[])
    : [];
  const path = bindingPath(p.value);
  const selected = useDynamicStringList(p.value);
  const toggle =
    path === null
      ? undefined
      : (v: string) => {
          if (!multiple) return surface.setValue(path, [v]);
          const next = selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v];
          surface.setValue(path, next);
        };
  return (
    <View style={{ gap: theme.spacing.s }}>
      <FieldLabel text={label} />
      <View
        style={{
          flexDirection: chips ? 'row' : 'column',
          flexWrap: chips ? 'wrap' : 'nowrap',
          gap: theme.spacing.s,
        }}
      >
        {options.map((opt) => (
          <ChoiceOption
            key={opt.value}
            option={opt}
            selected={selected.includes(opt.value)}
            role={multiple ? 'checkbox' : 'radio'}
            chips={chips}
            onToggle={toggle && (() => toggle(opt.value))}
          />
        ))}
      </View>
    </View>
  );
}

// DateTimeInput — schema #/components/DateTimeInput. Props: value (DynamicString, ISO 8601,
// required — empty string until set), enableDate/enableTime (boolean, default false), min/max
// (DynamicString ISO, optional), label (DynamicString, optional). Expo-Go-safe JS fallback: a
// text field for the ISO string with a format-hint placeholder — no native date-picker module
// (ADR-0002). ponytail: min/max bounds aren't enforced (client-side validity has no error UI
// yet, same deferral as TextField's checks); wire when a validation-display task lands.
export function DateTimeInput({ node }: CatalogComponentProps) {
  const theme = useTheme();
  const surface = useSurface();
  const p = node.properties;
  const path = bindingPath(p.value);
  const value = useDynamicString(p.value);
  const label = useDynamicString(p.label);
  const placeholder =
    p.enableDate && !p.enableTime
      ? 'YYYY-MM-DD'
      : p.enableTime && !p.enableDate
        ? 'HH:MM'
        : 'YYYY-MM-DDTHH:MM';
  const onChangeText = path === null ? undefined : (text: string) => surface.setValue(path, text);
  return (
    <View>
      <FieldLabel text={label} />
      <TextInput
        accessibilityLabel={label || undefined}
        value={path === null ? undefined : value}
        defaultValue={path === null ? value : undefined}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.border}
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
