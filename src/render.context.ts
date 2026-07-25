import { Context } from "effect";
import type { IRenderService } from "@/render.interface.ts";

/**
 * Effect service tag used to provide and require the {@link IRenderService}.
 */
class RenderService extends Context.Tag("RenderService")<
  RenderService,
  IRenderService
>() {}

export { RenderService };
