import type { ComposeError } from "@/compose/compose.errors.ts";
import type { MeasureError, RasterizeError } from "@/layer/layer.errors.ts";
import type { ResolveError } from "@/resolve/resolve.errors.ts";

/**
 * Every error the render pipeline can fail with.
 */
type RenderError = ComposeError | MeasureError | RasterizeError | ResolveError;

export type { RenderError };
