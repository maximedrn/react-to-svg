import type { Effect } from "effect";
import type { RenderError } from "@/render.errors.ts";
import type { RenderableComponent, RenderOptions } from "@/render.types.ts";

/**
 * The public surface of the render module.
 */
interface IRenderService {
  /**
   * Renders the component to an animated, theme-aware SVG string. I/O is left
   * to the caller — write it to disk, serve it over HTTP, or embed it.
   *
   * @param Component - The component to render.
   * @param options - The fonts and viewport for the render.
   *
   * @returns {Effect.Effect<string, RenderError>} The SVG markup.
   */
  readonly renderSVG: (
    Component: RenderableComponent,
    options: RenderOptions,
  ) => Effect.Effect<string, RenderError>;
}

export type { IRenderService };
