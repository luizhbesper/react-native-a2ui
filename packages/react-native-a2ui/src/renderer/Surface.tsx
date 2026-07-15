import { useEffect, useState } from 'react';
import { A2UIThemeProvider } from '../theme/ThemeContext';
import { SurfaceContextProvider, useA2UI } from './hooks';
import { NodeRenderer } from './NodeRenderer';

export interface SurfaceProps {
  /** The surface to render; matches a server `createSurface.surfaceId`. */
  surfaceId: string;
}

/**
 * Renders one live surface. Nothing paints until the surface exists and its `root` node
 * arrives (progressive streaming); then the tree renders under the surface's resolved theme.
 */
export function Surface({ surfaceId }: SurfaceProps) {
  const { engine, theme } = useA2UI();
  const [handle, setHandle] = useState(() => engine.getSurface(surfaceId));
  const [rootReady, setRootReady] = useState(false);

  // The surface may be created after this mounts (its createSurface streams in later).
  useEffect(
    () => engine.subscribeSurfaces(() => setHandle(engine.getSurface(surfaceId))),
    [engine, surfaceId],
  );

  useEffect(() => {
    if (!handle) {
      setRootReady(false);
      return;
    }
    return handle.subscribeTree(setRootReady);
  }, [handle]);

  if (!handle || !rootReady) return null;
  return (
    <A2UIThemeProvider theme={theme} surfaceTheme={handle.theme}>
      <SurfaceContextProvider value={handle}>
        <NodeRenderer nodeId="root" />
      </SurfaceContextProvider>
    </A2UIThemeProvider>
  );
}
