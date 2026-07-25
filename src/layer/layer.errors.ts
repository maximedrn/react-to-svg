import { Data } from "effect";

/**
 * Messages for {@link MeasureError}.
 */
const MeasureMessages = {
  failed: "Failed to measure the component layout.",
  scopeNotReached: "An animated scope was not reached by the layout pass.",
} as const;

/**
 * Messages for {@link RasterizeError}.
 */
const RasterizeMessages = {
  failed: "Failed to rasterize a layer.",
} as const;

/**
 * Raised when Satori fails to measure the resolved layout.
 */
class MeasureError extends Data.TaggedError("MeasureError")<{
  readonly cause: unknown;
  readonly message: string;
}> {}

/**
 * Raised when Satori fails to rasterize a projected layer.
 */
class RasterizeError extends Data.TaggedError("RasterizeError")<{
  readonly cause: unknown;
  readonly message: string;
}> {}

export { MeasureError, MeasureMessages, RasterizeError, RasterizeMessages };
