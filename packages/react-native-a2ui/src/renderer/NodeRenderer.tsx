import { Component, type ReactNode } from 'react';
import { useA2UI, useSurface } from './hooks';

/** Per-node error boundary: a crashing component renders nothing so the surface survives. */
class NodeErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** Renders one node by id: registry lookup (unknown → nothing + report), wrapped per node. */
export function NodeRenderer({ nodeId }: { nodeId: string }) {
  const surface = useSurface();
  const { registry, onUnknownComponent } = useA2UI();
  const node = surface.getNode(nodeId);
  if (!node) return null;

  const Renderer = registry[node.type];
  if (!Renderer) {
    onUnknownComponent?.(node.type);
    return null;
  }

  return (
    <NodeErrorBoundary>
      <Renderer node={node} />
    </NodeErrorBoundary>
  );
}
