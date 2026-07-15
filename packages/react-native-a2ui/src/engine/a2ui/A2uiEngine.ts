// The ONLY module allowed to import @a2ui/web_core (ADR-0005). Everything above the
// engine boundary speaks the ProtocolEngine interface in ../types.
// v0.9 lives under the `/v0_9` subpath — a bare import resolves to v0_8.

import type { A2uiClientAction } from '@a2ui/web_core/v0_9';
import {
  A2uiMessageSchema,
  BASIC_COMPONENTS,
  BASIC_FUNCTIONS,
  Catalog,
  MessageProcessor,
} from '@a2ui/web_core/v0_9';
import type {
  ClientMessage,
  ProtocolEngine,
  SurfaceHandle,
  SurfaceTheme,
  Unsubscribe,
} from '../types';

// The basic catalog's id; must equal the server's createSurface.catalogId.
// Source: conformance/fixtures/v0_9/catalogs/basic/catalog.json (`catalogId`).
const BASIC_CATALOG_ID = 'https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json';

/** ProtocolEngine implementation #1: adapts @a2ui/web_core's MessageProcessor. */
export class A2uiEngine implements ProtocolEngine {
  readonly #outbound = new Set<(msg: ClientMessage) => void>();
  readonly #surfaceListeners = new Set<(ids: string[]) => void>();
  readonly #processor = new MessageProcessor(
    [new Catalog(BASIC_CATALOG_ID, BASIC_COMPONENTS, BASIC_FUNCTIONS)],
    (action) => this.#emitAction(action),
  );

  constructor() {
    this.#processor.onSurfaceCreated(() => this.#emitSurfaces());
    this.#processor.onSurfaceDeleted(() => this.#emitSurfaces());
  }

  processMessages(batch: unknown[]): void {
    // Non-transactional: validate and process each message on its own so one bad
    // message can neither abort the rest nor escape as a throw (SPEC §2.5).
    for (const raw of batch) {
      const parsed = A2uiMessageSchema.safeParse(raw);
      if (!parsed.success) {
        this.#emitError('INVALID_MESSAGE', parsed.error.message);
        continue;
      }
      try {
        this.#processor.processMessages([parsed.data]);
      } catch (err) {
        this.#emitError('PROCESSING_FAILED', err instanceof Error ? err.message : String(err));
      }
    }
  }

  getSurface(id: string): SurfaceHandle | undefined {
    const surface = this.#processor.model.getSurface(id);
    if (!surface) return undefined;
    return {
      theme: surface.theme as SurfaceTheme,
      getNode: (nodeId) => {
        const node = surface.componentsModel.get(nodeId);
        return node ? { id: node.id, type: node.type, properties: node.properties } : undefined;
      },
      subscribeValue: (pointer, cb) => {
        const sub = surface.dataModel.subscribe(pointer, cb);
        return () => sub.unsubscribe();
      },
      setValue: (pointer, value) => {
        surface.dataModel.set(pointer, value);
      },
      subscribeTree: (cb) => {
        if (surface.componentsModel.get('root')) cb(true);
        const sub = surface.componentsModel.onCreated.subscribe((node) => {
          if (node.id === 'root') cb(true);
        });
        return () => sub.unsubscribe();
      },
      // web_core expects an `{ event: { name, context } }` payload; it stamps the
      // surfaceId/timestamp and emits through the actionHandler wired above.
      dispatchAction: (name, sourceComponentId, context) => {
        void surface.dispatchAction({ event: { name, context: context ?? {} } }, sourceComponentId);
      },
    };
  }

  subscribeSurfaces(cb: (ids: string[]) => void): Unsubscribe {
    this.#surfaceListeners.add(cb);
    cb(this.#surfaceIds());
    return () => {
      this.#surfaceListeners.delete(cb);
    };
  }

  onClientMessage(cb: (msg: ClientMessage) => void): Unsubscribe {
    this.#outbound.add(cb);
    return () => {
      this.#outbound.delete(cb);
    };
  }

  #surfaceIds(): string[] {
    return [...this.#processor.model.surfacesMap.keys()];
  }

  #emitSurfaces(): void {
    const ids = this.#surfaceIds();
    for (const cb of this.#surfaceListeners) cb(ids);
  }

  #emitAction(action: A2uiClientAction): void {
    this.#emit({
      type: 'action',
      name: action.name,
      surfaceId: action.surfaceId,
      sourceComponentId: action.sourceComponentId,
      timestamp: action.timestamp,
      context: action.context,
    });
  }

  #emitError(code: string, message: string): void {
    this.#emit({ type: 'error', code, message });
  }

  #emit(msg: ClientMessage): void {
    for (const cb of this.#outbound) cb(msg);
  }
}
