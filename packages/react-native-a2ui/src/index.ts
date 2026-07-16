/**
 * react-native-a2ui — React Native renderer for Google's A2UI protocol.
 *
 * Public API: the renderer (`A2UIProvider`/`Surface`), the basic catalog, the catalog
 * registry contract, the theme layer, and the protocol-neutral engine types.
 */
export const VERSION = '0.0.0';

// Basic catalog (ADR-0002: plain RN primitives + theme tokens, no UI deps)
export {
  AudioPlayer,
  Button,
  basicCatalog,
  Card,
  CheckBox,
  ChoicePicker,
  Column,
  DateTimeInput,
  Divider,
  Icon,
  Image,
  List,
  Modal,
  Row,
  Slider,
  Tabs,
  Text,
  TextField,
  Video,
} from './catalog';

// A2UI engine (the only web_core-backed ProtocolEngine; ADR-0005 boundary stays intact —
// this re-exposes a factory from src/engine/a2ui/, consumers never import web_core directly)
export { createA2uiEngine } from './engine/a2ui/A2uiEngine';
// Protocol-neutral engine contract (ADR-0005)
export type {
  ClientCapabilities,
  ClientMessage,
  ComponentNode,
  ProtocolEngine,
  SurfaceHandle,
  SurfaceTheme,
  Unsubscribe,
} from './engine/types';
// Renderer
export { A2UIProvider, type A2UIProviderProps } from './renderer/A2UIProvider';
export { type A2UIContextValue, useSurface, useValue } from './renderer/hooks';
export { NodeRenderer } from './renderer/NodeRenderer';
export type {
  CatalogComponent,
  CatalogComponentProps,
  ComponentRegistry,
} from './renderer/registry';
export { Surface, type SurfaceProps } from './renderer/Surface';
// Theme
export { A2UIThemeProvider, type A2UIThemeProviderProps, useTheme } from './theme/ThemeContext';
export {
  DARK_THEME,
  type DeepPartial,
  LIGHT_THEME,
  type ResolveThemeInput,
  resolveTheme,
  type Theme,
} from './theme/tokens';
