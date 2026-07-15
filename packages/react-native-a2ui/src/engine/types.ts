// The modularity boundary (ADR-0005): the renderer, catalog, and transports depend
// only on these types. `A2uiEngine` (src/engine/a2ui/) is implementation #1 and the
// only module that imports @a2ui/web_core. This file imports nothing — no web_core,
// no React/RN — so the interface stays protocol-neutral.

/** Tears down a subscription. */
export type Unsubscribe = () => void;

/** A component in a surface's tree as the renderer sees it — never a web_core type. */
export interface ComponentNode {
  readonly id: string;
  readonly type: string;
  readonly properties: Record<string, unknown>;
}

/** Opaque, catalog-defined theme token object, passed straight through from the wire. */
export type SurfaceTheme = Record<string, unknown> | undefined;

/** An outbound client→server message: a user action or a client-side error. */
export type ClientMessage =
  | {
      readonly type: 'action';
      readonly name: string;
      readonly surfaceId: string;
      readonly sourceComponentId: string;
      readonly timestamp: string;
      readonly context: Record<string, unknown>;
    }
  | {
      readonly type: 'error';
      readonly surfaceId?: string;
      readonly code: string;
      readonly message: string;
    };

/** A live view over one surface: its tree, data bindings, and action dispatch. */
export interface SurfaceHandle {
  /** Fires `true` once the surface's `root` component exists (progressive streaming). */
  subscribeTree(cb: (rootReady: boolean) => void): Unsubscribe;
  /** The component with this id, or undefined if not (yet) present. */
  getNode(id: string): ComponentNode | undefined;
  /** Observes a JSON-pointer path; the callback fires on every change to it. */
  subscribeValue(pointer: string, cb: (value: unknown) => void): Unsubscribe;
  /** Writes a value at a JSON-pointer path (two-way inputs). */
  setValue(pointer: string, value: unknown): void;
  /** Dispatches an action; the resulting outbound message reaches `onClientMessage`. */
  dispatchAction(name: string, sourceComponentId: string, context?: Record<string, unknown>): void;
  /** The surface's theme token object. */
  readonly theme: SurfaceTheme;
}

/** The thin protocol contract the renderer speaks; A2UI is one implementation. */
export interface ProtocolEngine {
  /** Feeds one parsed server→client batch. Non-transactional; never throws on bad input. */
  processMessages(batch: unknown[]): void;
  /** The live surface with this id, or undefined if it does not exist. */
  getSurface(id: string): SurfaceHandle | undefined;
  /** Observes the set of live surface ids; fires immediately and on every change. */
  subscribeSurfaces(cb: (ids: string[]) => void): Unsubscribe;
  /** Observes outbound client→server messages (actions, errors). */
  onClientMessage(cb: (msg: ClientMessage) => void): Unsubscribe;
}
