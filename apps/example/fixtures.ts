// A representative handful of the official basic-catalog example streams (vendored, v0.9).
// These are test data, not part of the published library — imported by relative path for the
// demo gallery only. Metro bundles them because metro.config.js watches the repo root.
import complexLayout from '../../packages/react-native-a2ui/conformance/fixtures/v0_9/catalogs/basic/examples/00_complex-layout.json';
import interactiveButton from '../../packages/react-native-a2ui/conformance/fixtures/v0_9/catalogs/basic/examples/00_interactive-button.json';
import loginForm from '../../packages/react-native-a2ui/conformance/fixtures/v0_9/catalogs/basic/examples/00_simple-login-form.json';
import simpleText from '../../packages/react-native-a2ui/conformance/fixtures/v0_9/catalogs/basic/examples/00_simple-text.json';
import flightStatus from '../../packages/react-native-a2ui/conformance/fixtures/v0_9/catalogs/basic/examples/01_flight-status.json';
import incrementalDashboard from '../../packages/react-native-a2ui/conformance/fixtures/v0_9/catalogs/basic/examples/31_incremental-dashboard.json';

export type FixtureStream = {
  readonly name: string;
  readonly description: string;
  readonly messages: readonly unknown[];
};

/** Streams shown in the gallery, ordered simplest → richest. */
export const FIXTURES: readonly FixtureStream[] = [
  simpleText,
  complexLayout,
  interactiveButton,
  loginForm,
  flightStatus,
  incrementalDashboard,
] as FixtureStream[];

/** The `createSurface.surfaceId` from a stream, or undefined. */
export function surfaceIdOf(messages: readonly unknown[]): string | undefined {
  for (const m of messages) {
    if (m && typeof m === 'object' && 'createSurface' in m) {
      const cs = (m as { createSurface: unknown }).createSurface;
      if (cs && typeof cs === 'object' && 'surfaceId' in cs) {
        const id = (cs as { surfaceId: unknown }).surfaceId;
        if (typeof id === 'string') return id;
      }
    }
  }
  return undefined;
}
