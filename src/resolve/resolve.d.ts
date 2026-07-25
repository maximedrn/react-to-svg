/**
 * Ambient types for `react-reconciler`, which ships no declarations of its own
 * (there is no `@types/react-reconciler` for this major). Only the surface the
 * resolver actually drives is described here — enough to construct the renderer
 * without an `as any`, and without leaking `any` onto the reconciler handle.
 */

declare module "react-reconciler/constants.js" {
  /**
   * Priority the host config reports as its default update lane.
   */
  const DefaultEventPriority: number;

  export { DefaultEventPriority };
}

declare module "react-reconciler" {
  /**
   * Opaque container handle returned by {@link Reconciler.createContainer}.
   */
  type ReconcilerRoot = object;

  /**
   * The slice of the reconciler the resolver uses.
   */
  interface Reconciler {
    readonly createContainer: (
      containerInfo: unknown,
      tag: number,
      hydrationCallbacks: null,
      isStrictMode: boolean,
      concurrentUpdatesByDefaultOverride: null,
      identifierPrefix: string,
      onUncaughtError: (error: unknown) => void,
      onCaughtError: (error: unknown) => void,
      onRecoverableError: (error: unknown) => void,
      onDefaultTransitionIndicator: () => void,
    ) => ReconcilerRoot;
    readonly flushSyncWork: () => void;
    readonly updateContainerSync: (
      element: import("react").ReactNode,
      container: ReconcilerRoot,
      parentComponent: null,
      callback: null,
    ) => void;
  }

  /**
   * Builds a renderer from a host config.
   *
   * @param {unknown} config - The host config (see `resolve.host.ts`).
   *
   * @returns {Reconciler} A reconciler bound to that config.
   */
  const createReconciler: (config: unknown) => Reconciler;

  export default createReconciler;
  export type { Reconciler, ReconcilerRoot };
}
