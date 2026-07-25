/**
 * Fixed values the react-reconciler host config returns, grouped so call sites
 * reference a named key instead of a bare number.
 */
const Reconciler = {
  /**
   * Sentinel for `resolveEventTimeStamp` when there is no real event time.
   */
  noEventTimeStamp: -1.1,
} as const;

export { Reconciler };
