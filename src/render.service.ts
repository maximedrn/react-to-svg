import type { Effect } from "effect";
import type { RenderError } from "@/render.errors.ts";
import type { IRenderService } from "@/render.interface.ts";
import { renderDocument } from "@/render.pipeline.ts";
import theme from "@/render.theme.css" with { type: "text" };
import type { RenderableComponent, RenderOptions } from "@/render.types.ts";

/**
 * Builds the live render service. The theme stylesheet is imported as text and
 * carried into every document; the service performs no I/O, returning the SVG
 * markup for the caller to write, serve or embed.
 *
 * @returns {IRenderService} A service that renders components to SVG strings.
 */
const makeRenderService: () => IRenderService = (): IRenderService => ({
  renderSVG: (
    Component: RenderableComponent,
    options: RenderOptions,
  ): Effect.Effect<string, RenderError> =>
    renderDocument(Component, options, theme),
});

export { makeRenderService };
