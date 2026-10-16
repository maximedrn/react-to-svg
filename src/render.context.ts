import { Context } from "effect";
import type { IRenderService } from "@/render.interface.ts";

/**
 * Effect service key used to provide and require the {@link IRenderService}.
 */
class RenderService extends Context.Service<RenderService, IRenderService>()(
  "RenderService",
) {}

export { RenderService };
