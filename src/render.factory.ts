import { Layer } from "effect";
import { RenderService } from "@/render.context.ts";
import { makeRenderService } from "@/render.service.ts";

/**
 * The live `RenderService` layer, backed by {@link makeRenderService}.
 */
const RenderServiceLive: Layer.Layer<RenderService> = Layer.succeed(
  RenderService,
  makeRenderService(),
);

export { RenderServiceLive };
